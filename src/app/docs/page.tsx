import { MarkdownPage } from '@/components/markdown-page'

/**
 * Example: Docs page that serves README.md by default
 * This is a server component for optimal performance
 */
export default function DocsPage() {
  return <MarkdownPage />
}

// Optional: Add metadata for SEO
export const metadata = {
  title: 'Documentation',
  description: 'Project documentation',
}
