"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X } from "lucide-react";

interface EditPlanetNameProps {
  planetId: number;
  currentName: string;
  currentSlug: string;
  isEditingActive: boolean;
}

export function EditPlanetName({
  planetId,
  currentName,
  currentSlug,
  isEditingActive,
}: EditPlanetNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [slug, setSlug] = useState(currentSlug);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      alert("Name and slug cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/planets/${planetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, slug }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update workspace name");
      }

      setIsEditing(false);
      alert("Workspace name updated! Redirecting...");
      router.push(`/${slug}`);
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentName);
    setSlug(currentSlug);
    setIsEditing(false);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    setSlug(generateSlug(value));
  };

  if (!isEditingActive) {
    return null;
  }

  if (!isEditing) {
    return (
      <Button
        onClick={() => setIsEditing(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Edit Workspace Name
      </Button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Edit Workspace Name
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="My Workspace"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="my-workspace"
            pattern="[a-z0-9-]+"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Only lowercase letters, numbers, and hyphens
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            size="sm"
            className="flex-1"
          >
            <Save className="w-3 h-3 mr-1" />
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
