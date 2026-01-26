const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log("Verifying User Data...");

    // 1. Fetch a few users that SHOULD have hierarchy
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'PLAYER' },
                { role: 'AGENT' }
            ]
        },
        take: 5,
        include: {
            agent: true,
            superAgent: true,
            gameSessions: true
        }
    });

    console.log(`Found ${users.length} sample users.`);

    for (const u of users) {
        if (!u.agentId && !u.superAgentId && u.role === 'PLAYER') {
            console.log(`[WARNING] Player ${u.code} (${u.name}) has NO agent or superAgent linked!`);
        } else {
            console.log(`[OK] User ${u.code} linked to Agent: ${u.agent?.name} (${u.agentId}), SuperAgent: ${u.superAgent?.name} (${u.superAgentId})`);
        }

        const rake = u.gameSessions.reduce((sum, gs) => sum + (gs.rake || 0), 0);
        console.log(`\tGame Sessions: ${u.gameSessions.length}, Total Rake: ${rake}, Rakeback %: ${u.rakeback}`);
    }

    // 2. Find ANY GameSession with rake > 0
    const activeSession = await prisma.gameSession.findFirst({
        where: { rake: { gt: 0 } },
        include: { user: true }
    });

    if (activeSession) {
        console.log(`[FOUND] Active Session: User ${activeSession.user.code}, Rake: ${activeSession.rake}, PnL: ${activeSession.pnl}`);
    } else {
        console.log(`[ERROR] No GameSessions with rake > 0 found in the entire DB!`);
    }

    // 3. Count total sessions
    const count = await prisma.gameSession.count();
    console.log(`Total GameSessions in DB: ${count}`);
}

verify()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
