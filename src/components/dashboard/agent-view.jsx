"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerView from "./player-view";
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
import { Search } from "lucide-react";

export default function AgentView({ user, games, subPlayers }) {
    return (
        <Tabs defaultValue="my-stats" className="space-y-4">
            <TabsList>
                <TabsTrigger value="my-stats">My Statistics</TabsTrigger>
                <TabsTrigger value="my-club">My Club</TabsTrigger>
            </TabsList>

            <TabsContent value="my-stats" className="space-y-4">
                <PlayerView user={user} games={games} />
            </TabsContent>

            <TabsContent value="my-club" className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search players..." className="pl-8 w-[200px] lg:w-[300px]" />
                        </div>
                        <Button>Download Report</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Players</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-right">Rakeback (%)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subPlayers?.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell>{player.code}</TableCell>
                                        <TableCell>{player.name || "N/A"}</TableCell>
                                        <TableCell>{player.role}</TableCell>
                                        <TableCell className="text-right">{player.balance}</TableCell>
                                        <TableCell className="text-right">{player.rakeback}%</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Set Rakeback</Button>
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!subPlayers?.length && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">No players found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
