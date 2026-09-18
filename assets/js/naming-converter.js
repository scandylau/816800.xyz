/* =========================================================
   816800.xyz — Naming Convention Converter
   用于 /tools/camelcase-converter/、/tools/snake-case-converter/、
   /tools/kebab-case-converter/ 三个独立命名规范页面。
   纯前端，无任何依赖。文本只在浏览器内处理，不上传。
   ========================================================= */
(function () {
  "use strict";

  var input = document.getElementById("ncInput");
  var output = document.getElementById("ncOutput");
  var seg = document.getElementById("ncSeg");
  var statusEl = document.getElementById("ncStatus");
  var acrEl = document.getElementById("ncAcr");
  if (!input || !output || !seg) return;

  var current = seg.getAttribute("data-default") || "camel";

  // 首字母大写；keepAcr 为真时保留全大写的缩略语原样（HTTP → HTTP）
  function cap(w, keepAcr) {
    if (keepAcr && w.length > 1 && /[A-Z]/.test(w) && w === w.toUpperCase()) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  // 拆分单词：处理 camelCase 边界、缩略语与非字母数字分隔符
  function words(t) {
    return t
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .split(/[^A-Za-z0-9]+/)
      .filter(function (w) { return w.length > 0; });
  }

  // 整段都是大写（如 "USER NAME"）时视为普通单词，不做缩略语保留
  function acrFor(ws, keepAcr) {
    if (!keepAcr) return false;
    return !ws.every(function (w) { return !/[a-z]/.test(w); });
  }

  var CASES = {
    camel: function (t, keepAcr) {
      var ws = words(t);
      if (!ws.length) return "";
      var acr = acrFor(ws, keepAcr);
      return ws.map(function (w, i) {
        return i === 0 ? w.toLowerCase() : cap(w, acr);
      }).join("");
    },
    pascal: function (t, keepAcr) {
      var ws = words(t);
      var acr = acrFor(ws, keepAcr);
      return ws.map(function (w) { return cap(w, acr); }).join("");
    },
    snake: function (t, keepAcr) {
      return words(t).map(function (w) { return w.toLowerCase(); }).join("_");
    },
    screaming: function (t, keepAcr) {
      return words(t).map(function (w) { return w.toUpperCase(); }).join("_");
    },
    kebab: function (t, keepAcr) {
      return words(t).map(function (w) { return w.toLowerCase(); }).join("-");
    },
    train: function (t, keepAcr) {
      var ws = words(t);
      var acr = acrFor(ws, keepAcr);
      return ws.map(function (w) { return cap(w, acr); }).join("-");
    },
    flat: function (t, keepAcr) {
      return words(t).map(function (w) { return w.toLowerCase(); }).join("");
    },
    dot: function (t, keepAcr) {
      return words(t).map(function (w) { return w.toLowerCase(); }).join(".");
    }
  };

  function lang() {
    return document.documentElement.lang === "zh-CN" ? "zh" : "en";
  }

  function status(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "status show " + (kind || "info");
    clearTimeout(status._t);
    status._t = setTimeout(function () {
      statusEl.className = "status";
    }, 2200);
  }

  function convert() {
    var fn = CASES[current] || CASES.camel;
    var keepAcr = !acrEl || acrEl.checked;
    output.value = input.value ? fn(input.value, keepAcr) : "";
  }

  Array.prototype.forEach.call(seg.querySelectorAll(".seg-btn"), function (b) {
    if (b.getAttribute("data-case") === current) b.classList.add("active");
    else b.classList.remove("active");
  });

  seg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg-btn");
    if (!btn) return;
    Array.prototype.forEach.call(seg.querySelectorAll(".seg-btn"), function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    current = btn.getAttribute("data-case");
    convert();
  });

  input.addEventListener("input", convert);
  if (acrEl) acrEl.addEventListener("change", convert);

  var copyBtn = document.getElementById("ncCopy");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      if (!output.value) {
        status(lang() === "zh" ? "还没有可复制的内容" : "Nothing to copy yet", "info");
        return;
      }
      var done = function () { status(lang() === "zh" ? "已复制到剪贴板" : "Copied to clipboard", "ok"); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.value).then(done, fallbackCopy);
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        output.select();
        try { document.execCommand("copy"); done(); }
        catch (e) { status(lang() === "zh" ? "复制失败，请手动选择" : "Copy failed, please select manually", "error"); }
      }
    });
  }

  var swapBtn = document.getElementById("ncSwap");
  if (swapBtn) {
    swapBtn.addEventListener("click", function () {
      if (!output.value) return;
      input.value = output.value;
      convert();
    });
  }

  var clearBtn = document.getElementById("ncClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      input.value = "";
      output.value = "";
      input.focus();
    });
  }

  convert();
})();
