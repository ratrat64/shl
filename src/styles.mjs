export const cssVariables = `
  :root{color-scheme:light;--bg:#f6f6f6;--panel:#fff;--ink:#2a2a2a;--muted:#666;--line:#e0e0e0;--accent:#1a5fb0;--script:#9b6000;--wash:#eeefef}
  @media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#121212;--panel:#1a1a1a;--ink:#e8e8e8;--muted:#999;--line:#2a2a2a;--accent:#8ab8ff;--script:#e8b460;--wash:#1e1e1e}}
  :root[data-theme=light]{color-scheme:light;--bg:#f6f6f6;--panel:#fff;--ink:#2a2a2a;--muted:#666;--line:#e0e0e0;--accent:#1a5fb0;--script:#9b6000;--wash:#eeefef}
  :root[data-theme=dark]{color-scheme:dark;--bg:#121212;--panel:#1a1a1a;--ink:#e8e8e8;--muted:#999;--line:#2a2a2a;--accent:#8ab8ff;--script:#e8b460;--wash:#1e1e1e}
`;

export const styles = cssVariables + `
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
  ::selection{background:var(--accent);color:var(--bg)}
  a{color:var(--accent);text-underline-offset:.22em}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  [hidden]{display:none!important}
  button{font:inherit;cursor:pointer}
  .wrap{max-width:1160px;margin:auto;padding-inline:clamp(1rem,3vw,2.5rem)}
  .site-head{border-bottom:1px solid var(--line)}
  .head-inner{min-height:64px;display:flex;align-items:center;gap:1.5rem;padding-block:.65rem}
  .brand{color:var(--ink);font-weight:700;letter-spacing:-.035em;font-size:1.2rem;text-decoration:none;line-height:1}
  .nav{display:flex;gap:1.5rem;align-items:center;margin-left:auto}
  .nav a{color:var(--muted);font-size:.9rem;text-decoration:none}
  .nav a[aria-current=page]{color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:.45em}
  .nav a:hover{color:var(--accent)}
  .theme-toggle{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:4px;padding:.35rem .7rem;font-size:.85rem;white-space:nowrap}
  .theme-toggle:hover{background:var(--wash)}
  .theme-toggle:disabled{background:var(--wash);color:var(--muted);cursor:default}
  main{padding-top:clamp(1.5rem,3vw,2.5rem);padding-bottom:4rem;min-height:70vh}
  h1,h2,h3,p{margin-top:0}
  h1{font-size:clamp(1.8rem,3vw,2.4rem);letter-spacing:-.035em;line-height:1.2;margin-bottom:1rem}
  h2{font-size:clamp(1.25rem,2vw,1.5rem);letter-spacing:-.025em;line-height:1.25;margin-bottom:.8rem}
  h3{font-size:1.06rem;letter-spacing:-.02em}
  p{max-width:68ch}
  .lead{color:var(--muted);max-width:65ch;margin-bottom:2rem}
  .directory-page .site-head,.directory-page .footer{border:0}
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
  .links .links{margin:.35rem 0 0 .75rem;padding-left:1rem}
  summary{cursor:pointer;color:var(--ink);font-weight:600}
  summary:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  summary a{color:inherit;text-decoration:none}
  summary a:hover{text-decoration:underline}
  .breadcrumbs{height:2rem;line-height:1.5rem;white-space:nowrap;overflow-x:auto;overflow-y:hidden;margin:0 0 .5rem;color:var(--muted);font-size:.9rem}
  .link-row{display:grid;grid-template-columns:max-content minmax(0,1fr) max-content;gap:1rem;align-items:center;overflow-x:auto}
  .link-row.script-row{grid-template-columns:max-content minmax(0,1fr) max-content max-content}
  .code{font:600 .94rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;color:var(--accent);white-space:nowrap}
  .code:hover{text-decoration:underline}
  .script-link{color:var(--script)}
  .script-label{font:600 .7rem/1.5 ui-sans-serif,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;margin-left:.5rem}
  .destination{display:flex;min-width:0;color:var(--muted);font-size:.85rem;white-space:nowrap;text-decoration:none}
  .destination:hover{text-decoration:underline;color:var(--accent)}
  .destination-start{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .destination-end{flex-shrink:0;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .visit{border:1px solid var(--line);border-radius:4px;padding:.2rem .55rem;text-decoration:none;font-size:.85rem;white-space:nowrap}
  .visit:hover{background:var(--wash)}
  .download{border:1px solid var(--line);border-radius:4px;padding:.2rem .55rem;text-decoration:none;font-size:.85rem;white-space:nowrap;color:var(--script)}
  .download:hover{background:var(--wash)}
  .tags{display:block;color:var(--muted);font-size:.78rem;margin-top:.2rem}
  #copy-status:empty{display:none}
  #copy-status:not(:empty){position:fixed;bottom:1rem;right:1rem;z-index:1;max-width:min(24rem,calc(100vw - 2rem));margin:0;padding:.55rem .8rem;background:var(--panel);border:1px solid var(--line);border-radius:4px;color:var(--ink)}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .prose{max-width:740px}.prose section{border-top:1px solid var(--line);padding-top:1rem;margin-top:2.5rem;scroll-margin-top:1rem}.prose p,.prose li{color:var(--muted)}
  .prose ol,.prose ul{padding-left:1.4rem}.prose li{padding-left:.35rem;margin-bottom:.8rem}
  .prose strong{color:var(--ink)}
  pre{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1rem;color:var(--ink);line-height:1.55;font-size:.9rem}
  code{font: .9em/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
  .prose pre code{overflow-wrap:normal}
  .footer{border-top:1px solid var(--line);padding-block:1.5rem;color:var(--muted);font-size:.87rem}
  .footer .wrap{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.footer p{margin:0}
  @media(max-width:740px){.head-inner{flex-wrap:wrap;gap:.75rem}.nav{gap:1rem}.directory-tools{align-items:stretch;flex-direction:column}.directory-actions{width:100%;grid-template-columns:minmax(0,1fr)}.directory-toggles{grid-column:1}.link-row{gap:.5rem}.footer .wrap{display:block}}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
