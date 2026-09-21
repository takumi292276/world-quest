// World Quest のサービスワーカー：一度開けばオフラインでも遊べるようにする。
// アプリを更新したら、下の VERSION の数字を1つ上げる（古いキャッシュが消えて新しい版に入れかわる）。
const VERSION = "wq-v1";
const SHELL = ["./", "index.html", "wq-config.js", "wq-standalone.js", "vendor/three.min.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                       // AIへの送信(POST)にはさわらない
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // フォントなど外部のものはブラウザに任せる
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html") || url.pathname.endsWith("wq-config.js");
  if (isPage) {
    // ページと設定は「まずネット、だめならキャッシュ」→ 更新がすぐ届く
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || caches.match("index.html"))));
  } else {
    // 画像やライブラリは「まずキャッシュ」→ 速い
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
  }
});
