import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'r3f-runtime': ['@react-three/fiber'],
          'three-drei': ['@react-three/drei'],
          'ui-icons': ['lucide-react'],
        },
      },
    },
  },
});
