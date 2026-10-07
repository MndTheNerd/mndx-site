// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served from GitHub Pages at https://mndthenerd.github.io/mndx-site/ (see docs/adr/0001-stack.md).
export default defineConfig({
  output: 'static',
  site: 'https://mndthenerd.github.io',
  base: '/mndx-site',
  trailingSlash: 'always',
  integrations: [sitemap()],
  security: {
    // Pages can't send headers, so Astro emits the policy as a <meta> tag with hashes for its own
    // scripts and styles. Everything else is same-origin only: no third-party resources, ever.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
});
