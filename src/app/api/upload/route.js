import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { parseAndImport } from "@/lib/excel-parser";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    // Authorization: Only Manager
    if (!session || session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file"); // Expecting 'file' key from frontend

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Call Parser
        const results = await parseAndImport(buffer);

        return NextResponse.json({
            success: true,
            message: `Imported ${results.users} users and ${results.games} games.`,
            data: results
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
