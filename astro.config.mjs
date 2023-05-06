import { defineConfig } from 'astro/config'
import unocss from 'unocss/astro'
import solidJs from '@astrojs/solid-js'

import node from '@astrojs/node'
import { VitePWA } from 'vite-plugin-pwa'
import vercel from '@astrojs/vercel/edge'
import netlify from '@astrojs/netlify/edge-functions'
import VitePluginCompression from 'vite-plugin-compression'
import disableBlocks from './plugins/disableBlocks'


const envAdapter = () => {
  if (process.env.OUTPUT === 'vercel') {
    return vercel()
  } else if (process.env.OUTPUT === 'netlify') {
    return netlify()
  } else {
    return node({
      mode: 'standalone',
    })
  }
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    unocss(),
    solidJs(),
  ],
  output: 'server',
  adapter: envAdapter(),
  vite: {
    // server: {
    //   proxy: {
    //       "/api": {
    //           target: "https://ai.edianzu.com",
    //           changeOrigin: true,
    //           rewrite: (path) => path.replace("/api", "/api"),
    //       },
    //   },
    // },
    ssr: {
      noExternal: ['path-to-regexp'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // console.log(id);
            // if(id.includes('markdown-it/')){ //利用文件目录判断
            //   console.log(id.toString().split('markdown-it/')[1].split('.')[0].toString());
            //   return id.toString().split('markdown-it/')[1].split('.')[0].toString();
            // }
            // if(id.includes('markdown-it-katex/')){ //利用文件目录判断
            //   console.log(id.toString().split('markdown-it-katex/')[1].split('.')[0].toString());
            //   return id.toString().split('markdown-it-katex/')[1].split('.')[0].toString();
            // }
            if (id.includes('markdown-it-highlightjs/')) { // 利用文件目录判断
              console.log(id.toString().split('markdown-it-highlightjs/')[1].split('.')[0].toString())
              return id.toString().split('markdown-it-highlightjs/')[1].split('.')[0].toString()
            }
          },
        },
      },
    },
    plugins: [
      VitePluginCompression(),
      process.env.OUTPUT === 'vercel' && disableBlocks(),
      process.env.OUTPUT === 'netlify' && disableBlocks('netlify'),
      process.env.OUTPUT !== 'netlify' && VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: '小易智能',
          short_name: 'ChatGPT 3.5',
          description: 'A Robot based on OpenAI API',
          theme_color: '#212129',
          background_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icon.svg',
              sizes: '32x32',
              type: 'image/svg',
              purpose: 'any maskable',
            },
          ],
        },
        client: {
          installPrompt: true,
          periodicSyncForUpdates: 20,
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
  },
})
