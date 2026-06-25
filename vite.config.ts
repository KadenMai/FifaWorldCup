import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  /** Root-absolute paths so refresh on /locations, /matches/:id, etc. still loads JS/CSS/data */
  base: '/',
});
