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
  server: {
    host: '0.0.0.0', // Allow all IP addresses to access the development server
    // port: 3000, // Optional: You can change the port if needed
  },
});
