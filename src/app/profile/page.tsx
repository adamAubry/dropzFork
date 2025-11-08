import { redirect } from "next/navigation";
import { getUser, getUserWorkspace } from "@/lib/queries";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { DeleteProfileButton } from "@/components/delete-profile-button";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const workspace = await getUserWorkspace(user.id);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Link href="/profile/edit">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>

          <div className="grid gap-4">
            {user.avatar_url && (
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600">Username</label>
              <p className="text-lg">{user.username}</p>
            </div>

            {user.email && (
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-lg">{user.email}</p>
              </div>
            )}

            {user.bio && (
              <div>
                <label className="text-sm font-medium text-gray-600">Bio</label>
                <p className="text-lg whitespace-pre-wrap">{user.bio}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600">Member Since</label>
              <p className="text-lg">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Information */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workspace</h2>

          {workspace ? (
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Workspace Name</label>
                <p className="text-lg">{workspace.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Workspace Slug</label>
                <p className="text-lg font-mono">{workspace.slug}</p>
              </div>

              {workspace.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-lg">{workspace.description}</p>
                </div>
              )}

              <div className="pt-4">
                <Link href={`/${workspace.slug}`}>
                  <Button>View Workspace</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You don't have a workspace yet.</p>
              <form action="/api/user/workspace" method="POST">
                <Button type="submit">Create Workspace</Button>
              </form>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="border border-red-300 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            Deleting your profile will permanently remove your account, workspace, and all associated data. This action cannot be undone.
          </p>
          <DeleteProfileButton />
        </div>
      </div>
    </div>
  );
}
