import { readFileSync } from "node:fs";
import { isDirectory, linkUrl, linkStates } from "./links.mjs";

const bundle = await Bun.build({
  entrypoints: [new URL("./assets/search.js", import.meta.url).pathname],
  target: "browser",
  format: "iife",
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    __VUE_OPTIONS_API__: "false",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true",
  },
});
if (!bundle.success)
  throw new AggregateError(bundle.logs, "Directory runtime bundle failed");
export const directoryScript = (await bundle.outputs[0].text()).replace(
  /<\/script/gi,
  "<\\/script",
);

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
    : name === "search"
      ? directoryScript
      : readFileSync(new URL(`./assets/${name}.js`, import.meta.url), "utf8"),
]);

export const themeScript = readFileSync(
  new URL("./assets/theme.js", import.meta.url),
  "utf8",
);
