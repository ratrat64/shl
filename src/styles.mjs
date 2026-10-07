const light = 'color-scheme:light;--bg:#f6f7f5;--panel:#fff;--ink:#252b29;--muted:#59645f;--hidden-opacity:.94;--line:#7a8580;--accent:#006b60;--script:#895400;--wash:#e8eeeb';
const dark = 'color-scheme:dark;--bg:#000;--panel:#111715;--ink:#c6d0ca;--muted:#96a59d;--hidden-opacity:.8;--line:#63736b;--accent:#64b6a4;--script:#c6a36a;--wash:#111b16';
export const cssVariables = `
  :root,:root[data-theme=light]{${light}}
  @media(prefers-color-scheme:dark){:root:not([data-theme=light]){${dark}}}
  :root[data-theme=dark]{${dark}}
`;

export const styles = cssVariables + `
  *{box-sizing:border-box}
  html{scroll-behavior:smooth;scrollbar-gutter:stable}
  body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font:16px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
  ::selection{background:var(--accent);color:var(--bg)}
  a{color:var(--accent);text-underline-offset:.22em}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  [hidden]{display:none!important}
  button{font:inherit;cursor:pointer}
  .wrap{max-width:1160px;margin:auto;padding-inline:clamp(1rem,3vw,2.5rem)}
  .head-inner{min-height:64px;display:flex;align-items:center;gap:1.5rem;padding-block:.65rem}
  .brand{color:var(--ink);font-weight:700;letter-spacing:-.035em;font-size:1.2rem;text-decoration:none;line-height:1}
  .brand-slash{color:var(--accent)}.brand-slash:last-child{color:var(--script)}
  .nav{display:flex;gap:1.5rem;align-items:center;margin-left:auto}
  .nav a{color:var(--muted);font-size:.9rem;text-decoration:none}
  .nav a[aria-current=page]{color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:.45em}
  .nav a:hover{color:var(--accent)}
  .theme-toggle,.visit,.download{border:1px solid transparent;border-radius:4px;font-size:.85rem;white-space:nowrap}
  .theme-toggle{color:var(--ink);padding:.35rem .7rem}
  .theme-toggle,.visit,.download{border-color:color-mix(in srgb,var(--button-tone,var(--accent)) 25%,var(--bg));background:color-mix(in srgb,var(--button-tone,var(--accent)) 10%,var(--bg))}
  .theme-toggle:hover,.visit:hover,.download:hover{background:color-mix(in srgb,var(--button-tone,var(--accent)) 18%,var(--bg))}
  .theme-toggle:disabled{background:var(--wash);color:var(--muted);cursor:default}
  main.wrap{width:100%;flex:1;margin-block:0;padding-top:clamp(1.5rem,3vw,2.5rem);padding-bottom:4rem}
  h1,h2,h3,p{margin-top:0}
  h1{font-size:clamp(1.8rem,3vw,2.4rem);letter-spacing:-.035em;line-height:1.2;margin-bottom:1rem}
  h2{font-size:clamp(1.25rem,2vw,1.5rem);letter-spacing:-.025em;line-height:1.25;margin-bottom:.8rem}
  h3{font-size:1.06rem;letter-spacing:-.02em}
  p{max-width:68ch}
  .lead{color:var(--muted);max-width:65ch;margin-bottom:2rem}
  .directory-tools{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;margin-bottom:1.4rem}
  .directory-tools h1{margin:0}
  .count{font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;display:inline-flex;align-items:center;gap:.35rem}
 .count-number{min-width:4ch;text-align:right;display:inline-block}
 .count-label{white-space:nowrap}
  .directory-actions{display:grid;grid-template-columns:minmax(0,1fr) 9rem;align-items:center;gap:.65rem;width:min(100%,30rem);min-width:0}
  .directory-toggles{grid-column:2;display:flex;align-items:center;justify-content:flex-end;gap:.5rem}
  .search{grid-column:1;min-width:0}
  .search input{width:100%;font:inherit;padding:.45rem .7rem;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--ink);caret-color:var(--accent)}
  .search input::placeholder{color:var(--muted)}
  .search input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .search-status{font-size:.9rem;color:var(--muted);margin:0 0 .5rem}
  .links{list-style:none;padding:0;margin:0}
  .links li{padding:.65rem 0;overflow-wrap:anywhere}
  .links li:has(>.link-row):hover,.links li:has(>.link-row):focus-within,.links summary:hover,.links summary:focus-within{background:var(--wash)}
  .links li[data-hidden=true]>.link-row,.links li[data-hidden=true]>.tags,.links li[data-hidden=true]>details>summary{opacity:var(--hidden-opacity)}
  .links li[data-hidden=true]>.link-row:focus-within,.links li[data-hidden=true]>details>summary:focus-within{opacity:1}
  .links .links{margin:.35rem 0 0 .75rem;padding-left:1rem}
  summary{cursor:pointer;color:var(--ink);font-weight:600}
  summary:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  summary a{color:inherit;text-decoration:none}
  summary a:hover{text-decoration:underline}
  .breadcrumbs{height:2rem;line-height:1.5rem;white-space:nowrap;overflow-x:auto;overflow-y:hidden;margin:0 0 .5rem;color:var(--muted);font-size:.9rem}
  .link-row{display:grid;grid-template-columns:max-content minmax(0,1fr) max-content;gap:1rem;align-items:center;overflow-x:auto;scrollbar-width:none}
  .link-row.script-row{grid-template-columns:max-content minmax(0,1fr) max-content max-content}
  .link-row:has(.tags){grid-template-columns:max-content max-content minmax(4rem,1fr) max-content}
  .link-row.script-row:has(.tags){grid-template-columns:max-content max-content minmax(4rem,1fr) max-content max-content}
  .code{font:600 .94rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;color:var(--accent);white-space:nowrap}
  .code:hover{text-decoration:underline}
  .script-link{color:var(--script)}
  .destination{position:relative;display:flex;min-width:0;color:var(--muted);font-size:.85rem;white-space:nowrap;text-decoration:none}
  .destination:hover{text-decoration:underline;color:var(--accent)}
  .destination-start{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .destination-end{flex-shrink:0;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .visit,.download{padding:.2rem .55rem;text-decoration:none}
  .download{--button-tone:var(--script);color:var(--script)}
  .tags{max-width:9rem;min-width:3rem;padding:0;border:0;background:transparent;color:var(--muted);font-size:.78rem;line-height:1.5;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tags:hover{background:var(--wash)}
  .tag-panel{display:none;width:max-content;max-width:min(22rem,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;padding:.7rem .9rem;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--ink);font-size:.85rem;overflow-wrap:anywhere}
  .tag-panel:popover-open{display:block}
  @supports(position-area:bottom){.tag-panel{inset:auto;position-area:bottom span-right;position-try-fallbacks:flip-block,flip-inline;margin:.5rem 0}}
  #copy-status:empty{display:none}
  #copy-status:not(:empty){position:fixed;bottom:1rem;right:1rem;z-index:1;max-width:min(24rem,calc(100vw - 2rem));margin:0;padding:.55rem .8rem;background:var(--panel);border:1px solid var(--line);border-radius:4px;color:var(--ink)}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .prose{max-width:740px}.prose section{border-top:1px solid var(--line);padding-top:1rem;margin-top:2.5rem;scroll-margin-top:1rem}.prose p,.prose li{color:var(--muted)}
  .prose ol,.prose ul{padding-left:1.4rem}.prose li{padding-left:.35rem;margin-bottom:.8rem}
  .prose strong{color:var(--ink)}
  pre{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1rem;color:var(--ink);line-height:1.55;font-size:.9rem}
  code{font: .9em/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
  .prose pre code{overflow-wrap:normal}
  .footer{padding-block:1.5rem;color:var(--muted);font-size:.87rem}
  main.minimal-document{padding-block:2rem}
  .footer .wrap{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.footer p{margin:0}
  @media(max-width:740px){.head-inner{flex-wrap:wrap;gap:.75rem}.nav{gap:1rem}.directory-tools{align-items:stretch;flex-direction:column}.directory-actions{width:100%;grid-template-columns:minmax(0,1fr)}.directory-toggles{grid-column:1}.link-row{gap:.5rem}.footer .wrap{display:block}}
  @media(max-width:500px){.link-row:has(.tags){gap:.35rem;grid-template-columns:max-content max-content minmax(3rem,1fr) max-content}.link-row.script-row:has(.tags){grid-template-columns:max-content max-content minmax(3rem,1fr) max-content max-content}.tags{max-width:5rem}}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
