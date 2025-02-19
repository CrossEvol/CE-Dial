import { withPageConfig } from '@extension/vite-config';
import { resolve } from 'node:path';
import path from 'path';

const rootDir = resolve(import.meta.dirname);
const srcDir = resolve(rootDir, 'src');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', 'dist', 'new-tab'),
  },
});
