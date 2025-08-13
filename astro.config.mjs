import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  security: {
    checkOrigin: false
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel()
});