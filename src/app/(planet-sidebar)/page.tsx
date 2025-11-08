import { Link } from "@/components/ui/link";
import { getPlanets, getOceans, getUser, getUserWorkspace } from "@/lib/queries";
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

  // Get user's workspace
  const userWorkspace = await getUserWorkspace(user.id);

  // Show only user's planets (for now just their workspace)
  const planets = userWorkspace ? [userWorkspace] : [];

  // Fetch oceans (root-level folders) for user's planets
  const planetsWithOceans = await Promise.all(
    planets.map(async (planet) => ({
      planet,
      oceans: await getOceans(planet.id),
    }))
  );

  let imageCount = 0;

  return (
    <>
      <main
        className="min-h-[calc(100vh-113px)] flex-1 overflow-y-auto p-4 pt-0 md:pl-64"
        id="main-content"
      >
        <div className="w-full p-4">
          {planetsWithOceans.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No Workspace Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don't have a workspace yet. Create one to get started!
              </p>
              <Link href="/profile">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Go to Profile
                </button>
              </Link>
            </div>
          ) : (
            <>
              {planetsWithOceans.map(({ planet, oceans }) => (
        <div key={planet.name}>
          <h2 className="text-xl font-semibold">{planet.name}</h2>
          <div className="flex flex-row flex-wrap justify-center gap-2 border-b-2 py-4 sm:justify-start">
            {oceans.map((ocean) => (
              <Link
                prefetch={true}
                key={ocean.slug}
                className="flex w-[125px] flex-col items-center text-center"
                href={`/${planet.slug}/${ocean.slug}`}
              >
                <Image
                  loading={imageCount++ < 15 ? "eager" : "lazy"}
                  decoding="sync"
                  src={ocean.metadata?.image_url ?? "/placeholder.svg"}
                  alt={`A small picture of ${ocean.title}`}
                  className="mb-2 h-14 w-14 border hover:bg-accent2"
                  width={48}
                  height={48}
                  quality={65}
                />
                <span className="text-xs">{ocean.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )))}
            </>
          )}
        </div>
      </main>
    </>
  );
}
