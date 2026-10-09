import { readFileSync } from "node:fs";
import { isDirectory, linkUrl, linkStates } from "./links.mjs";

export const APP_ASSETS = [
  "search",
  "copy",
  "download",
  "recovery",
  "navigation",
];
export const recoveryScript = `{
const isDirectory = ${isDirectory.toString()};
const linkUrl = ${linkUrl.toString()};
const linkStates = ${linkStates.toString()};
${readFileSync(new URL("./assets/recovery.js", import.meta.url), "utf8")}
}`;
export const appScripts = APP_ASSETS.map((name) => [
  name,
  name === "recovery"
    ? recoveryScript
    : readFileSync(new URL(`./assets/${name}.js`, import.meta.url), "utf8"),
]);

export const themeScript = readFileSync(
  new URL("./assets/theme.js", import.meta.url),
  "utf8",
);
