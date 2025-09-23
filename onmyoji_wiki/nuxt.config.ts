// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      title: "Onmyoji Wiki",
      link: [
        {
          rel: "stylesheet",
          href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Rubik&family=Ma+Shan+Zheng&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Shippori+Mincho&family=Noto+Serif+SC:wght@200..900&family=Chiron+GoRound+TC:wght@200..900&family=Noto+Sans+TC:wght@100..900&display=swap",
        },
      ],
    },
  },
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  css: [
    '/public/assets/css/fonts.css'
  ],
});
