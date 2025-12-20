import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
    },
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
    port: 3000,
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
    port: 3000,
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
    ],
    // Exclude heavy dependencies that are lazy-loaded
    exclude: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/xr',
    ],
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

