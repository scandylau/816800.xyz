/* =========================================================
   816800.xyz — 短链中转核心（方案 A：纯静态、零后端）
   - UTF-8 安全的 base64url 编码 / 解码
   - safeRedirect：协议白名单校验，防开放重定向滥用
   - 无依赖；编码结果放在 #u= 片段里，绝不发往服务器（零上传）
   ========================================================= */
(function () {
  "use strict";

  /* 长链接 -> URL 安全的 base64（UTF-8 安全） */
  function encodeUrl(u) {
    var bytes = new TextEncoder().encode(u);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /* URL 安全的 base64 -> 长链接（UTF-8 安全） */
  function decodeUrl(s) {
    if (!s) return "";
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* 安全校验：仅允许 http/https，限制长度，拒绝危险协议 */
  function safeRedirect(raw) {
    if (!raw) return { ok: false, reason: "empty" };
    if (raw.length > 8192) return { ok: false, reason: "too_long" };
    var url;
    try {
      url = new URL(raw);
    } catch (e) {
      return { ok: false, reason: "invalid" };
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, reason: "scheme" };
    }
    return { ok: true, url: url.href };
  }

  window.ShortLink = {
    encodeUrl: encodeUrl,
    decodeUrl: decodeUrl,
    safeRedirect: safeRedirect
  };
})();
