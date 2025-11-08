import { NextRequest, NextResponse } from "next/server";
import { getUser, getUserWorkspace, startEditingSession } from "@/lib/queries";

/**
 * POST /api/editing/start
 * Start editing mode for the user's workspace
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
        { error: "No workspace found. Please create a workspace first." },
        { status: 404 }
      );
    }

    const session = await startEditingSession(user.id, workspace.id);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        started_at: session.started_at,
        is_active: session.is_active,
      },
    });
  } catch (error: any) {
    console.error("Error starting editing session:", error);
    return NextResponse.json(
      { error: "Failed to start editing session", details: error.message },
      { status: 500 }
    );
  }
}
