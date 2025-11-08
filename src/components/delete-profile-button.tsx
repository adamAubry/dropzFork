"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteProfileButton() {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete profile");
      }

      alert("Your profile has been deleted successfully.");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Profile
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
        Are you absolutely sure? This action cannot be undone.
      </p>
      <div>
        <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
          Type "DELETE" to confirm:
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-red-300 rounded-md"
          placeholder="DELETE"
        />
      </div>
      <div className="flex gap-4">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading || confirmText !== "DELETE"}
        >
          {loading ? "Deleting..." : "Confirm Delete"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowConfirm(false);
            setConfirmText("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
