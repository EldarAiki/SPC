import ExcelJS from 'exceljs';
import prisma from './prisma';

export async function parseAndImport(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // --- 1. Import Users from 'Union Member Statistics' ---
    const memberSheet = workbook.getWorksheet('Union Member Statistics');
    let importedUsers = 0;

    if (memberSheet) {
        // Determine header positions (assuming fixed layout for now based on exploration)
        // Data starts around Row 7 (1-based)

        // We iterate rows starting from 7
        memberSheet.eachRow((row, rowNumber) => {
            if (rowNumber < 7) return; // Skip headers

            // Col 3: Super Agent ID, Col 4: SA Name
            // Col 5: Agent ID, Col 6: Agent Name
            // Col 9: Player ID, Col 10: Player Name

            const saId = row.getCell(3).value?.toString()?.trim();
            const saName = row.getCell(4).value?.toString()?.trim();

            const agentId = row.getCell(5).value?.toString()?.trim();
            const agentName = row.getCell(6).value?.toString()?.trim();

            const playerId = row.getCell(9).value?.toString()?.trim();
            const playerName = row.getCell(10).value?.toString()?.trim();

            // Logic to create users hierarchy
            // We push promises or process sequentially. Sequential is safer for database locks/relations.

            // We will store tasks to run in transaction or just run them.
            // Since we need to ensure agents exist before linking players, we might need multiple passes or simple checks.
            // Upsert is good.
        });

        // Optimization: Read all rows into memory structure, then upsert Agents, then Players.
        const hierarchy = [];
        memberSheet.eachRow((row, rowNumber) => {
            if (rowNumber < 7) return;
            const saId = row.getCell(3).value?.toString()?.trim();
            const saName = row.getCell(4).value?.toString()?.trim();
            const agentId = row.getCell(5).value?.toString()?.trim();
            const agentName = row.getCell(6).value?.toString()?.trim();
            const playerId = row.getCell(9).value?.toString()?.trim();
            const playerName = row.getCell(10).value?.toString()?.trim();

            if (playerId) { // Ensure valid row
                hierarchy.push({ saId, saName, agentId, agentName, playerId, playerName });
            }
        });

        // Process Hierarchy
        for (const item of hierarchy) {
            // 1. Super Agent
            let dbSA = null;
            if (item.saId && item.saId !== '0') { // 0 or empty might mean none
                try {
                    dbSA = await prisma.user.upsert({
                        where: { code: item.saId },
                        update: { name: item.saName, role: 'SUPER_AGENT' },
                        create: { code: item.saId, name: item.saName, role: 'SUPER_AGENT' }
                    });
                } catch (e) { console.error("Error upserting SA", e); }
            }

            // 2. Agent
            let dbAgent = null;
            if (item.agentId) {
                try {
                    const agentData = {
                        name: item.agentName,
                        role: dbSA ? 'AGENT' : 'AGENT', // Could be just AGENT
                        superAgentId: dbSA ? dbSA.id : null
                    };
                    dbAgent = await prisma.user.upsert({
                        where: { code: item.agentId },
                        update: agentData,
                        create: { code: item.agentId, ...agentData }
                    });
                } catch (e) { console.error("Error upserting Agent", e); }
            }

            // 3. Player
            if (item.playerId) {
                try {
                    const playerData = {
                        name: item.playerName,
                        role: 'PLAYER',
                        agentId: dbAgent ? dbAgent.id : null,
                        superAgentId: dbSA ? dbSA.id : null // Direct link for easier query? Or rely on Agent? 
                        // Hierarchy: Super -> Agent -> Player. 
                        // User query usually: Players under Agent. 
                        // If Super Agent looks for players, they look for Agents -> Players.
                        // Schema has superAgentId on Player?
                        // My schema: superAgent    User?   @relation("SuperAgentItems"...).
                        // Yes, I can link player to super agent directly for optimization or just rely on chained.
                        // I will link directly if schema supports it, easier for "All my players" query.
                    };

                    // If the player is also an agent (in hierarchy list as agent elsewhere), we shouldn't downgrade role to PLAYER if it's already AGENT?
                    // But here we are processing a "Member" row.
                    // A user can be Agent and Player.
                    // Safest: Don't overwrite role if it is 'AGENT' or 'SUPER_AGENT'.
                    // But this file defines the specific role for this row.
                    // Let's assume we just ensure existence. Using 'PLAYER' as default role on create, but if exists, keep role?
                    // Code above sets 'SUPER_AGENT' and 'AGENT'.

                    // We typically upsert logic:
                    // If exists: update name, relations.
                    // Create: Role = PLAYER.

                    await prisma.user.upsert({
                        where: { code: item.playerId },
                        update: {
                            name: item.playerName,
                            agentId: dbAgent ? dbAgent.id : null,
                            superAgentId: dbSA ? dbSA.id : null
                        },
                        create: {
                            code: item.playerId,
                            name: item.playerName,
                            role: 'PLAYER',
                            agentId: dbAgent ? dbAgent.id : null,
                            superAgentId: dbSA ? dbSA.id : null
                        }
                    });
                    importedUsers++;
                } catch (e) { console.error("Error upserting Player", e); }
            }
        }
    }

    // --- 2. Import Game Sessions from 'Union Ring Game Detail' ---
    const gameSheet = workbook.getWorksheet('Union Ring Game Detail');
    let importedGames = 0;

    if (gameSheet) {
        // 1. Get Date
        const dateCell = gameSheet.getCell('A1').value;
        let sessionDate = new Date(); // Default
        if (dateCell) {
            // Format expected: "Period : 2025-08-07 ~ ..." or "2025-08-07 (UTC...)"
            // User file: "2025-08-07 (UTC -5:00)"
            const dateStr = dateCell.toString().split(' ')[0]; // Extract 2025-08-07
            const parsed = new Date(dateStr);
            if (!isNaN(parsed)) sessionDate = parsed;
        }

        console.log("Processing Date:", sessionDate);

        // 2. Delete Existing Sessions for this Date (Duplication Prevention)
        const dateStart = new Date(sessionDate); dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(sessionDate); dateEnd.setHours(23, 59, 59, 999);

        // Fetch existing sessions to revert balance
        const existingSessions = await prisma.gameSession.findMany({
            where: {
                date: {
                    gte: dateStart,
                    lte: dateEnd
                }
            }
        });

        // Revert Balance
        for (const session of existingSessions) {
            await prisma.user.update({
                where: { id: session.userId },
                data: { balance: { decrement: session.pnl } }
            });
        }

        await prisma.gameSession.deleteMany({
            where: {
                date: {
                    gte: dateStart,
                    lte: dateEnd
                }
            }
        });
        console.log(`Reverted balances for ${existingSessions.length} sessions and deleted them.`);

        // 3. Iterate Rows
        let currentTable = null;
        const gameRows = [];

        gameSheet.eachRow((row, rowNumber) => {
            if (rowNumber < 3) return;

            const cellA = row.getCell(1).value?.toString();

            // Check for Table Name
            if (cellA && cellA.includes('Table Name :')) {
                currentTable = cellA.split(',')[0].replace('Table Name :', '').trim();
                return;
            }

            if (!currentTable) return;

            // Check for Data Row
            const playerId = row.getCell(3).value?.toString()?.trim();
            if (playerId && /^[\d-]+$/.test(playerId)) { // Numeric ID allowing hyphens
                // It's a player row
                const buyIn = parseFloat(row.getCell(5).value || 0);
                const cashOut = parseFloat(row.getCell(6).value || 0);
                const hands = parseInt(row.getCell(7).value || 0);
                const rake = parseFloat(row.getCell(13).value || 0);
                const pnl = parseFloat(row.getCell(14).value || 0);

                gameRows.push({
                    userId: playerId, // We rely on code matching userId
                    date: sessionDate,
                    tableName: currentTable,
                    buyIn,
                    cashOut,
                    hands,
                    rake,
                    pnl
                });
            }
        });

        console.log(`[Parser] Found ${gameRows.length} game rows.`);

        // Create Map
        const codes = gameRows.map(r => r.userId);
        const uniqueCodes = [...new Set(codes)];
        console.log(`[Parser] Unique player codes found: ${uniqueCodes.length}`);

        const users = await prisma.user.findMany({
            where: { code: { in: uniqueCodes } },
            select: { id: true, code: true }
        });

        console.log(`[Parser] Matched ${users.length} users in DB.`);
        const codeToId = {};
        users.forEach(u => codeToId[u.code] = u.id);

        for (const game of gameRows) {
            const dbUserId = codeToId[game.userId];
            if (dbUserId) {
                await prisma.gameSession.create({
                    data: {
                        userId: dbUserId,
                        date: game.date,
                        tableName: game.tableName,
                        buyIn: game.buyIn,
                        cashOut: game.cashOut,
                        pnl: game.pnl,
                        hands: game.hands,
                        rake: game.rake
                    }
                });
                importedGames++;

                await prisma.user.update({
                    where: { id: dbUserId },
                    data: {
                        balance: { increment: game.pnl }
                    }
                });
            } else {
                // console.warn(`[Parser] User Code ${game.userId} not found in DB. Skipping game.`);
            }
        }

        console.log(`[Parser] Successfully imported ${importedGames} games.`);
    }

    // --- 3. Create Import Log ---
    try {
        await prisma.importLog.create({
            data: {
                fileName: "Upload",
                periodStart: new Date(),
                periodEnd: new Date(), // <--- Added this required field back
                status: "SUCCESS"
            }
        });
    } catch (e) { console.error("Failed to create ImportLog", e); }

    return { users: importedUsers, games: importedGames };
}
