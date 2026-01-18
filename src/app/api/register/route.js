import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { code, password } = await req.json();

        if (!code || !password) {
            return NextResponse.json({ error: "Code and password required" }, { status: 400 });
        }

        // Check user
        const user = await prisma.user.findUnique({
            where: { code }
        });

        if (!user) {
            return NextResponse.json({ error: "Player code not found in system. Please ask your manager to add you." }, { status: 404 });
        }

        if (user.password) {
            return NextResponse.json({ error: "Account already registered. Please login." }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { code },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: "Registration successful" });

    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
}
