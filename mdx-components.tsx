import type { MDXComponents } from 'mdx/types'
import { useMDXComponents as getComponents } from './src/components/mdx-component'

// This file is required by Next.js for MDX support
// It allows you to customize MDX components globally
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getComponents(components)
}
