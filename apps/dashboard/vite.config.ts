import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
   plugins: [
      tsConfigPaths(),
      tailwindcss(),
      tanstackRouter({
         target: "react",
         autoCodeSplitting: true,
      }),
      VitePWA({
         strategies: "injectManifest",
         srcDir: "src",
         filename: "sw.ts",
         registerType: "autoUpdate",
         injectRegister: "auto",
         includeAssets: [
            "favicon.svg",
            "android/**/*",
            "ios/**/*",
            "offline.html",
         ],
         manifest: {
            id: "/",
            scope: "/",
            name: "Montte - Gestão Financeira",
            short_name: "Montte",
            description:
               "Gestão financeira completa para você e seus negócios. Simples, transparente e Open Source.",
            lang: "pt-BR",
            dir: "ltr",
            display: "standalone",
            display_override: [
               "window-controls-overlay",
               "standalone",
               "minimal-ui",
            ],
            start_url: "/",
            background_color: "#050816",
            theme_color: "#050816",
            orientation: "portrait-primary",
            categories: ["finance", "productivity", "business"],
            prefer_related_applications: false,
            shortcuts: [
               {
                  name: "Nova Transação",
                  short_name: "Nova",
                  description: "Adicionar nova transação",
                  url: "/pwa-redirect?action=new-transaction",
                  icons: [
                     {
                        src: "/android/android-launchericon-96-96.png",
                        sizes: "96x96",
                     },
                  ],
               },
               {
                  name: "Transações",
                  short_name: "Transações",
                  description: "Ver todas as transações",
                  url: "/pwa-redirect?action=transactions",
                  icons: [
                     {
                        src: "/android/android-launchericon-96-96.png",
                        sizes: "96x96",
                     },
                  ],
               },
               {
                  name: "Contas Bancárias",
                  short_name: "Contas",
                  description: "Gerenciar contas bancárias",
                  url: "/pwa-redirect?action=bank-accounts",
                  icons: [
                     {
                        src: "/android/android-launchericon-96-96.png",
                        sizes: "96x96",
                     },
                  ],
               },
               {
                  name: "Relatórios",
                  short_name: "Relatórios",
                  description: "Ver relatórios financeiros",
                  url: "/pwa-redirect?action=reports",
                  icons: [
                     {
                        src: "/android/android-launchericon-96-96.png",
                        sizes: "96x96",
                     },
                  ],
               },
            ],
            file_handlers: [
               {
                  action: "/file-handler",
                  accept: {
                     "application/x-ofx": [".ofx"],
                  },
               },
            ],
            share_target: {
               action: "/share-target",
               method: "POST",
               enctype: "multipart/form-data",
               params: {
                  title: "title",
                  text: "text",
                  url: "url",
                  files: [
                     {
                        name: "file",
                        accept: [
                           "application/x-ofx",
                           "application/ofx",
                           "application/octet-stream",
                           "text/plain",
                           "text/ofx",
                           "*/*",
                           ".ofx",
                        ],
                     },
                  ],
               },
            },
            launch_handler: {
               client_mode: ["navigate-existing", "auto"],
            },
            icons: [
               {
                  src: "android/android-launchericon-512-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any",
               },
               {
                  src: "android/android-launchericon-192-192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any",
               },
               {
                  src: "android/android-launchericon-144-144.png",
                  sizes: "144x144",
                  type: "image/png",
                  purpose: "any",
               },
               {
                  src: "android/android-launchericon-96-96.png",
                  sizes: "96x96",
                  type: "image/png",
                  purpose: "any",
               },
               {
                  src: "android/android-launchericon-72-72.png",
                  sizes: "72x72",
                  type: "image/png",
                  purpose: "any",
               },
               {
                  src: "android/android-launchericon-48-48.png",
                  sizes: "48x48",
                  type: "image/png",
                  purpose: "any",
               },
               {
                  src: "ios/512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
               },
               {
                  src: "ios/192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "maskable",
               },
               {
                  src: "favicon.svg",
                  sizes: "any",
                  type: "image/svg+xml",
                  purpose: "any",
               },
            ],
         },
         injectManifest: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webp}"],
         },
         devOptions: {
            enabled: true,
            type: "module",
         },
      }),
      react(),
   ],
   server: {
      port: 3000,
   },
});
