import { NextRequest, NextResponse } from "next/server";
import {
  getUser,
  getUserWorkspace,
  getActiveEditingSession,
  discardEditingSession,
} from "@/lib/queries";

/**
 * POST /api/editing/discard
 * Discard all changes and restore from backups
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

    // Discard changes - restore from backups and delete session
    await discardEditingSession(session.id);

    return NextResponse.json({
      success: true,
      message: "Changes discarded successfully",
    });
  } catch (error: any) {
    console.error("Error discarding changes:", error);
    return NextResponse.json(
      { error: "Failed to discard changes", details: error.message },
      { status: 500 }
    );
  }
}
