import { SidebarItem } from "@/components/universal-sidebar";
import {
  getPlanets,
  getOceans,
  getPlanetBySlug,
  getNodeByPath,
  getNodeChildren,
} from "./queries-nodes";
import { getOcean, getRiver, getDropsForRiver } from "./queries";

/**
 * Build sidebar for home page
 * Shows all planets (n) with their oceans (n+1)
 */
export async function buildHomeSidebar(): Promise<{
  parentLink?: { title: string; href: string };
  currentItems: SidebarItem[];
}> {
  const planets = await getPlanets();

  const currentItems: SidebarItem[] = await Promise.all(
    planets.map(async (planet) => {
      const oceans = await getOceans(planet.id);
      return {
        id: planet.id,
        title: planet.name,
        href: `/${planet.slug}`,
        children: oceans.map((ocean) => ({
          id: ocean.id,
          title: ocean.title,
          href: `/${planet.slug}/${ocean.slug}`,
        })),
      };
    })
  );

  return {
    currentItems,
  };
}

/**
 * Build sidebar for planet page
 * Parent (n-1): Just a back link to home
 * Current (n): Oceans in THIS planet only
 * Children (n+1): Rivers in each ocean
 */
export async function buildPlanetSidebar(planetSlug: string): Promise<{
  parentLink?: { title: string; href: string };
  currentItems: SidebarItem[];
}> {
  const planet = await getPlanetBySlug(planetSlug);
  if (!planet) {
    return { currentItems: [] };
  }

  const oceans = await getOceans(planet.id);

  const currentItems: SidebarItem[] = await Promise.all(
    oceans.map(async (ocean) => {
      // Get ocean details to find rivers
      try {
        const oceanData = await getOcean(ocean.slug);
        const rivers = oceanData?.seas.flatMap((sea) => sea.rivers) || [];

        return {
          id: ocean.id,
          title: ocean.title,
          href: `/${planetSlug}/${ocean.slug}`,
          children: rivers.map((river) => ({
            id: river.slug,
            title: river.name,
            href: `/drops/${ocean.slug}/${river.slug}`,
          })),
        };
      } catch {
        return {
          id: ocean.id,
          title: ocean.title,
          href: `/${planetSlug}/${ocean.slug}`,
        };
      }
    })
  );

  return {
    parentLink: {
      title: "← Home",
      href: "/",
    },
    currentItems,
  };
}

/**
 * Build sidebar for ocean page
 * Parent (n-1): Just a back link to home (since we don't have planet in URL)
 * Current (n): Rivers in THIS ocean only
 * Children (n+1): Drops in each river
 */
export async function buildOceanSidebar(
  planetSlug: string,
  oceanSlug: string
): Promise<{
  parentLink?: { title: string; href: string };
  currentItems: SidebarItem[];
}> {
  const oceanData = await getOcean(oceanSlug);

  if (!oceanData) {
    return { currentItems: [] };
  }
  const rivers = oceanData?.seas.flatMap((sea) => sea.rivers) || [];

  const currentItems: SidebarItem[] = await Promise.all(
    rivers.map(async (river) => {
      try {
        const drops = await getDropsForRiver(river.slug);
        return {
          id: river.slug,
          title: river.name,
          href: `/drops/${oceanSlug}/${river.slug}`,
          children: drops.map((drop) => ({
            id: drop.slug,
            title: drop.name,
            href: `/drops/${oceanSlug}/${river.slug}/${drop.slug}`,
          })),
        };
      } catch {
        return {
          id: river.slug,
          title: river.name,
          href: `/drops/${oceanSlug}/${river.slug}`,
        };
      }
    })
  );

  return {
    parentLink: {
      title: "← Home",
      href: "/",
    },
    currentItems,
  };
}

/**
 * Build sidebar for river page
 * Parent (n-1): Just a back link to ocean
 * Current (n): Drops in THIS river only
 * Children (n+1): None (drops don't have children)
 */
export async function buildRiverSidebar(
  planetSlug: string,
  oceanSlug: string,
  riverSlug: string
): Promise<{
  parentLink?: { title: string; href: string };
  currentItems: SidebarItem[];
}> {
  const drops = await getDropsForRiver(riverSlug);

  const currentItems: SidebarItem[] = drops.map((drop) => ({
    id: drop.slug,
    title: drop.name,
    href: `/drops/${oceanSlug}/${riverSlug}/${drop.slug}`,
  }));

  return {
    parentLink: {
      title: "← Ocean",
      href: `/drops/${oceanSlug}`,
    },
    currentItems,
  };
}

/**
 * Build sidebar for drop detail page
 * Parent (n-1): Just a back link to river
 * Current (n): All drops in THIS river (siblings)
 * Children (n+1): None
 */
export async function buildDropSidebar(
  planetSlug: string,
  oceanSlug: string,
  riverSlug: string,
  dropSlug: string
): Promise<{
  parentLink?: { title: string; href: string };
  currentItems: SidebarItem[];
}> {
  const drops = await getDropsForRiver(riverSlug);

  const currentItems: SidebarItem[] = drops.map((drop) => ({
    id: drop.slug,
    title: drop.name,
    href: `/drops/${oceanSlug}/${riverSlug}/${drop.slug}`,
  }));

  return {
    parentLink: {
      title: "← River",
      href: `/drops/${oceanSlug}/${riverSlug}`,
    },
    currentItems,
  };
}
