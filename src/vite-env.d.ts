/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_EDITION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
