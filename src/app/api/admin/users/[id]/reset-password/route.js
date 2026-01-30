import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { newPassword } = await req.json();

        if (!newPassword || newPassword.length < 4) {
            return NextResponse.json({ error: "Password too short" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
