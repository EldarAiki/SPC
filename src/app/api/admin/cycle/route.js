import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Find the current open cycle
        const currentCycle = await prisma.cycle.findFirst({
            where: { status: "OPEN" },
            orderBy: { startDate: 'desc' }
        });

        if (currentCycle) {
            // 2. Close it
            await prisma.cycle.update({
                where: { id: currentCycle.id },
                data: {
                    endDate: new Date(),
                    status: "CLOSED"
                }
            });
        }

        // 3. Create a new one (regardless if one was closed or not, we start fresh)

        // 3. Create a new one
        await prisma.cycle.create({
            data: {
                startDate: new Date(),
                status: "OPEN"
            }
        });

        return NextResponse.json({ success: true, message: "Cycle closed and new cycle started." });
    } catch (error) {
        return NextResponse.json({ error: "Cycle action failed" }, { status: 500 });
    }
}
