// World Quest 独立サイト用の「つなぎ役」。
// アプリ本体は Claude の機能（claude.use("sample") など）を呼ぶ作りになっている。
// Claude の外ではその機能がないので、同じ呼び方のまま自分の中継サーバーに聞きに行くようにする。
// → アプリ本体のコードは Claude版とほぼ同じまま保てる。
(function () {
  "use strict";
  if (window.claude && window.claude.use) return; // Claude上で開いたときは何もしない

  var CFG = window.WQ_CONFIG || {};
  var hasAI = typeof CFG.aiEndpoint === "string" && CFG.aiEndpoint.length > 0;
  window.WQ_STANDALONE = true;

  // 写真は送る前に小さくする（長辺1024px・JPEG）。通信量とAPI料金をおさえるため。
  function fileToJpeg(file, maxSide) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
          var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          var dataUrl = cv.toDataURL("image/jpeg", 0.8);
          resolve({ media_type: "image/jpeg", data: dataUrl.split(",")[1] });
        } catch (e) { reject({ code: "image_rejected" }); }
        finally { URL.revokeObjectURL(url); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject({ code: "image_rejected" }); };
      img.src = url;
    });
  }

  function makeSample() {
    var sample = async function (input, opts) {
      opts = opts || {};
      var turns = typeof input === "string" ? [{ role: "user", content: input }] : input;
      var body = { turns: turns };
      if (opts.images) {
        var f = Array.isArray(opts.images) ? opts.images[0] : opts.images;
        body.image = await fileToJpeg(f, 1024);
      }
      var res;
      try {
        res = await fetch(CFG.aiEndpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      } catch (e) { throw { code: "network" }; }
      if (res.status === 429) throw { code: "rate_limited" };
      var data = null;
      try { data = await res.json(); } catch (e) {}
      if (!res.ok || !data || typeof data.text !== "string") throw { code: (data && data.code) || "failed" };
      if (typeof opts.onText === "function") opts.onText({ text: data.text });
      return { text: data.text };
    };
    sample.limits = async function () { return { images: CFG.aiImages !== false }; };
    return sample;
  }

  window.claude = {
    use: async function (name) {
      if (name === "permissions") {
        return { state: async function (cap) { return cap === "sample" && hasAI ? "granted" : "denied"; } };
      }
      if (name === "sample") return hasAI ? makeSample() : null;
      return null; // "db"（みんなの共有カウンター）は独立サイトでは未対応 → 端末内の記録に自動で切りかわる
    },
  };
})();
