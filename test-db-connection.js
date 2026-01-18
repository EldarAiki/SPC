const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting DB connection test...');
    const start = Date.now();
    try {
        await prisma.$connect();
        console.log(`Connected to DB in ${Date.now() - start}ms`);

        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);
    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
        console.log('Disconnected.');
    }
}

main();
