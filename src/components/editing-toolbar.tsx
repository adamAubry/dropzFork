"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Save, X, Upload } from "lucide-react";
import { FileUploadDropzone } from "./file-upload-dropzone";
import { EditPlanetName } from "./edit-planet-name";

interface EditingToolbarProps {
  workspaceSlug: string;
  planetId: number;
  planetName: string;
}

export function EditingToolbar({ workspaceSlug, planetId, planetName }: EditingToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();

  // Check for active editing session on mount
  useEffect(() => {
    const checkEditingStatus = async () => {
      try {
        const response = await fetch("/api/editing/status");
        if (response.ok) {
          const data = await response.json();
          setIsEditing(data.is_active);
        }
      } catch (err) {
        console.error("Failed to check editing status:", err);
      }
    };

    checkEditingStatus();
  }, []);

  const handleStartEditing = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/editing/start", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start editing mode");
      }

      setIsEditing(true);
      window.location.reload(); // Reload to show editing UI
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!confirm("Apply all changes? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/editing/apply", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to apply changes");
      }

      setIsEditing(false);
      alert("Changes applied successfully!");
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = async () => {
    if (!confirm("Discard all changes? This will restore everything to the previous state.")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/editing/discard", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to discard changes");
      }

      setIsEditing(false);
      alert("Changes discarded successfully!");
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract current path from pathname
  const pathSegments = pathname
    .split("/")
    .filter((p) => p && p !== workspaceSlug);

  if (!isEditing) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-2">
          <div className="bg-blue-50 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3 shadow-lg max-w-xs">
            <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
              💡 This is your workspace! Enable editing to:
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 mb-2 ml-4">
              <li>• Drag & drop files/folders to upload</li>
              <li>• Edit content inline</li>
              <li>• Rename your workspace</li>
              <li>• Create new files & folders</li>
            </ul>
          </div>
          <Button
            onClick={handleStartEditing}
            disabled={loading}
            size="lg"
            className="shadow-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold animate-pulse"
          >
            <Edit className="w-5 h-5 mr-2" />
            {loading ? "Starting..." : "Enable Edit Mode"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FileUploadDropzone
        workspaceSlug={workspaceSlug}
        currentPath={pathSegments}
        isActive={isEditing}
      />

      {/* Top left - Planet name editor */}
      <div className="fixed top-6 left-6 z-50">
        <EditPlanetName
          planetId={planetId}
          currentName={planetName}
          currentSlug={workspaceSlug}
          isEditingActive={isEditing}
        />
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg mb-2 max-w-xs">
        <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Editing Mode Active
        </p>
        <p className="text-xs text-yellow-700 mb-2">
          Changes are being tracked. Apply or discard when done.
        </p>
        <p className="text-xs text-yellow-700 flex items-center gap-1">
          <Upload className="w-3 h-3" />
          Drag & drop files/folders anywhere to upload
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleApplyChanges}
          disabled={loading}
          size="lg"
          className="shadow-lg bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Apply Changes
        </Button>

        <Button
          onClick={handleDiscardChanges}
          disabled={loading}
          size="lg"
          variant="destructive"
          className="shadow-lg"
        >
          <X className="w-4 h-4 mr-2" />
          Discard
        </Button>
      </div>
    </div>
    </>
  );
}
