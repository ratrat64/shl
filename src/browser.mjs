import { readFileSync } from "node:fs";

export const themeScript = readFileSync(
  new URL("./assets/theme.js", import.meta.url),
  "utf8",
);
