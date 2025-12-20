/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
  // Legacy REACT_APP_ variables for backwards compatibility
  readonly REACT_APP_SUPABASE_URL: string;
  readonly REACT_APP_SUPABASE_ANON_KEY: string;
  readonly REACT_APP_API_URL: string;
  readonly REACT_APP_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global type declarations
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}
