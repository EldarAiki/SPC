const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Mocking the authorize logic from the route file to test it in isolation
// validating the exact same steps
async function testAuthorize() {
    const prisma = new PrismaClient();
    try {
        const credentials = { code: 'ADMIN', password: 'admin123' };

        console.log("Testing Authorize with:", credentials);

        const user = await prisma.user.findUnique({
            where: { code: credentials.code },
        });

        console.log("User found:", user);

        if (!user || !user.password) {
            console.error("User not found or no password");
            return;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log("Password valid:", isValid);

        if (isValid) {
            console.log("SUCCESS: Credentials are valid.");
        } else {
            console.error("FAILURE: Password invalid.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testAuthorize();
