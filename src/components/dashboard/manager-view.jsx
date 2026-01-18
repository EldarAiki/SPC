"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentView from "./agent-view"; // Managers reuse Agent view for their dashboard
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Upload, FileSpreadsheet, RefreshCw } from "lucide-react";

export default function ManagerView({ user, games, subPlayers }) {
    const [uploading, setUploading] = useState(false);

    // Upload Handler
    const handleUpload = async (e) => {
        // e is click event, but input is separate. We need state for file.
        // Simplified: use ref or state.
    };

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                alert("Upload successful! " + data.message);
                window.location.reload(); // Refresh to show new data
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (err) {
            alert("Upload error: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="admin">Admin Panel</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
                {/* Managers see everything Agents see, but for the whole club (subPlayers passed will be all users) */}
                <AgentView user={user} games={games} subPlayers={subPlayers} />
            </TabsContent>

            <TabsContent value="admin" className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Admin Administration</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Upload</CardTitle>
                            <CardDescription>Upload daily Excel reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="picture">Report File (XLSX)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="picture"
                                        type="file"
                                        accept=".xlsx"
                                        onChange={onFileChange}
                                        disabled={uploading}
                                    />
                                    <Button disabled={uploading} variant="secondary">
                                        {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cycle Management</CardTitle>
                            <CardDescription>Manage reporting cycles</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Current Cycle: Active</div>
                                <Button variant="destructive" className="w-full">Close Current Cycle</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Reset passwords and more</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">Manage Users</Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}
