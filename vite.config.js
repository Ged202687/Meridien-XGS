import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [react(), cloudflare()],
  // Chemins relatifs : Méridien fonctionne a sa propre adresse comme sous le
  // portail XGS (portail/meridien/), qui le sert a la meme adresse que les
  // autres outils pour partager une seule connexion.
  base: './',
})
