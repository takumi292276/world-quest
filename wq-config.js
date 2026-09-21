// World Quest 独立サイト版の設定ファイル
// ここだけ書きかえれば、アプリ本体（index.html）はさわらなくてOK。
window.WQ_CONFIG = {
  // AIチャットの中継サーバーのURL。
  // 空（""）のあいだは、AIチャットと写真ふりかえりは「準備中」と表示される（他の機能は全部動く）。
  // 中継サーバーを公開したら、例のようにURLを入れる： "https://wq-ai.xxxxx.workers.dev/chat"
  aiEndpoint: "",

  // 写真ふりかえり（画像をAIに送る機能）を使うか。false にすると文章の質問だけになる。
  aiImages: true,

  // Claude上で動いている元のバージョン（AIはClaudeにログインした人だけ使える）
  claudeVersionUrl: "https://claude.ai/code/artifact/83e21aa8-4e37-407c-a075-8effaae0ee37",
};
