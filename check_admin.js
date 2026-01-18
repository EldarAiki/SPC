const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    try {
        const user = await prisma.user.findUnique({
            where: { code: 'ADMIN' },
        });

        console.log('User found:', user);

        if (user && user.password) {
            const isValid = await bcrypt.compare('admin123', user.password);
            console.log('Password "admin123" matches:', isValid);
        } else {
            console.log("User has no password or doesn't exist.");
        }

    } catch (error) {
        console.error('Error connecting to DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
