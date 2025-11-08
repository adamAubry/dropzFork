"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Save, X, Plus } from "lucide-react";

interface EditingToolbarProps {
  workspaceSlug: string;
}

export function EditingToolbar({ workspaceSlug }: EditingToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  if (!isEditing) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleStartEditing}
          disabled={loading}
          size="lg"
          className="shadow-lg"
        >
          <Edit className="w-4 h-4 mr-2" />
          {loading ? "Starting..." : "Edit Mode"}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg mb-2">
        <p className="text-sm font-semibold text-yellow-800 mb-2">
          Editing Mode Active
        </p>
        <p className="text-xs text-yellow-700">
          Changes are being tracked. Apply or discard when done.
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
  );
}
