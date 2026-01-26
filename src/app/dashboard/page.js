import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import PlayerView from "@/components/dashboard/player-view";
import AgentView from "@/components/dashboard/agent-view";
import ManagerView from "@/components/dashboard/manager-view";
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

    // Fetch games for the user (Current Cycle)
    // TODO: Define Cycle logic. For now fetch top 20 games.
    const games = await prisma.gameSession.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 20,
    });

    // Role Based Data Fetching
    let subPlayers = [];

    if (user.role === "AGENT" || user.role === "SUPER_AGENT" || user.role === "MANAGER") {
        const where = user.role === "MANAGER" ? {} : {
            OR: [
                { agentId: user.id },
                { superAgentId: user.id }
            ]
        };

        const rawSubPlayers = await prisma.user.findMany({
            where,
            include: {
                agent: { select: { name: true, code: true } },
                superAgent: { select: { name: true, code: true } },
                gameSessions: {
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
    if (user.role === "MANAGER") {
        return <ManagerView user={user} games={games} subPlayers={subPlayers} />;
    } else if (user.role === "AGENT" || user.role === "SUPER_AGENT") {
        return <AgentView user={user} games={games} subPlayers={subPlayers} />;
    } else {
        return <PlayerView user={user} games={games} />;
    }
}
