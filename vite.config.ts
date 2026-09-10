import { defineConfig } from "vite";
import vinext from "vinext/plugin";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [vinext(), cloudflare()],
});
