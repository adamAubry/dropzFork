import { Link } from "@/components/ui/link";
import { db } from "@/db";
import { planets } from "@/db/schema";
import { getOceans, getUser, getNodeChildren } from "@/lib/queries";
import { eq } from "drizzle-orm";
import Image from "next/image";

export const revalidate = 0;

export default async function Home() {
  const user = await getUser();

  // If not logged in, show message
  if (!user) {
    return (
      <main className="min-h-[calc(100vh-113px)] flex-1 overflow-y-auto p-4 pt-0 md:pl-64" id="main-content">
        <div className="w-full p-4 text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to Dropz</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to view your workspaces.
          </p>
          {/* Login button will go here when you implement auth */}
        </div>
      </main>
    );
  }

  // Get ALL user's planets/workspaces
  const userPlanets = await db.query.planets.findMany({
    where: eq(planets.user_id, user.id),
    orderBy: (planets, { asc }) => [asc(planets.created_at)],
  });

  // Fetch root-level content for each planet
  const planetsWithContent = await Promise.all(
    userPlanets.map(async (planet) => ({
      planet,
      rootNodes: await getNodeChildren(planet.id, ""),
    }))
  );

  let imageCount = 0;

  return (
    <>
      <main
        className="min-h-[calc(100vh-113px)] flex-1 overflow-y-auto p-4 pt-0 md:pl-64"
        id="main-content"
      >
        <div className="w-full max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Your Workspaces</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and explore your content workspaces
            </p>
          </div>

          {planetsWithContent.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-6xl mb-4">🌍</div>
              <h2 className="text-2xl font-bold mb-4">No Workspace Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don't have a workspace yet. Create one to get started!
              </p>
              <Link href="/profile">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                  Create Workspace
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planetsWithContent.map(({ planet, rootNodes }) => (
                <Link
                  key={planet.id}
                  href={`/${planet.slug}`}
                  className="block group"
                >
                  <div className="border rounded-lg overflow-hidden hover:shadow-xl transition-shadow bg-white dark:bg-gray-800">
                    <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-6xl">🌍</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                        {planet.name}
                      </h3>
                      {planet.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {planet.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{rootNodes.length} item(s)</span>
                        <span className="text-blue-600 group-hover:underline">
                          Open →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
