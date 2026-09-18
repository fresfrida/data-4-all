import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standalone tooling for 3goods — deliberately independent of the root
// map site's build (that site has no bundler at all). See CLAUDE.md.
export default defineConfig({
  plugins: [react()],
});
