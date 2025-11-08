import { NextRequest, NextResponse } from "next/server";
import { getUser, updateUserProfile } from "@/lib/queries";

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove sensitive data
    const { passwordHash, ...userProfile } = user;

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, avatar_url, bio } = body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const updated = await updateUserProfile(user.id, {
      email,
      avatar_url,
      bio,
    });

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Remove sensitive data
    const { passwordHash, ...userProfile } = updated[0];

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}
