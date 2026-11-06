self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
// la pagina arriva sempre fresca dalla rete; la copia salvata serve solo senza connessione
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  const page = r.mode === "navigate" || /\.(html|js|json)$/.test(new URL(r.url).pathname);
  if (!page) return;
  e.respondWith(
    fetch(r, { cache: "no-store" })
      .then(res => { const c = res.clone(); caches.open("tdd-v1").then(k => k.put(r, c)); return res; })
      .catch(() => caches.match(r).then(m => m || Response.error()))
  );
});
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: "Tana del Diavolo", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Tana del Diavolo", {
    body: d.body || "",
    icon: "assets/icon-192.png",
    badge: "assets/badge.png",
    data: { url: d.url || "./" },
    vibrate: [80, 40, 80]
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) { c.navigate(url); return c.focus(); }
    return clients.openWindow(url);
  }));
});
