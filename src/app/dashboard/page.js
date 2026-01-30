import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import PlayerView from "@/components/dashboard/player-view";
import AgentView from "@/components/dashboard/agent-view";

import AdminView from "@/components/dashboard/admin-view";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        // Should not happen if session exists but good to handle
        return <div>User not found</div>;
    }

    // Fetch Current Cycle
    const currentCycle = await prisma.cycle.findFirst({
        where: { status: "OPEN" },
        orderBy: { startDate: 'desc' }
    });

    const currentCycleId = currentCycle?.id;

    // Fetch games for the user (Current Cycle)
    const games = await prisma.gameSession.findMany({
        where: {
            userId: user.id,
            cycleId: currentCycleId
        },
        orderBy: { date: 'desc' },
        take: 50,
    });

    // Role Based Data Fetching
    let subPlayers = [];

    if (["AGENT", "SUPER_AGENT", "MANAGER", "ADMIN"].includes(user.role)) {
        let where = {};

        if (user.role === "ADMIN") {
            where = {}; // Admin sees all
        } else if (user.role === "MANAGER") {
            // Manager sees only their club. 
            // If clubId is null, they might see nothing or unassigned? 
            // Best to assume they see matching clubId.
            // If clubId is null for manager, they see nothing? Or unassigned users?
            // Let's assume where clubId matches.
            where = { clubId: user.clubId };
        } else {
            // Agents
            where = {
                OR: [
                    { agentId: user.id },
                    { superAgentId: user.id }
                ]
            };
        }

        const rawSubPlayers = await prisma.user.findMany({
            where,
            include: {
                agent: { select: { name: true, code: true } },
                superAgent: { select: { name: true, code: true } },

                gameSessions: {
                    where: { cycleId: currentCycleId },
                    select: { rake: true }
                }
            },
            orderBy: { code: 'asc' }
        });

        subPlayers = rawSubPlayers.map(p => {
            const totalRake = p.gameSessions.reduce((sum, gs) => sum + (gs.rake || 0), 0);
            const totalRakebackAmount = (totalRake * (p.rakeback || 0)) / 100;
            // Remove gameSessions to keep response size manageable if many users
            const { gameSessions, ...userWithoutGames } = p;
            return {
                ...userWithoutGames,
                totalRakebackAmount
            };
        });
    }

    // Render View
    if (user.role === "ADMIN") {
        return <AdminView user={user} games={games} subPlayers={subPlayers} />;
    } else if (["MANAGER", "SUPER_AGENT", "AGENT"].includes(user.role)) {
        return <AgentView user={user} games={games} subPlayers={subPlayers} />;
    } else {
        return <PlayerView user={user} games={games} />;
    }
}
