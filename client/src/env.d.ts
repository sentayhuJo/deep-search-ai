interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 