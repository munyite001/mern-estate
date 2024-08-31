import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://mern-estate-hufy.onrender.com',
        changeOrigin: true, // Add this to ensure the target origin is used
        secure: false, // Ignore SSL issues (only use in development)
      },
    },
  },

  plugins: [react()],
});
