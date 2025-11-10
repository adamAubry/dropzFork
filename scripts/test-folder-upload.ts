#!/usr/bin/env tsx
/**
 * Test Script: Folder Upload Architecture
 *
 * This script simulates what happens when a user uploads a nested folder structure.
 * It creates test data and verifies the UI would display correctly.
 *
 * Test Scenario:
 * User drops folder "docs" containing:
 *   docs/
 *     guides/
 *       setup.md
 *       faq.md
 *     api/
 *       reference.md
 */

import { db } from "../src/db/index";
import { users, planets, nodes } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { getNodeChildren, getNodeByPath } from "../src/lib/queries";

const TEST_USER = {
  username: "test-upload-user",
  email: "test-upload@example.com",
};

const TEST_PLANET = {
  name: "Test Upload Workspace",
  slug: "test-upload-workspace",
};

async function cleanup() {
  console.log("🧹 Cleaning up previous test data...");

  // Find test user
  const user = await db.query.users.findFirst({
    where: eq(users.username, TEST_USER.username),
  });

  if (user) {
    // This cascades to planets and nodes
    await db.delete(users).where(eq(users.id, user.id));
    console.log("✅ Cleaned up test user and related data");
  }
}

async function createTestUser() {
  console.log("\n👤 Creating test user...");

  const [user] = await db.insert(users).values({
    username: TEST_USER.username,
    email: TEST_USER.email,
    password: "test-password-hash", // Not used in this test
  }).returning();

  console.log(`✅ Created user: ${user.username} (ID: ${user.id})`);
  return user;
}

async function createTestPlanet(userId: number) {
  console.log("\n🌍 Creating test planet...");

  const [planet] = await db.insert(planets).values({
    name: TEST_PLANET.name,
    slug: TEST_PLANET.slug,
    description: "Test workspace for folder upload architecture",
    user_id: userId,
  }).returning();

  console.log(`✅ Created planet: ${planet.name} (ID: ${planet.id})`);
  return planet;
}

async function seedFolderStructure(planetId: number) {
  console.log("\n📁 Seeding folder structure...");
  console.log("Simulating upload of 'docs' folder with nested structure\n");

  // Simulate what file-upload-dropzone.tsx would create:
  // 1. First, create folder nodes (parents before children)

  console.log("Step 1: Creating folder nodes...");

  // Folder: docs (at root)
  const [docsFolder] = await db.insert(nodes).values({
    planet_id: planetId,
    slug: "docs",
    title: "Docs",
    namespace: "", // root level
    depth: 0,
    file_path: "docs",
    type: "folder",
    node_type: "ocean",
    content: "",
    order: 0,
  }).returning();
  console.log(`  ✅ Created folder: docs (namespace: "", depth: 0)`);

  // Folder: guides (inside docs)
  const [guidesFolder] = await db.insert(nodes).values({
    planet_id: planetId,
    slug: "guides",
    title: "Guides",
    namespace: "docs", // parent namespace
    depth: 1,
    file_path: "docs/guides",
    type: "folder",
    node_type: "sea",
    content: "",
    order: 0,
  }).returning();
  console.log(`  ✅ Created folder: guides (namespace: "docs", depth: 1)`);

  // Folder: api (inside docs)
  const [apiFolder] = await db.insert(nodes).values({
    planet_id: planetId,
    slug: "api",
    title: "Api",
    namespace: "docs", // parent namespace
    depth: 1,
    file_path: "docs/api",
    type: "folder",
    node_type: "sea",
    content: "",
    order: 0,
  }).returning();
  console.log(`  ✅ Created folder: api (namespace: "docs", depth: 1)`);

  console.log("\nStep 2: Creating file nodes...");

  // File: setup.md (inside docs/guides)
  const [setupFile] = await db.insert(nodes).values({
    planet_id: planetId,
    slug: "setup",
    title: "Setup",
    namespace: "docs/guides", // parent folder path
    depth: 2,
    file_path: "docs/guides/setup.md",
    type: "file",
    node_type: "river",
    content: "# Setup Guide\n\nThis is the setup guide.",
    parsed_html: "<h1>Setup Guide</h1><p>This is the setup guide.</p>",
    metadata: {
      summary: "Learn how to set up the system",
    },
    order: 0,
  }).returning();
  console.log(`  ✅ Created file: setup.md (namespace: "docs/guides", depth: 2)`);

  // File: faq.md (inside docs/guides)
  const [faqFile] = await db.insert(nodes).values({
    planet_id: planetId,
    slug: "faq",
    title: "FAQ",
    namespace: "docs/guides", // parent folder path
    depth: 2,
    file_path: "docs/guides/faq.md",
    type: "file",
    node_type: "river",
    content: "# FAQ\n\nFrequently asked questions.",
    parsed_html: "<h1>FAQ</h1><p>Frequently asked questions.</p>",
    metadata: {
      summary: "Common questions and answers",
    },
    order: 1,
  }).returning();
  console.log(`  ✅ Created file: faq.md (namespace: "docs/guides", depth: 2)`);

  // File: reference.md (inside docs/api)
  const [referenceFile] = await db.insert(nodes).values({
    planet_id: planetId,
    slug: "reference",
    title: "Reference",
    namespace: "docs/api", // parent folder path
    depth: 2,
    file_path: "docs/api/reference.md",
    type: "file",
    node_type: "river",
    content: "# API Reference\n\nComplete API documentation.",
    parsed_html: "<h1>API Reference</h1><p>Complete API documentation.</p>",
    metadata: {
      summary: "API endpoints and usage",
    },
    order: 0,
  }).returning();
  console.log(`  ✅ Created file: reference.md (namespace: "docs/api", depth: 2)`);

  return {
    folders: { docs: docsFolder, guides: guidesFolder, api: apiFolder },
    files: { setup: setupFile, faq: faqFile, reference: referenceFile },
  };
}

