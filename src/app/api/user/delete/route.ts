import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, planets, nodes, editingSessions, nodeBackups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/queries";
import { cookies } from "next/headers";

/**
 * DELETE /api/user/delete
 * Delete user profile and all associated data
 * WARNING: This is irreversible!
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user's workspace (planet) - cascades to nodes, editing sessions, backups
    await db.delete(planets).where(eq(planets.user_id, user.id));

    // Delete the user account
    await db.delete(users).where(eq(users.id, user.id));

    // Clear session cookie
    (await cookies()).delete("session");

    return NextResponse.json({
      success: true,
      message: "User account and all data deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}
