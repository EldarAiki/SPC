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

    if (user.role === "AGENT" || user.role === "SUPER_AGENT") {
        // Fetch direct players and maybe sub-agents players if super agent
        // Simplified: Fetch all downstream
        subPlayers = await prisma.user.findMany({
            where: {
                OR: [
                    { agentId: user.id },
                    { superAgentId: user.id }
                ]
            }
        });
    } else if (user.role === "MANAGER") {
        subPlayers = await prisma.user.findMany({
            orderBy: { code: 'asc' }
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
