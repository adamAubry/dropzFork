import { NextRequest, NextResponse } from "next/server";
import {
  getUser,
  getUserWorkspace,
  getActiveEditingSession,
  endEditingSession,
} from "@/lib/queries";

/**
 * POST /api/editing/apply
 * Apply changes and end editing mode
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const session = await getActiveEditingSession(user.id, workspace.id);
    if (!session) {
      return NextResponse.json(
        { error: "No active editing session" },
        { status: 404 }
      );
    }

    // End the editing session (this keeps the changes and backups for history)
    await endEditingSession(session.id);

    return NextResponse.json({
      success: true,
      message: "Changes applied successfully",
    });
  } catch (error: any) {
    console.error("Error applying changes:", error);
    return NextResponse.json(
      { error: "Failed to apply changes", details: error.message },
      { status: 500 }
    );
  }
}
