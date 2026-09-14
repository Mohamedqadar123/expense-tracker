import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testUtils/setupTests.js'],
    globals: true,
    // Left off (the default): CSS imports are stubbed rather than actually
    // applied. The app's mobile-first CSS hides the desktop header behind a
    // min-width media query, and jsdom has no real layout engine — turning
    // css:true on made getByRole('button', { name: /log out/i }) fail because
    // jsdom couldn't evaluate the media query and treated the header as
    // hidden. Tests should exercise component logic, not CSS layout.
    include: ['src/**/*.test.{js,jsx}'],
  },
});
