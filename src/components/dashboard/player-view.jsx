"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlayerView({ user, games, cycle }) {
    // Calculate specific stats if not provided pre-calculated
    // Assuming user.balance is the main balance
    // games is an array of GameSession

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.balance?.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Current Cycle Balance
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rakeback</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" x2="23" y1="8" y2="11" />
                            <line x1="23" x2="20" y1="11" y2="11" />

                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.rakeback}%</div>
                        <p className="text-xs text-muted-foreground">
                            Your Rakeback Deal
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Games Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Games</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead className="text-right">Buy In</TableHead>
                                <TableHead className="text-right">Cash Out</TableHead>
                                <TableHead className="text-right">P&L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {games && games.map((game) => (
                                <TableRow key={game.id}>
                                    <TableCell>{new Date(game.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{game.gameType || "NLH"}</TableCell>
                                    <TableCell>{game.tableName}</TableCell>
                                    <TableCell className="text-right">{game.buyIn}</TableCell>
                                    <TableCell className="text-right">{game.cashOut}</TableCell>
                                    <TableCell className={`text-right font-medium ${game.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {game.pnl}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!games || games.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No games found in this cycle.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
