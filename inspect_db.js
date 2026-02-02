
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessions() {
    console.log("--- Latest Sessions ---");
    const sessions = await prisma.gameSession.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { code: true, name: true } } }
    });

    sessions.forEach(s => {
        console.log(`User: ${s.user.name} (${s.user.code}) | Table: ${s.tableName} | PnL: ${s.pnl} | Rake: ${s.rake}`);
    });

    const summary = await prisma.gameSession.groupBy({
        by: ['tableName'],
        _count: { id: true },
        _sum: { pnl: true, rake: true }
    });

    console.log("\n--- Session Summary by Table Name ---");
    summary.forEach(s => {
        console.log(`${s.tableName}: count=${s._count.id}, pnlSum=${s._sum.pnl}, rakeSum=${s._sum.rake}`);
    });

    await prisma.$disconnect();
}

checkSessions().catch(console.error);
