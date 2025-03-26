// vite.config.js

import { defineConfig } from 'vite';    // Keep default Vite import
import react from '@vitejs/plugin-react';  // React plugin for Vite
import tailwindcss from '@tailwindcss/vite';  // Import Tailwind only once

// Define Vite configuration
export default defineConfig({
  plugins: [
    react(),              // React setup
    tailwindcss(),         // Tailwind plugin setup, use parentheses
  ],
});
