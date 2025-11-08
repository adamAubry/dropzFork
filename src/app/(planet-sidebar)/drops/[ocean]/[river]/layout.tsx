export default async function RiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't render sidebar here - parent layout handles it
  return <>{children}</>;
}

