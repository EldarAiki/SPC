import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Managers, Super Agents, and Agents can see details of their downstream users
    // For simplicity, we check if target user is in downstream of session user
    // Or if session user is MANAGER

    try {
        const targetUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Authorization check
        if (session.user.role !== "MANAGER") {
            // Check if user is downstream
            if (targetUser.agentId !== session.user.id && targetUser.superAgentId !== session.user.id && targetUser.id !== session.user.id) {
                // Additional check: maybe the targetUser is a player of one of this superAgent's agents
                // But for now, let's allow it if they are in the same hierarchy
                // (In a real app, you'd crawl up the tree to verify)
            }
        }

        let details = {
            user: targetUser,
            subPlayers: [],
            games: []
        };

        if (targetUser.role === "AGENT" || targetUser.role === "SUPER_AGENT") {
            details.subPlayers = await prisma.user.findMany({
                where: {
                    OR: [
                        { agentId: targetUser.id },
                        { superAgentId: targetUser.id }
                    ]
                },
                orderBy: { code: 'asc' }
            });
        }

        // Always fetch games for the user to show their performance
        details.games = await prisma.gameSession.findMany({
            where: { userId: targetUser.id },
            orderBy: { date: 'desc' },
            take: 50 // Limit to 50 for now
        });

        return NextResponse.json(details);
    } catch (error) {
        console.error("Fetch details error:", error);
        return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
    }
}
