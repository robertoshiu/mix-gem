# Learnings

## GitHub Pages Static Export Config (2026-05-04)
- Next.js 16.x requires `output: 'export'` in next.config.ts for static site generation
- `basePath: '/mix-gem'` matches the GitHub Pages repo name for proper asset resolution
- `trailingSlash: true` creates directory-based paths (e.g., `/mes/spc/index.html`) instead of `.html` files
- `images.unoptimized: true` is required because static export doesn't include the Next.js image optimization API
- `.nojekyll` must be in `public/` so Next.js copies it to `out/` during build — GitHub Pages needs this to serve files starting with `_` (like `_next/static/`)
- The `export` script alias (`"export": "next build"`) provides compatibility for older Next.js workflows
