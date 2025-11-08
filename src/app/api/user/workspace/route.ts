import { NextRequest, NextResponse } from "next/server";
import { getUser, getUserWorkspace, ensureUserWorkspace } from "@/lib/queries";

/**
 * GET /api/user/workspace
 * Get current user's workspace
 */
export async function GET(request: NextRequest) {
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

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("Error fetching user workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/workspace
 * Create workspace for current user (if it doesn't exist)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await ensureUserWorkspace(user.id, user.username);

    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace", details: error.message },
      { status: 500 }
    );
  }
}
