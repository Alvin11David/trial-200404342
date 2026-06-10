import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", priority: "1.0" },
          { path: "/dashboard", priority: "0.9" },
          { path: "/reservations", priority: "0.8" },
          { path: "/rooms", priority: "0.8" },
          { path: "/guests", priority: "0.7" },
          { path: "/housekeeping", priority: "0.7" },
          { path: "/billing", priority: "0.6" },
          { path: "/reports", priority: "0.6" },
          { path: "/settings", priority: "0.4" },
        ];
        const urls = entries
          .map(
            (e) =>
              `  <url><loc>${BASE_URL}${e.path}</loc><priority>${e.priority}</priority></url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
