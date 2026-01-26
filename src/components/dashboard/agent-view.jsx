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
import { Download, Search, Settings2, Eye, RefreshCw } from "lucide-react";
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

export default function AgentView({ user, games, subPlayers }) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [newRakeback, setNewRakeback] = useState("");
    const [updating, setUpdating] = useState(false);
    const [detailUserId, setDetailUserId] = useState(null);
    const [activitySearchTerm, setActivitySearchTerm] = useState("");

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

    const filteredActivity = subPlayers?.filter(p =>
        p.role === 'PLAYER' && // Only show PLAYERS in this view
        (p.name?.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
            p.agent?.name?.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
            p.superAgent?.name?.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
            p.code?.toLowerCase().includes(activitySearchTerm.toLowerCase()))
    ) || [];

    const getSafeName = (entity) => {
        if (!entity) return "";
        if (entity.name && entity.name !== "-" && entity.name.trim() !== "") return entity.name;
        return entity.code || "";
    };

    const sortedActivity = [...filteredActivity].sort((a, b) => {
        const saA = getSafeName(a.superAgent) || "ZZZZ";
        const saB = getSafeName(b.superAgent) || "ZZZZ";
        if (saA !== saB) return saA.localeCompare(saB);

        const aA = getSafeName(a.agent) || "ZZZZ";
        const aB = getSafeName(b.agent) || "ZZZZ";
        if (aA !== aB) return aA.localeCompare(aB);

        return (a.name || "").localeCompare(b.name || "");
    });

    // Helper for grouping labels
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
                        <CardTitle>{t("my_club")}</CardTitle>
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
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
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
                        <CardTitle>{t("club_activity")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-primary/10">
                                    <TableHead>{t("super_agent")}</TableHead>
                                    <TableHead>{t("agent")}</TableHead>
                                    <TableHead>{t("player")}</TableHead>
                                    <TableHead className="text-right">{t("balance")}</TableHead>
                                    <TableHead className="text-right">{t("total_rakeback_amount")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedActivity.map((player) => {
                                    // Grouping Logic
                                    const saName = getSafeName(player.superAgent);
                                    const agentName = getSafeName(player.agent);

                                    const showSA = saName !== lastSAId;
                                    const showAgent = (agentName !== lastAgentId) || showSA;

                                    lastSAId = saName;
                                    lastAgentId = agentName;

                                    return (
                                        <TableRow key={player.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                            <TableCell className="font-bold text-zinc-500">
                                                {showSA ? (saName || "-") : ""}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {showAgent ? (agentName || "-") : ""}
                                            </TableCell>
                                            <TableCell>{player.name || player.code}</TableCell>
                                            <TableCell className={`text-right font-bold ${player.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {player.balance?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-blue-600 font-semibold">
                                                        {player.totalRakebackAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({player.rakeback}%)
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {sortedActivity.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                            No activity found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("set_rakeback")}</DialogTitle>
                        <DialogDescription>
                            Update rakeback for player {selectedPlayer?.code}.
                            {user.role !== 'MANAGER' && ` Max allowed: ${user.rakeback}%`}
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
                                max={user.role === 'MANAGER' ? 100 : user.rakeback}
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
        </Tabs>
    );
}
