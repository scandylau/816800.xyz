/* =========================================================
   816800.xyz — 中英双语切换内核
   - 默认语言：localStorage 记忆，未设置时按浏览器语言推断
   - 行内文本：data-zh / data-en（仅用于纯文本叶子节点）
   - 占位符：data-zh-ph / data-en-ph
   - 提示：data-zh-title / data-en-title
   - 富文本块：.i18n-block 内分别放 .zh / .en 两个子块
   ========================================================= */
(function () {
  "use strict";
  var STORE = "lang_v1";

  function getLang() {
    try {
      var s = localStorage.getItem(STORE);
      if (s === "zh" || s === "en") return s;
    } catch (e) {}
    var nav = (navigator.language || "zh").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  function setLang(l) {
    try { localStorage.setItem(STORE, l); } catch (e) {}
    apply(l);
    updateToggle();
  }

  function apply(l) {
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";

    // 行内文本
    document.querySelectorAll("[data-zh]").forEach(function (el) {
      var t = l === "zh" ? el.getAttribute("data-zh") : (el.getAttribute("data-en") || el.getAttribute("data-zh"));
      if (t !== null) el.textContent = t;
    });
    // 占位符
    document.querySelectorAll("[data-zh-ph]").forEach(function (el) {
      var t = l === "zh" ? el.getAttribute("data-zh-ph") : (el.getAttribute("data-en-ph") || el.getAttribute("data-zh-ph"));
      if (t !== null) el.setAttribute("placeholder", t);
    });
    // 标题提示
    document.querySelectorAll("[data-zh-title]").forEach(function (el) {
      var t = l === "zh" ? el.getAttribute("data-zh-title") : (el.getAttribute("data-en-title") || el.getAttribute("data-zh-title"));
      if (t !== null) el.setAttribute("title", t);
    });
    // 富文本块：通过给容器加 lang-zh / lang-en 类切换显隐，
    // 避免直接设置 display:"" 回退到 CSS 默认隐藏 .en
    document.querySelectorAll(".i18n-block").forEach(function (block) {
      block.classList.toggle("lang-zh", l === "zh");
      block.classList.toggle("lang-en", l === "en");
    });
  }

  function updateToggle() {
    var btn = document.getElementById("langToggle");
    if (!btn) return;
    var l = getLang();
    btn.textContent = l === "zh" ? "EN" : "中文";
    btn.setAttribute("aria-label", l === "zh" ? "Switch to English" : "切换到中文");
  }

  function init() {
    var l = getLang();
    apply(l);
    updateToggle();
    var btn = document.getElementById("langToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        setLang(getLang() === "zh" ? "en" : "zh");
      });
    }
    // 语言变更时同步重新渲染（如历史记录等动态内容依赖 lang 不影响，但保险）
    document.addEventListener("languagechange", function () { apply(getLang()); updateToggle(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
