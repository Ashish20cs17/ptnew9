// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['ptnew9.onrender.com'], // ✅ This allows the Render domain
    // port: 3000, // Optional: Uncomment if needed
  },
});
