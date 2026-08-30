/* =========================================================
   816800.xyz — Fancy Text Generator (Unicode 花体字)
   纯前端，无任何依赖。文本只在浏览器内处理，不上传。
   ========================================================= */
(function () {
  "use strict";

  var input = document.getElementById("fcInput");
  var list = document.getElementById("fcList");
  var emptyHint = document.getElementById("fcEmpty");
  var clearBtn = document.getElementById("fcClear");
  if (!input || !list) return;

  function cp(n) { return String.fromCodePoint(n); }

  // 由基准码位 + 特例生成字母映射表
  function buildMap(upperBase, lowerBase, upperExc, lowerExc) {
    var m = {}, i;
    for (i = 0; i < 26; i++) {
      m[String.fromCharCode(65 + i)] = cp(upperBase + i); // A-Z
      m[String.fromCharCode(97 + i)] = cp(lowerBase + i); // a-z
    }
    if (upperExc) Object.keys(upperExc).forEach(function (k) { m[k] = cp(upperExc[k]); });
    if (lowerExc) Object.keys(lowerExc).forEach(function (k) { m[k] = cp(lowerExc[k]); });
    return m;
  }

  var BOLD = buildMap(0x1d400, 0x1d41a);
  var ITALIC = buildMap(0x1d434, 0x1d44e, null, { h: 0x210e });
  var BOLD_ITALIC = buildMap(0x1d468, 0x1d482);
  var SCRIPT = buildMap(0x1d49c, 0x1d4b0,
    { B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b },
    { e: 0x212f, g: 0x210a, o: 0x2134 });
  var BOLD_SCRIPT = buildMap(0x1d4d0, 0x1d4ea);
  var FRAKTUR = buildMap(0x1d504, 0x1d51e,
    { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 });
  var DOUBLE = buildMap(0x1d538, 0x1d552,
    { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 });
  var MONO = buildMap(0x1d670, 0x1d68a);
  var SANS_BOLD = buildMap(0x1d5d4, 0x1d5ee);
  var SANS_ITALIC = buildMap(0x1d608, 0x1d622);
  var CIRCLED = buildMap(0x24b6, 0x24d0);

  function fullwidth(t) {
    var out = "", i, c, code;
    for (i = 0; i < t.length; i++) {
      c = t[i];
      code = t.charCodeAt(i);
      if (code >= 65 && code <= 90) out += cp(0xff21 + (code - 65));
      else if (code >= 97 && code <= 122) out += cp(0xff41 + (code - 97));
      else if (code >= 48 && code <= 57) out += cp(0xff10 + (code - 48));
      else if (c === " ") out += cp(0x3000);
      else out += c;
    }
    return out;
  }

  var SMALL_CAPS_LOWER = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ";

  function smallCaps(t) {
    var out = "", i, code;
    for (i = 0; i < t.length; i++) {
      code = t.charCodeAt(i);
      if (code >= 97 && code <= 122) {
        var idx = code - 97;
        if (idx < SMALL_CAPS_LOWER.length) out += SMALL_CAPS_LOWER[idx];
        else out += t[i];
      } else out += t[i];
    }
    return out;
  }

  var UP_A = "∀ᗺƆᗡƎℲ⅁HIſʞ˥WNOԀΌᴚS⊥∩ΛMX⅄Z";
  var UP_a = "ɐqɔpǝɟƃɥıɾʞlɯuodbɹsʇnʌʍxʎz";
  var UP_PUNCT = {
    ".": "˙", ",": "'", "?": "¿", "!": "¡", "'": ",", '"': "„",
    "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{",
    "<": ">", ">": "<", "&": "⅋", "_": "‾", ";": "؛", "`": ","
  };

  function upsideDown(t) {
    var out = "", i, c, code;
    for (i = 0; i < t.length; i++) {
      c = t[i]; code = t.charCodeAt(i);
      if (code >= 65 && code <= 90) out += UP_A[code - 65];
      else if (code >= 97 && code <= 122) out += UP_a[code - 97];
      else if (code >= 48 && code <= 57) out += "0ІᄅƐㄣϛ9ㄥ86"[code - 48];
      else if (UP_PUNCT[c]) out += UP_PUNCT[c];
      else out += c;
    }
    return out.split("").reverse().join("");
  }

  function applyMap(m, t) {
    var out = "", i, c;
    for (i = 0; i < t.length; i++) {
      c = t[i];
      out += (m[c] !== undefined) ? m[c] : c;
    }
    return out;
  }

  var STYLES = [
    { name: "Bold", fn: function (t) { return applyMap(BOLD, t); } },
    { name: "Italic", fn: function (t) { return applyMap(ITALIC, t); } },
    { name: "Bold Italic", fn: function (t) { return applyMap(BOLD_ITALIC, t); } },
    { name: "Script", fn: function (t) { return applyMap(SCRIPT, t); } },
    { name: "Bold Script", fn: function (t) { return applyMap(BOLD_SCRIPT, t); } },
    { name: "Fraktur", fn: function (t) { return applyMap(FRAKTUR, t); } },
    { name: "Double-struck", fn: function (t) { return applyMap(DOUBLE, t); } },
    { name: "Monospace", fn: function (t) { return applyMap(MONO, t); } },
    { name: "Sans Bold", fn: function (t) { return applyMap(SANS_BOLD, t); } },
    { name: "Sans Italic", fn: function (t) { return applyMap(SANS_ITALIC, t); } },
    { name: "Circled", fn: function (t) { return applyMap(CIRCLED, t); } },
    { name: "Fullwidth", fn: fullwidth },
    { name: "Small Caps", fn: smallCaps },
    { name: "Upside Down", fn: upsideDown }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function lang() {
    return document.documentElement.lang === "zh-CN" ? "zh" : "en";
  }

  function render() {
    var text = input.value;
    if (!text.trim()) {
      list.innerHTML = "";
      if (emptyHint) emptyHint.style.display = "block";
      return;
    }
    if (emptyHint) emptyHint.style.display = "none";

    list.innerHTML = STYLES.map(function (st, i) {
      var out = st.fn(text);
      return '<div class="style-item">' +
        '<span class="style-name">' + esc(st.name) + "</span>" +
        '<span class="style-out" id="fcOut' + i + '">' + esc(out) + "</span>" +
        '<button class="btn btn-ghost style-copy" type="button" data-idx="' + i + '">' +
        (lang() === "zh" ? "复制" : "Copy") + "</button>" +
        "</div>";
    }).join("");
  }

  list.addEventListener("click", function (e) {
    var btn = e.target.closest(".style-copy");
    if (!btn) return;
    var idx = btn.getAttribute("data-idx");
    var node = document.getElementById("fcOut" + idx);
    if (!node) return;
    var value = node.textContent;
    var label = btn.textContent;
    var done = function () {
      btn.textContent = lang() === "zh" ? "已复制" : "Copied";
      setTimeout(function () { btn.textContent = label; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () { legacy(); });
    } else {
      legacy();
    }
    function legacy() {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); }
      catch (err) { btn.textContent = lang() === "zh" ? "失败" : "Failed"; }
      document.body.removeChild(ta);
    }
  });

  input.addEventListener("input", render);
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      input.value = "";
      render();
      input.focus();
    });
  }

  render();
})();
