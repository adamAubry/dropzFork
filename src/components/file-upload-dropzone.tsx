"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface FileUploadDropzoneProps {
  workspaceSlug: string;
  currentPath: string[];
  isActive: boolean;
}

export function FileUploadDropzone({
  workspaceSlug,
  currentPath,
  isActive,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      setIsDragging(true);
    }
  }, [isActive]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!isActive) {
        alert("Please enable editing mode first!");
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      const markdownFiles = files.filter((f) => /\.mdx?$/i.test(f.name));

      if (markdownFiles.length === 0) {
        alert("No markdown files found. Please drop .md or .mdx files.");
        return;
      }

      setUploading(true);
      setError("");

      try {
        // Process each file
        for (const file of markdownFiles) {
          const content = await file.text();

          // Extract filename without extension for slug
          const slug = file.name.replace(/\.mdx?$/i, "");

          // Determine namespace from current path
          const namespace = currentPath.join("/");

          // Create the node via API
          const response = await fetch("/api/nodes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slug,
              title: slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
              namespace,
              type: "file",
              content,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Failed to upload ${file.name}`);
          }
        }

        // Refresh the page to show new files
        alert(`Successfully uploaded ${markdownFiles.length} file(s)!`);
        router.refresh();
      } catch (err: any) {
        setError(err.message);
        alert(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    },
    [isActive, currentPath, router]
  );

  if (!isActive) {
    return null;
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        fixed inset-0 z-40 pointer-events-none
        ${isDragging ? "pointer-events-auto" : ""}
      `}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-4 border-dashed border-blue-500 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-blue-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                Drop Markdown Files Here
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                .md or .mdx files will be uploaded to: /{currentPath.join("/")}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Uploading files...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
