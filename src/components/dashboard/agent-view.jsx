"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Settings2, Eye, RefreshCw, Users } from "lucide-react";
import PlayerView from "./player-view";
import { useLanguage } from "@/lib/i18n";
import ExcelJS from "exceljs";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DetailsModal from "./details-modal";

const HierarchyCard = ({ node, t, onDrillDown, isRoot = false }) => {
    const hasSubGroups = (node.superAgents && Object.keys(node.superAgents).length > 0) ||
        (node.agents && Object.keys(node.agents).length > 0);
    const hasPlayers = node.players && node.players.length > 0;

    return (
        <Card className={`border-none shadow-md mb-6 overflow-hidden ${isRoot ? 'ring-2 ring-blue-500/10' : 'bg-white/40 dark:bg-zinc-900/40'}`}>
            <CardHeader className="py-4 bg-zinc-50/80 dark:bg-zinc-800/80 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${node.type === 'CLUB' ? 'bg-amber-100 text-amber-700 shadow-sm shadow-amber-200' :
                            node.type === 'SUPER_AGENT' ? 'bg-purple-100 text-purple-700 shadow-sm shadow-purple-200' :
                                'bg-blue-100 text-blue-700 shadow-sm shadow-blue-200'
                            }`}>
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                {node.name || node.code}
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${node.type === 'CLUB' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                                    node.type === 'SUPER_AGENT' ? 'border-purple-200 text-purple-600 bg-purple-50' :
                                        'border-blue-200 text-blue-600 bg-blue-50'
                                    }`}>
                                    {node.type === 'SUPER_AGENT' ? 'Super Agent' : node.type}
                                </span>
                            </CardTitle>
                            {isRoot && node.type === 'CLUB' && <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Global Club Statistics</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">Total Balance</p>
                            <p className={`text-base font-black ${node.totalBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {node.totalBalance.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">Total Rake</p>
                            <p className="text-base font-black text-blue-600">
                                {node.totalRake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        {node.type !== 'CLUB' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDrillDown(node.id)}
                                className="h-9 px-3 gap-2 border-zinc-200 hover:bg-zinc-100 font-bold text-xs"
                            >
                                <Eye className="h-4 w-4" />
                                Drill Down
                            </Button>
                        )}
                    </div>
                </div>
                {/* Mobile Totals */}
                <div className="flex sm:hidden mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 justify-between">
                    <div className="text-left">
                        <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Balance</p>
                        <p className={`text-sm font-black ${node.totalBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {node.totalBalance.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Rake</p>
                        <p className="text-sm font-black text-blue-600">
                            {node.totalRake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="py-6 px-4 sm:px-6 space-y-8">
                {/* 1. Sub-Groups (Cards first) */}
                {hasSubGroups && (
                    <div className="space-y-6">
                        {node.superAgents && Object.values(node.superAgents).map(sa => (
                            <HierarchyCard key={sa.id} node={sa} t={t} onDrillDown={onDrillDown} />
                        ))}
                        {node.agents && Object.values(node.agents).map(ag => (
                            <HierarchyCard key={ag.id} node={ag} t={t} onDrillDown={onDrillDown} />
                        ))}
                    </div>
                )}

                {/* 2. Immediate Players (at the bottom) */}
                {hasPlayers && (
                    <div className={`rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 p-2 sm:p-4 ${hasSubGroups ? 'mt-8' : ''}`}>
                        <div className="grid grid-cols-3 gap-4 text-[11px] font-black text-muted-foreground uppercase px-4 mb-3 tracking-widest">
                            <span>User Activity</span>
                            <span className="text-right">Balance</span>
                            <span className="text-right">Rakeback</span>
                        </div>
                        <div className="space-y-1.5">
                            {node.players.map((p, idx) => (
                                <div key={idx} className={`grid grid-cols-3 gap-4 p-3 rounded-lg text-sm transition-all duration-200 hover:scale-[1.01] ${p.role === 'PLAYER_SELF' ? 'bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50 font-bold z-10 relative' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate">{p.name || p.code}</span>
                                        {p.role === 'PLAYER_SELF' && (
                                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">My Account</span>
                                        )}
                                    </div>
                                    <span className={`text-right tabular-nums font-bold ${p.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {p.balance?.toLocaleString()}
                                    </span>
                                    <span className="text-right tabular-nums text-blue-600 font-black">
                                        {p.rakeback}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!hasSubGroups && !hasPlayers && (
                    <div className="text-center py-10">
                        <Users className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-medium italic">No activity recorded in this group.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function AgentView({ user, games, subPlayers }) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [newRakeback, setNewRakeback] = useState("");
    const [updating, setUpdating] = useState(false);
    const [detailUserId, setDetailUserId] = useState(null);
    const [drilledUserId, setDrilledUserId] = useState(null);
    const [activitySearchTerm, setActivitySearchTerm] = useState("");

    // 1. Build the Hierarchy Tree
    const buildHierarchy = () => {
        const clubs = {};

        const getOrCreateClub = (id, name) => {
            if (!clubs[id]) {
                clubs[id] = { id, name: name || id || "Unknown Club", type: 'CLUB', superAgents: {}, agents: {}, players: [], totalBalance: 0, totalRake: 0 };
            }
            return clubs[id];
        };

        const getOrCreateSA = (club, u) => {
            const id = u.id || u.code;
            if (!club.superAgents[id]) {
                club.superAgents[id] = { ...u, type: 'SUPER_AGENT', agents: {}, players: [], totalBalance: 0, totalRake: 0 };
            } else if (u.role === 'SUPER_AGENT') {
                Object.assign(club.superAgents[id], u);
            }
            return club.superAgents[id];
        };

        const getOrCreateAgent = (parent, u) => {
            const id = u.id || u.code;
            if (!parent.agents[id]) {
                parent.agents[id] = { ...u, type: 'AGENT', players: [], totalBalance: 0, totalRake: 0 };
            } else if (u.role === 'AGENT') {
                Object.assign(parent.agents[id], u);
            }
            return parent.agents[id];
        };

        // Standardize all users into the tree
        subPlayers?.forEach(u => {
            const club = getOrCreateClub(u.clubId, u.clubName);

            if (u.role === 'SUPER_AGENT') {
                getOrCreateSA(club, u);
            } else if (u.role === 'AGENT') {
                if (u.superAgentId) {
                    // Agent under a Super Agent
                    const sa = getOrCreateSA(club, u.superAgent || { id: u.superAgentId });
                    getOrCreateAgent(sa, u);
                } else {
                    // Agent directly under a Club
                    getOrCreateAgent(club, u);
                }
            } else {
                // Player
                if (u.agentId) {
                    // Player under an Agent
                    let parent;
                    if (u.superAgentId) {
                        const sa = getOrCreateSA(club, u.superAgent || { id: u.superAgentId });
                        parent = getOrCreateAgent(sa, u.agent || { id: u.agentId });
                    } else {
                        parent = getOrCreateAgent(club, u.agent || { id: u.agentId });
                    }
                    parent.players.push(u);
                } else if (u.superAgentId) {
                    // Player directly under a Super Agent
                    const sa = getOrCreateSA(club, u.superAgent || { id: u.superAgentId });
                    sa.players.push(u);
                } else {
                    // Player directly under a Club
                    club.players.push(u);
                }
            }
        });

        // Add dummy self-entry for SAs and Agents so they show up in their own player lists
        subPlayers?.forEach(u => {
            if (u.role === 'SUPER_AGENT' || u.role === 'AGENT') {
                const club = getOrCreateClub(u.clubId, u.clubName);
                if (u.role === 'SUPER_AGENT') {
                    const sa = club.superAgents[u.id];
                    if (sa) sa.players.unshift({ ...u, role: 'PLAYER_SELF' });
                } else {
                    const parent = u.superAgentId ? club.superAgents[u.superAgentId] : club;
                    if (parent && parent.agents[u.id]) {
                        parent.agents[u.id].players.unshift({ ...u, role: 'PLAYER_SELF' });
                    }
                }
            }
        });

        // Recursive aggregate calculator
        const calculateTotals = (node) => {
            let balance = 0;
            let rake = 0;

            // Personal balance if it's an Agent/SA card node
            if (node.role === 'SUPER_AGENT' || node.role === 'AGENT') {
                // We already added them as PLAYER_SELF in players list, so we'll pick it up there
            }

            node.players?.forEach(p => {
                balance += (p.balance || 0);
                rake += (p.totalRakebackAmount || 0);
            });

            if (node.agents) {
                Object.values(node.agents).forEach(ag => {
                    const totals = calculateTotals(ag);
                    balance += totals.balance;
                    rake += totals.rake;
                });
            }

            if (node.superAgents) {
                Object.values(node.superAgents).forEach(sa => {
                    const totals = calculateTotals(sa);
                    balance += totals.balance;
                    rake += totals.rake;
                });
            }

            node.totalBalance = balance;
            node.totalRake = rake;
            return { balance, rake };
        };

        Object.values(clubs).forEach(calculateTotals);

        // Filter by Search Term
        const filterTree = (nodes) => {
            return nodes.filter(node => {
                const matches = (node.name || "").toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
                    (node.code || "").toLowerCase().includes(activitySearchTerm.toLowerCase());

                // Recursively filter children
                if (node.superAgents) {
                    const filteredSAs = filterTree(Object.values(node.superAgents));
                    node.superAgents = Object.fromEntries(filteredSAs.map(sa => [sa.id, sa]));
                }
                if (node.agents) {
                    const filteredAgents = filterTree(Object.values(node.agents));
                    node.agents = Object.fromEntries(filteredAgents.map(ag => [ag.id, ag]));
                }
                if (node.players) {
                    node.players = node.players.filter(p =>
                        (p.name || "").toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
                        (p.code || "").toLowerCase().includes(activitySearchTerm.toLowerCase())
                    );
                }

                const hasMatchingChildren = (node.superAgents && Object.keys(node.superAgents).length > 0) ||
                    (node.agents && Object.keys(node.agents).length > 0) ||
                    (node.players && node.players.length > 0);

                return matches || hasMatchingChildren;
            });
        };

        let result = Object.values(clubs);
        if (activitySearchTerm) {
            result = filterTree(result);
        }

        // Find the drilled node if applicable
        if (drilledUserId) {
            let found = null;
            const findNode = (nodes) => {
                for (const n of nodes) {
                    if (n.id === drilledUserId) { found = n; break; }
                    if (n.superAgents) findNode(Object.values(n.superAgents));
                    if (n.agents) findNode(Object.values(n.agents));
                    if (found) break;
                }
            };
            findNode(Object.values(clubs));
            if (found) return [found];
        }

        return Object.values(clubs);
    };

    const hierarchy = buildHierarchy();

    const handleUpdateRakeback = async () => {
        if (!selectedPlayer || newRakeback === "") return;

        setUpdating(true);
        try {
            const res = await fetch("/api/admin/users/rakeback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedPlayer.id,
                    rakeback: parseFloat(newRakeback),
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(t("update_success") || "Update successful!");
                setSelectedPlayer(null);
                window.location.reload();
            } else {
                alert(data.error || "Update failed");
            }
        } catch (error) {
            alert("Unexpected error");
        } finally {
            setUpdating(false);
        }
    };

    const filteredPlayers = subPlayers?.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const totalBalance = filteredPlayers.reduce((sum, p) => sum + (p.balance || 0), 0);

    const getSafeName = (entity) => {
        if (!entity) return "";
        if (entity.name && entity.name !== "-" && entity.name.trim() !== "") return entity.name;
        return entity.code || "N/A";
    };

    // Helper for grouping labels
    let lastClubId = null;
    let lastSAId = null;
    let lastAgentId = null;

    const handleDownloadReport = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('My Group');

        sheet.columns = [
            { header: t('code'), key: 'code', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Role', key: 'role', width: 15 },
            { header: t('balance'), key: 'balance', width: 15 },
            { header: t('rakeback'), key: 'rakeback', width: 15 },
        ];

        filteredPlayers.forEach(p => {
            sheet.addRow({
                code: p.code,
                name: p.name,
                role: p.role,
                balance: p.balance,
                rakeback: p.rakeback + '%'
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `Group_Report_${user.code}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <Tabs defaultValue="stats" className="space-y-4">
            <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1">
                <TabsTrigger value="stats" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950">
                    {t("personal_stats")}
                </TabsTrigger>
                <TabsTrigger value="club" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950">
                    {t("my_club")}
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950">
                    {t("club_activity")}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4">
                <PlayerView user={user} games={games} />
            </TabsContent>

            <TabsContent value="club" className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("search_players")}
                            className="bg-white dark:bg-zinc-900 border-none shadow-sm pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleDownloadReport} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {t("download_report")}
                    </Button>
                </div>

                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{t("my_club")}</span>
                            <span className={totalBalance >= 0 ? "text-green-600" : "text-red-500"}>
                                {t("total_balance")}: {totalBalance.toLocaleString()}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-primary/10">
                                    <TableHead>{t("code")}</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">{t("balance")}</TableHead>
                                    <TableHead className="text-right">{t("rakeback")}</TableHead>
                                    <TableHead className="text-right">{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPlayers.map((player) => (
                                    <TableRow key={player.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <TableCell className="font-medium">{player.code}</TableCell>
                                        <TableCell>{player.name || "N/A"}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                                {player.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${player.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {player.balance?.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600 font-semibold">{player.rakeback}%</TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => {
                                                    setSelectedPlayer(player);
                                                    setNewRakeback(player.rakeback.toString());
                                                }}
                                            >
                                                <Settings2 className="h-4 w-4 mr-1" />
                                                {t("set_rakeback")}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-zinc-600 hover:text-zinc-700 hover:bg-zinc-100"
                                                onClick={() => setDetailUserId(player.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                {t("details")}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPlayers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                                            No players found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center mb-2">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("search_players")}
                            className="bg-white dark:bg-zinc-900 border-none shadow-sm pl-9"
                            value={activitySearchTerm}
                            onChange={(e) => setActivitySearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center px-2 sm:px-4">
                            <span className="text-xl font-black tracking-tight">{t("club_activity")}</span>
                            {drilledUserId && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDrilledUserId(null)}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Back to Full View
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="md:px-6">
                        <div className="space-y-6">
                            {hierarchy.map((node, idx) => (
                                <HierarchyCard
                                    key={idx}
                                    node={node}
                                    t={t}
                                    onDrillDown={setDrilledUserId}
                                    isRoot={true}
                                />
                            ))}
                            {hierarchy.length === 0 && (
                                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                    <Users className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                    <p className="text-muted-foreground italic">No hierarchy data found.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("set_rakeback")}</DialogTitle>
                        <DialogDescription>
                            Update rakeback for player {selectedPlayer?.code}.
                            {(user.role !== 'MANAGER' && user.role !== 'ADMIN') && ` Max allowed: ${user.rakeback}%`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rakeback" className="text-right">
                                {t("rakeback")} (%)
                            </Label>
                            <Input
                                id="rakeback"
                                type="number"
                                step="0.5"
                                min="0"
                                max={(user.role === 'MANAGER' || user.role === 'ADMIN') ? 100 : user.rakeback}
                                value={newRakeback}
                                onChange={(e) => setNewRakeback(e.target.value)}
                                className="col-span-3"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedPlayer(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateRakeback} disabled={updating}>
                            {updating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("save") || "Save Change"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DetailsModal
                userId={detailUserId}
                isOpen={!!detailUserId}
                onClose={() => setDetailUserId(null)}
                currentUser={user}
            />
        </Tabs >
    );
}
