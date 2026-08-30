/* =========================================================
   816800.xyz — Case Converter
   纯前端，无任何依赖。文本只在浏览器内处理，不上传。
   ========================================================= */
(function () {
  "use strict";

  var input = document.getElementById("ccInput");
  var output = document.getElementById("ccOutput");
  var seg = document.getElementById("ccSeg");
  var statusEl = document.getElementById("ccStatus");
  if (!input || !output || !seg) return;

  var current = "sentence";

  var SMALL = ["a", "an", "the", "and", "but", "or", "nor", "for", "so",
    "yet", "at", "by", "in", "of", "on", "to", "up", "as", "is", "if",
    "it", "vs", "via"];

  function cap(w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  // 拆分单词：同时处理 camelCase 边界与非字母数字分隔符
  function words(t) {
    return t
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[^A-Za-z0-9]+/)
      .filter(function (w) { return w.length > 0; });
  }

  var CASES = {
    sentence: function (t) {
      return t.toLowerCase().replace(/(^|[.!?]\s+)(\w)/g, function (m, p1, p2) {
        return p1 + p2.toUpperCase();
      });
    },
    lower: function (t) { return t.toLowerCase(); },
    upper: function (t) { return t.toUpperCase(); },
    title: function (t) {
      var tokens = t.toLowerCase().split(/(\s+)/);
      var total = tokens.filter(function (s) { return s.trim().length > 0; }).length;
      var wi = -1;
      return tokens.map(function (tok) {
        if (!tok || !tok.trim()) return tok;
        wi++;
        var bare = tok.replace(/[^a-z0-9]/g, "");
        if (SMALL.indexOf(bare) !== -1 && wi !== 0 && wi !== total - 1) return tok;
        return tok.charAt(0).toUpperCase() + tok.slice(1);
      }).join("");
    },
    capitalize: function (t) {
      return t.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    },
    camel: function (t) {
      var ws = words(t);
      if (!ws.length) return "";
      return ws.map(function (w, i) {
        return i === 0 ? w.toLowerCase() : cap(w);
      }).join("");
    },
    pascal: function (t) {
      return words(t).map(cap).join("");
    },
    snake: function (t) {
      return words(t).map(function (w) { return w.toLowerCase(); }).join("_");
    },
    kebab: function (t) {
      return words(t).map(function (w) { return w.toLowerCase(); }).join("-");
    },
    constant: function (t) {
      return words(t).map(function (w) { return w.toUpperCase(); }).join("_");
    },
    alternating: function (t) {
      var out = "", flip = false;
      for (var i = 0; i < t.length; i++) {
        var c = t[i];
        if (/[A-Za-z]/.test(c)) {
          out += flip ? c.toUpperCase() : c.toLowerCase();
          flip = !flip;
        } else {
          out += c;
        }
      }
      return out;
    },
    inverse: function (t) {
      var out = "";
      for (var i = 0; i < t.length; i++) {
        var c = t[i];
        out += c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      }
      return out;
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
    var fn = CASES[current] || CASES.sentence;
    output.value = input.value ? fn(input.value) : "";
  }

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

  var copyBtn = document.getElementById("ccCopy");
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

  var swapBtn = document.getElementById("ccSwap");
  if (swapBtn) {
    swapBtn.addEventListener("click", function () {
      if (!output.value) return;
      input.value = output.value;
      convert();
    });
  }

  var clearBtn = document.getElementById("ccClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      input.value = "";
      output.value = "";
      input.focus();
    });
  }

  convert();
})();
