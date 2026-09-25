// Kanonische Form: https://entruempelung-thueringen.com/<slug> (ohne www, ohne .html, ohne Slash am Ende).
// Alles andere wird mit genau einem 301 dorthin umgeleitet.
const HOST = "entruempelung-thueringen.com";

// Einzelne Altpfade (zusätzlich in _redirects gepflegt)
const REDIRECTS = {
  "/kontakt": "/",
  "/ratgeber/entruempelung-kosten": "/entruempelung-kosten",
};

function canonicalPath(pathname) {
  let p = pathname;
  // Google-Verifizierungsdatei muss unter ihrem .html-Namen erreichbar bleiben
  if (/^\/google[0-9a-f]+\.html$/.test(p)) return p;
  p = p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  // Schreibweise ohne "e" (entrumpelung-*) → entruempelung-*
  p = p.replace(/(^|\/)entrumpelung-/g, "$1entruempelung-");
  return REDIRECTS[p] || p || "/";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = canonicalPath(url.pathname);

    // Nur die Produktivdomain (mit/ohne www) auf https + ohne www zwingen;
    // Vorschau-Hosts (*.workers.dev) behalten Host und Protokoll.
    const isProd = url.hostname === HOST || url.hostname === "www." + HOST;
    const target = new URL(url);
    if (isProd) {
      target.protocol = "https:";
      target.hostname = HOST;
      target.port = "";
    }
    target.pathname = path;
    if (target.toString() !== url.toString()) {
      return Response.redirect(target.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