async function verifyStructure(planetId: number, planetSlug: string) {
  console.log("\n🔍 Verifying data structure...\n");

  const tests: Array<{ name: string; test: () => Promise<boolean> }> = [];

  // Test 1: Root page should show "docs" folder
  tests.push({
    name: "Root page (/) should show 'docs' folder",
    test: async () => {
      const children = await getNodeChildren(planetId, "");
      const hasDocsFolder = children.some(
        (node) => node.slug === "docs" && node.type === "folder"
      );
      console.log(`  Query: getNodeChildren(planetId, "")`);
      console.log(`  Result: ${children.length} node(s)`);
      console.log(`  Has 'docs' folder: ${hasDocsFolder ? "✅" : "❌"}`);
      return hasDocsFolder;
    },
  });

  // Test 2: /docs page should show "guides" and "api" folders
  tests.push({
    name: "/docs page should show 'guides' and 'api' folders",
    test: async () => {
      const children = await getNodeChildren(planetId, "docs");
      const hasGuidesFolder = children.some(
        (node) => node.slug === "guides" && node.type === "folder"
      );
      const hasApiFolder = children.some(
        (node) => node.slug === "api" && node.type === "folder"
      );
      console.log(`  Query: getNodeChildren(planetId, "docs")`);
      console.log(`  Result: ${children.length} node(s)`);
      console.log(`  Has 'guides' folder: ${hasGuidesFolder ? "✅" : "❌"}`);
      console.log(`  Has 'api' folder: ${hasApiFolder ? "✅" : "❌"}`);
      return hasGuidesFolder && hasApiFolder;
    },
  });

  // Test 3: /docs/guides page should show "setup" and "faq" files
  tests.push({
    name: "/docs/guides page should show 'setup.md' and 'faq.md' files",
    test: async () => {
      const children = await getNodeChildren(planetId, "docs/guides");
      const hasSetupFile = children.some(
        (node) => node.slug === "setup" && node.type === "file"
      );
      const hasFaqFile = children.some(
        (node) => node.slug === "faq" && node.type === "file"
      );
      console.log(`  Query: getNodeChildren(planetId, "docs/guides")`);
      console.log(`  Result: ${children.length} node(s)`);
      console.log(`  Has 'setup' file: ${hasSetupFile ? "✅" : "❌"}`);
      console.log(`  Has 'faq' file: ${hasFaqFile ? "✅" : "❌"}`);
      return hasSetupFile && hasFaqFile;
    },
  });

  // Test 4: /docs/api page should show "reference" file
  tests.push({
    name: "/docs/api page should show 'reference.md' file",
    test: async () => {
      const children = await getNodeChildren(planetId, "docs/api");
      const hasReferenceFile = children.some(
        (node) => node.slug === "reference" && node.type === "file"
      );
      console.log(`  Query: getNodeChildren(planetId, "docs/api")`);
      console.log(`  Result: ${children.length} node(s)`);
      console.log(`  Has 'reference' file: ${hasReferenceFile ? "✅" : "❌"}`);
      return hasReferenceFile;
    },
  });

  // Test 5: Direct path lookup should work
  tests.push({
    name: "getNodeByPath should find /docs/guides/setup",
    test: async () => {
      const node = await getNodeByPath(planetSlug, ["docs", "guides", "setup"]);
      console.log(`  Query: getNodeByPath("${planetSlug}", ["docs", "guides", "setup"])`);
      console.log(`  Result: ${node ? "✅ Found" : "❌ Not found"}`);
      if (node) {
        console.log(`    - slug: ${node.slug}`);
        console.log(`    - namespace: ${node.namespace}`);
        console.log(`    - type: ${node.type}`);
      }
      return !!node;
    },
  });

  // Run all tests
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📝 Test: ${test.name}`);
    try {
      const result = await test.test();
      if (result) {
        passed++;
        console.log(`  ✅ PASSED\n`);
      } else {
        failed++;
        console.log(`  ❌ FAILED\n`);
      }
    } catch (err: any) {
      failed++;
      console.log(`  ❌ ERROR: ${err.message}\n`);
    }
  }

  return { passed, failed, total: tests.length };
}

async function printSummary(results: { passed: number; failed: number; total: number }) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log("=".repeat(60));

  if (results.failed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Folder upload architecture is working correctly.");
  } else {
    console.log("\n⚠️  SOME TESTS FAILED! There are issues with the architecture.");
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║   🧪 Folder Upload Architecture Test                     ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  try {
    // Cleanup
    await cleanup();

    // Setup
    const user = await createTestUser();
    const planet = await createTestPlanet(user.id);

    // Seed data
    await seedFolderStructure(planet.id);

    // Verify
    const results = await verifyStructure(planet.id, planet.slug);

    // Summary
    await printSummary(results);

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await db.delete(users).where(eq(users.id, user.id));
    console.log("✅ Cleanup complete");

    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error: any) {
    console.error("\n❌ Test script failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
