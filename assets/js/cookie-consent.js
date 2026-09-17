/* =========================================================
   816800.xyz — Cookie 同意横幅（GDPR / Consent Mode v2）
   - 未表态前：analytics.js 保持全面拒绝，不写 cookie、不发请求
   - Accept  ：派发 cc:accepted，分析脚本此刻才加载
   - Reject  ：记录选择，分析脚本永不加载（可随时在隐私政策页改主意）
   - 复用了全站 .i18n-block > .en / .zh 双语约定
   ========================================================= */
(function () {
  "use strict";

  var KEY = "cc_consent_v1";
  var LANG_KEY = "lang_v1";

  function readStore(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function writeStore(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  if (readStore(KEY)) return; // 已表态，不再打扰

  var lang = readStore(LANG_KEY) === "zh" ? "zh" : "en";

  var wrap = document.createElement("div");
  wrap.className = "cc-banner i18n-block " + (lang === "zh" ? "lang-zh" : "lang-en");
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", "Cookie consent");

  wrap.innerHTML =
    '<span class="en">' +
    '  <span class="cc-text">We use cookies to measure traffic and, later, to show ads. Statistics only load after you accept — reject and nothing is tracked. Read the <a href="/privacy/">privacy policy</a>.</span>' +
    '  <span class="cc-actions">' +
    '    <button type="button" class="cc-btn cc-decline" data-cc="rejected">Reject</button>' +
    '    <button type="button" class="cc-btn cc-accept" data-cc="accepted">Accept</button>' +
    '  </span>' +
    '</span>' +
    '<span class="zh">' +
    '  <span class="cc-text">我们使用 Cookie 统计流量，未来也可能用于展示广告。统计脚本只在你点击「接受」后才会加载；选择「拒绝」则完全不会被追踪。详见<a href="/privacy/">隐私政策</a>。</span>' +
    '  <span class="cc-actions">' +
    '    <button type="button" class="cc-btn cc-decline" data-cc="rejected">拒绝</button>' +
    '    <button type="button" class="cc-btn cc-accept" data-cc="accepted">接受</button>' +
    '  </span>' +
    '</span>';

  document.body.appendChild(wrap);
  requestAnimationFrame(function () { wrap.classList.add("cc-show"); });

  wrap.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cc]");
    if (!btn) return;
    var choice = btn.getAttribute("data-cc");
    writeStore(KEY, choice);
    if (choice === "accepted") {
      try { window.dispatchEvent(new Event("cc:accepted")); } catch (err) {}
    }
    wrap.classList.remove("cc-show");
    setTimeout(function () { wrap.remove(); }, 220);
  });

  // 站点语言切换时同步横幅文案
  document.addEventListener("langchange", function (e) {
    var l = (e.detail && e.detail.lang) || "en";
    wrap.classList.toggle("lang-zh", l === "zh");
    wrap.classList.toggle("lang-en", l === "en");
  });
})();
