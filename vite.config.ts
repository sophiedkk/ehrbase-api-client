import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const base = process.env.GITHUB_ACTIONS
  ? `/${process.env.GITHUB_REPOSITORY!.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  server: {
    proxy: {
      '/ehrbase': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ehrbase/, ''),
      },
    },
  },
})
