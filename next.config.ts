import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import bundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  serverExternalPackages: [
    // Externalize only what's needed at runtime.
    // LibSQL client is safe to externalize; native platform packages are optional.
    "@libsql/client",
    "re2",
    "unpdf",
    "execa",
    "cheerio",
    "crawlee",
    "playwright",
    "puppeteer-core",
    "node-fetch",
    "sharp",
    "cytoscape",
    "chart.js",
    "canvas",
    "chromadb",
    "jsdom",
    "papaparse",
    "openapi-typescript-codegen",
    "octokit",
    "simple-statistics",
    "svgjson",
    "technicalindicators",
    "ts-morph",
    "turndown",
    "graphlib",
    "fast-xml-parser",
    "fast-safe-stringify",
    "execa",
    "serialize-javascript",
    "safe-stable-stringify",
    "sanitize-html",
    "marked",
    "leaflet",
    "globby",
    "excalidraw-to-svg",
    "diff"
  ],
  typescript: {
        ignoreBuildErrors: true,
        tsconfigPath: './tsconfig.json',
    },
    cacheComponents: true,
    cacheMaxMemorySize: 128 * 1024 * 1024, // 128 MB
    compiler: {
        emotion: true,
        styledComponents: true,
        styledJsx: true,
    },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer({})

const withMDX = createMDX({
    extension: /\.mdx?$/,
    // Turbopack requires loader options be serializable. Passing
    // plugin functions (remarkGfm, rehypeHighlight) causes an error
    // because functions are not serializable across worker boundaries.
    // Use specifier strings so the loader can resolve them at runtime.
    options: {
        // Enable frontmatter parsing so MDX frontmatter is not rendered as page content
        // and is instead exposed to the MDX module as exports.
        // Keep MDX remark plugins minimal and stable in development to avoid
        // loader/preset interop issues with Turbopack. `remark-gfm` is sufficient
        // for most docs formatting. Frontmatter parsing can be handled separately
        // if needed (e.g. server-side gray-matter extraction), which avoids
        // depending on unified plugin resolution in the dev bundler.
        remarkPlugins: ['remark-gfm'],
        rehypePlugins: ['rehype-highlight'],
    },
})

export default withMDX(nextConfig)

//export default nextConfig;
