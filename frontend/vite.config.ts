import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Plugin to patch react-reconciler constants.mjs with missing exports
const patchReactReconciler = () => {
  const patchConstantsFile = () => {
    try {
      const constantsMjsPath = resolve(__dirname, 'node_modules/react-reconciler/constants.mjs');
      if (existsSync(constantsMjsPath)) {
        let mjsContent = readFileSync(constantsMjsPath, 'utf-8');
        
        // Always ensure the exports are present (don't check, just append if not there)
        if (!mjsContent.includes('ContinuousEventPriority')) {
          mjsContent += `
// Additional exports for React 18+ compatibility (patched for Vite)
export const ContinuousEventPriority = 4;
export const DiscreteEventPriority = 1;
export const DefaultEventPriority = 16;
export const IdleEventPriority = 536870912;
`;
          writeFileSync(constantsMjsPath, mjsContent, 'utf-8');
          console.log('✅ Patched react-reconciler constants.mjs to export event priorities');
        } else {
          console.log('✅ react-reconciler constants.mjs already patched');
        }
      } else {
        console.warn('⚠️ constants.mjs file not found at expected path');
      }
    } catch (error) {
      console.warn('⚠️ Could not patch react-reconciler constants.mjs:', error);
    }
  };

  // Patch immediately when plugin is defined (synchronous execution)
  // This runs before Vite processes any modules
  patchConstantsFile();

  return {
    name: 'patch-react-reconciler',
    enforce: 'pre' as const,
    configResolved() {
      // Patch again when config is resolved (before optimizeDeps runs)
      patchConstantsFile();
    },
    buildStart() {
      // Also patch in buildStart as backup
      patchConstantsFile();
    },
    // Intercept the module resolution to ensure our patch is used
    resolveId(id) {
      if (id === 'react-reconciler/constants') {
        // Return the actual path to trigger our load hook
        return id;
      }
      return null;
    },
    load(id) {
      // Intercept loading of react-reconciler/constants
      if (id === 'react-reconciler/constants') {
        try {
          const constantsMjsPath = resolve(__dirname, 'node_modules/react-reconciler/constants.mjs');
          if (existsSync(constantsMjsPath)) {
            let content = readFileSync(constantsMjsPath, 'utf-8');
            
            // Ensure exports are present
            if (!content.includes('ContinuousEventPriority')) {
              content += `
// Additional exports for React 18+ compatibility (patched for Vite)
export const ContinuousEventPriority = 4;
export const DiscreteEventPriority = 1;
export const DefaultEventPriority = 16;
export const IdleEventPriority = 536870912;
`;
            }
            
            return content;
          }
        } catch (error) {
          console.warn('⚠️ Could not load patched constants:', error);
        }
      }
      return null;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    patchReactReconciler(),
    react({
      // Use automatic JSX runtime
      jsxRuntime: 'automatic',
      // Enable Fast Refresh
      fastRefresh: true,
    }),
    // Automatically split vendor chunks for better caching
    splitVendorChunkPlugin(),
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Alias react-reconciler/constants to ensure it uses our patched version
      'react-reconciler/constants': resolve(__dirname, './node_modules/react-reconciler/constants.mjs'),
    },
    // Dedupe to ensure single version of react-reconciler
    dedupe: ['react', 'react-dom', 'react-reconciler'],
  },
  
  // Environment variable prefix (migrate from REACT_APP_ to VITE_)
  envPrefix: ['VITE_', 'REACT_APP_'],
  
  // Define global constants for compatibility
  define: {
    // Support for process.env for legacy code
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  
  build: {
    // Output directory
    outDir: 'build',
    
    // Enable source maps in production for debugging
    sourcemap: false,
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Chunk splitting for better caching
    rollupOptions: {
      // Explicitly set entry point to index.html (which loads main.tsx)
      input: resolve(__dirname, './index.html'),
      output: {
        manualChunks: {
          // Core React vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Three.js chunk (heavy, lazy loaded)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // Animation libraries
          'vendor-animation': ['framer-motion'],
          
          // Charting libraries (lazy loaded on analytics pages)
          'vendor-charts': ['recharts'],
          
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // State management
          'vendor-state': ['zustand'],
          
          // UI utilities
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'classnames', 'dayjs'],
        },
        
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Chunk size warning limit (300KB)
    chunkSizeWarningLimit: 300,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Target modern browsers for smaller bundles
    target: 'esnext',
  },
  
  // Development server configuration
  server: {
    port: 3005,
    strictPort: false,
    open: true,
    
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    
    // HMR configuration
    hmr: {
      overlay: true,
    },
  },
  
  // Preview server (production build preview)
  preview: {
    port: 3005,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
      'framer-motion',
      'lucide-react',
      'dayjs',
      'classnames',
      '@react-three/fiber',
      '@react-three/drei',
    ],
    // Exclude heavy dependencies that are lazy-loaded
    exclude: [
      'three',
      '@react-three/xr',
    ],
    // Force resolution of React dependencies to prevent version conflicts
    esbuildOptions: {
      target: 'es2020',
    },
  },
  
  // CSS configuration
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: 'camelCase',
    },
    // PostCSS configuration
    postcss: './postcss.config.js',
  },
  
  // Enable esbuild for faster transpilation
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});

