import { readFileSync } from "node:fs";

export const styles = readFileSync(
  new URL("./assets/site.css", import.meta.url),
  "utf8",
);
