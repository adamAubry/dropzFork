"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NodeEditorProps {
  node?: {
    id: number;
    slug: string;
    title: string;
    content: string | null;
    metadata: any;
  };
  namespace: string;
  onSave: () => void;
  onCancel: () => void;
}

export function NodeEditor({ node, namespace, onSave, onCancel }: NodeEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    slug: node?.slug || "",
    title: node?.title || "",
    content: node?.content || "",
    type: "file" as "file" | "folder",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = node ? `/api/nodes/${node.id}` : "/api/nodes";
      const method = node ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          namespace,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save node");
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-lg">
      <h2 className="text-2xl font-bold mb-6">
        {node ? "Edit Node" : "Create New Node"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as "file" | "folder" })
            }
            className="w-full px-3 py-2 border rounded-md"
            disabled={!!node} // Can't change type after creation
          >
            <option value="file">File (Markdown)</option>
            <option value="folder">Folder</option>
          </select>
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            placeholder="my-page"
            required
            disabled={!!node} // Can't change slug after creation
          />
          <p className="text-xs text-gray-500 mt-1">
            URL-friendly identifier (lowercase, hyphens only)
          </p>
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="My Page Title"
            required
          />
        </div>

        {formData.type === "file" && (
          <div>
            <Label htmlFor="content">Content (Markdown)</Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="# My Page&#10;&#10;Write your markdown content here..."
              className="w-full min-h-[300px] px-3 py-2 border rounded-md font-mono text-sm"
              rows={15}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports Markdown syntax, including frontmatter
            </p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
