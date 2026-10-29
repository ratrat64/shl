// PROTOTYPE: throwaway server for the design-concept exploration. Not part of
// the site build; nothing here is copied to dist/.
// Usage: bun run prototype [links file]   (defaults to links.yaml.test)
import { readFile } from "node:fs/promises";
import { parse } from "yaml";

const root = new URL("../../", import.meta.url);
const source = process.argv[2] ?? "links.yaml.test";
const port = Number(process.env.PORT ?? 8090);
const files = {
  "/": [new URL("index.html", import.meta.url), "text/html; charset=utf-8"],
  // The real, browser-safe directory model: same tree, tags and filtering.
  "/model.mjs": [new URL("src/directory-model.mjs", root), "text/javascript"],
};

Bun.serve({
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/links.json") {
      const text = await readFile(new URL(source, root), "utf8");
      return Response.json(
        source.endsWith(".json") ? JSON.parse(text) : parse(text),
      );
    }
    const file = files[pathname];
    if (!file) return new Response("Not found", { status: 404 });
    return new Response(await readFile(file[0]), {
      headers: { "content-type": file[1], "cache-control": "no-store" },
    });
  },
});
console.log(`Design concepts: http://localhost:${port}/?variant=A  (data: ${source})`);
