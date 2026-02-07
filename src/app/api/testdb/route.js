import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({ take: 10 });
        return NextResponse.json({ ok: true, users });
    } catch (e) {
        console.error("DB ERROR:", e);
        return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
}