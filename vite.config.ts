import { fileURLToPath } from "node:url"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  server: {
    // Vite's default host is `localhost`, which Node 17+ resolves verbatim —
    // in a container whose /etc/hosts maps localhost to both 127.0.0.1 and ::1,
    // that binds the dev server to IPv6 loopback *only*. Anything dialling
    // 127.0.0.1:5173 (the preview proxy does) then gets ECONNREFUSED against a
    // server that is up and serving. Naming the IPv4 address removes the
    // ambiguity without exposing the port beyond loopback, which `host: true`
    // would do.
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
