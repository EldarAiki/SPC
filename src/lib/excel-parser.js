import ExcelJS from 'exceljs';
import prisma from './prisma';

// Helper to process promises in chunks to prevent DB connection pool exhaustion
async function runInChunks(items, chunkSize, asyncCallback) {
    const results = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(asyncCallback));
        results.push(...chunkResults);
    }
    return results;
}

export async function parseAndImport(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // ==================================================
    // 1. IMPORT USERS (Optimized)
    // ==================================================
    const memberSheet = workbook.getWorksheet('Union Member Statistics');
    let importedUsers = 0;

    if (memberSheet) {
        // 1. Read all rows into a Map to deduplicate immediately
        // We use a Map to ensure we only process each unique User Code once
        const uniqueUsers = new Map(); // Key: Code, Value: { name, role, parentCode }

        memberSheet.eachRow((row, rowNumber) => {
            if (rowNumber < 7) return;

            const saId = row.getCell(3).value?.toString()?.trim();
            const saName = row.getCell(4).value?.toString()?.trim();
            const agentId = row.getCell(5).value?.toString()?.trim();
            const agentName = row.getCell(6).value?.toString()?.trim();
            const playerId = row.getCell(9).value?.toString()?.trim();
            const playerName = row.getCell(10).value?.toString()?.trim();

            if (saId && saId !== '0') uniqueUsers.set(saId, { code: saId, name: saName, role: 'SUPER_AGENT', parentCode: null });
            if (agentId) uniqueUsers.set(agentId, { code: agentId, name: agentName, role: 'AGENT', parentCode: saId !== '0' ? saId : null });
            if (playerId) uniqueUsers.set(playerId, { code: playerId, name: playerName, role: 'PLAYER', parentCode: agentId });
        });

        const allUserCodes = Array.from(uniqueUsers.keys());

        // 2. Fetch ALL existing users in one query
        const existingUsers = await prisma.user.findMany({
            where: { code: { in: allUserCodes } },
            select: { id: true, code: true }
        });

        const existingUserMap = new Map(existingUsers.map(u => [u.code, u.id]));
        const usersToCreate = [];
        const usersToUpdate = [];

        // 3. Separate Create vs Update
        for (const [code, data] of uniqueUsers) {
            if (existingUserMap.has(code)) {
                usersToUpdate.push(data);
            } else {
                usersToCreate.push(data);
            }
        }

        // 4. Batch Create New Users (Prisma createMany is massive speedup)
        // Note: createMany cannot handle relations (parent/child) easily in one go if IDs are auto-generated.
        // Strategy: Create them, then refetch to link parents.
        if (usersToCreate.length > 0) {
            await prisma.user.createMany({
                data: usersToCreate.map(u => ({
                    code: u.code,
                    name: u.name,
                    role: u.role,
                    balance: 0 // Default
                })),
                skipDuplicates: true
            });
            importedUsers += usersToCreate.length;
        }

        // 5. Hierarchy Linking & Name Updates
        // Since hierarchy logic is complex with Upserts, we run these in chunks of 50 concurrently
        // instead of 1 by 1.
        const allUsersList = [...usersToCreate, ...usersToUpdate];

        // Re-fetch all IDs (including newly created ones) to establish relations
        const finalUserFetch = await prisma.user.findMany({
            where: { code: { in: allUserCodes } },
            select: { id: true, code: true }
        });
        const codeToId = new Map(finalUserFetch.map(u => [u.code, u.id]));

        // Create update payloads
        const updatePromises = allUsersList.map(u => {
            const dbId = codeToId.get(u.code);
            const parentId = u.parentCode ? codeToId.get(u.parentCode) : null;

            // Only update if we have a parent to link or name changed
            return prisma.user.update({
                where: { id: dbId },
                data: {
                    name: u.name,
                    // Determine relation field based on role logic
                    agentId: (u.role === 'PLAYER' && parentId) ? parentId : undefined,
                    superAgentId: (u.role === 'AGENT' && parentId) ? parentId : undefined
                }
            });
        });

        // Execute updates in parallel chunks (e.g., 50 at a time)
        await runInChunks(updatePromises, 50, (p) => p);
    }

    // ==================================================
    // 2. IMPORT GAMES (Optimized)
    // ==================================================
    const gameSheet = workbook.getWorksheet('Union Ring Game Detail');
    let importedGames = 0;

    if (gameSheet) {
        // --- Date Parsing (Same as before) ---
        const dateCell = gameSheet.getCell('A1').value;
        let sessionDate = new Date();
        if (dateCell) {
            const dateStr = dateCell.toString().split(' ')[0];
            const parsed = new Date(dateStr);
            if (!isNaN(parsed)) sessionDate = parsed;
        }

        const dateStart = new Date(sessionDate); dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(sessionDate); dateEnd.setHours(23, 59, 59, 999);

        // --- NEW: Ensure Cycle Exists ---
        let currentCycle = await prisma.cycle.findFirst({
            where: { status: 'OPEN' },
            orderBy: { startDate: 'desc' }
        });

        if (!currentCycle) {
            currentCycle = await prisma.cycle.create({
                data: { status: 'OPEN' }
            });
        }

        // --- Optimization: Aggregate Revert Balance ---
        // Instead of looping sessions to decrement, aggregate PnL per user
        const sessionsToDelete = await prisma.gameSession.groupBy({
            by: ['userId'],
            where: { date: { gte: dateStart, lte: dateEnd } },
            _sum: { pnl: true }
        });

        // Bulk Revert Balances
        await runInChunks(sessionsToDelete, 50, async (group) => {
            if (group._sum.pnl) {
                await prisma.user.update({
                    where: { id: group.userId },
                    data: { balance: { decrement: group._sum.pnl } }
                });
            }
        });

        // Delete sessions
        await prisma.gameSession.deleteMany({
            where: { date: { gte: dateStart, lte: dateEnd } }
        });

        // --- Parse Game Rows ---
        let currentTable = null;
        const gameRows = [];
        const involvedUserCodes = new Set();

        gameSheet.eachRow((row, rowNumber) => {
            if (rowNumber < 3) return;
            const cellA = row.getCell(1).value?.toString();
            if (cellA && cellA.includes('Table Name :')) {
                currentTable = cellA.split(',')[0].replace('Table Name :', '').trim();
                return;
            }
            if (!currentTable) return;

            const playerId = row.getCell(3).value?.toString()?.trim();
            if (playerId && /^[\d-]+$/.test(playerId)) {
                gameRows.push({
                    userIdCode: playerId,
                    date: sessionDate,
                    tableName: currentTable,
                    buyIn: parseFloat(row.getCell(5).value || 0),
                    cashOut: parseFloat(row.getCell(6).value || 0),
                    hands: parseInt(row.getCell(7).value || 0),
                    rake: parseFloat(row.getCell(13).value || 0),
                    pnl: parseFloat(row.getCell(14).value || 0),
                });
                involvedUserCodes.add(playerId);
            }
        });

        // --- Bulk Map Users ---
        const dbUsers = await prisma.user.findMany({
            where: { code: { in: Array.from(involvedUserCodes) } },
            select: { id: true, code: true }
        });
        const codeToIdMap = {};
        dbUsers.forEach(u => codeToIdMap[u.code] = u.id);

        // --- Prepare Data for createMany ---
        const sessionsToInsert = [];
        const userBalanceUpdates = {}; // Map: userId -> netPnl

        for (const game of gameRows) {
            const dbUserId = codeToIdMap[game.userIdCode];
            if (dbUserId) {
                // 1. Prepare Session Insert
                sessionsToInsert.push({
                    userId: dbUserId,
                    date: game.date,
                    tableName: game.tableName,
                    buyIn: game.buyIn,
                    cashOut: game.cashOut,
                    pnl: game.pnl,
                    hands: game.hands,
                    rake: game.rake,
                    cycleId: currentCycle.id
                });

                // 2. Aggregate Balance (Don't call DB yet)
                if (!userBalanceUpdates[dbUserId]) userBalanceUpdates[dbUserId] = 0;
                userBalanceUpdates[dbUserId] += game.pnl;
            }
        }

        // --- Batch Insert Sessions ---
        // createMany is vastly faster than loop create
        if (sessionsToInsert.length > 0) {
            await prisma.gameSession.createMany({
                data: sessionsToInsert
            });
            importedGames = sessionsToInsert.length;
        }

        // --- Batch Update Balances ---
        // Convert the aggregate object to an array for processing
        const balanceUpdatesArray = Object.entries(userBalanceUpdates).map(([userId, netPnl]) => ({
            userId,
            netPnl
        }));

        // Run updates concurrently in chunks
        await runInChunks(balanceUpdatesArray, 50, async (item) => {
            if (item.netPnl !== 0) {
                await prisma.user.update({
                    where: { id: item.userId },
                    data: { balance: { increment: item.netPnl } }
                });
            }
        });
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