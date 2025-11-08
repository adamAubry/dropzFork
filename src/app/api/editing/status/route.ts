import { NextRequest, NextResponse } from "next/server";
import { getUser, getUserWorkspace, getActiveEditingSession } from "@/lib/queries";

/**
 * GET /api/editing/status
 * Check if there's an active editing session
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ is_active: false });
    }

    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json({ is_active: false });
    }

    const session = await getActiveEditingSession(user.id, workspace.id);

    return NextResponse.json({
      is_active: !!session,
      session: session
        ? {
            id: session.id,
            started_at: session.started_at,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error checking editing status:", error);
    return NextResponse.json(
      { error: "Failed to check status", details: error.message },
      { status: 500 }
    );
  }
}
