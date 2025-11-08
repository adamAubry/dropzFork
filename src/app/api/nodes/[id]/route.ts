import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getUser,
  getUserWorkspace,
  getActiveEditingSession,
  createNodeBackup,
} from "@/lib/queries";
import matter from "gray-matter";

/**
 * GET /api/nodes/[id]
 * Get a specific node by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const nodeId = parseInt(id);

    if (isNaN(nodeId)) {
      return NextResponse.json({ error: "Invalid node ID" }, { status: 400 });
    }

    const node = await db.query.nodes.findFirst({
      where: eq(nodes.id, nodeId),
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json(node);
  } catch (error: any) {
    console.error("Error fetching node:", error);
    return NextResponse.json(
      { error: "Failed to fetch node", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/nodes/[id]
 * Update a node (requires active editing session)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const nodeId = parseInt(id);

    if (isNaN(nodeId)) {
      return NextResponse.json({ error: "Invalid node ID" }, { status: 400 });
    }

    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    // Check for active editing session
    const session = await getActiveEditingSession(user.id, workspace.id);
    if (!session) {
      return NextResponse.json(
        { error: "No active editing session. Please enable editing mode." },
        { status: 403 }
      );
    }

    // Get existing node
    const existingNode = await db.query.nodes.findFirst({
      where: eq(nodes.id, nodeId),
    });

    if (!existingNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingNode.planet_id !== workspace.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create backup before modification
    await createNodeBackup(session.id, existingNode, "update");

    const body = await request.json();
    const { title, content, metadata, order } = body;

    // Process content if it's markdown
    let parsedHtml = existingNode.parsed_html;
    let processedMetadata = metadata || existingNode.metadata;

    if (content && existingNode.type === "file") {
      const { data: frontmatter, content: markdownContent } = matter(content);
      processedMetadata = {
        ...processedMetadata,
        ...frontmatter,
      };
      // TODO: Parse markdown to HTML here
    }

    // Update the node
    const [updatedNode] = await db
      .update(nodes)
      .set({
        title: title || existingNode.title,
        content: content || existingNode.content,
        parsed_html: parsedHtml,
        metadata: processedMetadata,
        order: order !== undefined ? order : existingNode.order,
        updated_at: new Date(),
      })
      .where(eq(nodes.id, nodeId))
      .returning();

    return NextResponse.json(updatedNode);
  } catch (error: any) {
    console.error("Error updating node:", error);
    return NextResponse.json(
      { error: "Failed to update node", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes/[id]
 * Delete a node (requires active editing session)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const nodeId = parseInt(id);

    if (isNaN(nodeId)) {
      return NextResponse.json({ error: "Invalid node ID" }, { status: 400 });
    }

    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    // Check for active editing session
    const session = await getActiveEditingSession(user.id, workspace.id);
    if (!session) {
      return NextResponse.json(
        { error: "No active editing session. Please enable editing mode." },
        { status: 403 }
      );
    }

    // Get existing node
    const existingNode = await db.query.nodes.findFirst({
      where: eq(nodes.id, nodeId),
    });

    if (!existingNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingNode.planet_id !== workspace.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create backup before deletion
    await createNodeBackup(session.id, existingNode, "delete");

    // Delete the node
    await db.delete(nodes).where(eq(nodes.id, nodeId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting node:", error);
    return NextResponse.json(
      { error: "Failed to delete node", details: error.message },
      { status: 500 }
    );
  }
}
