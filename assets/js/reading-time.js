/* =========================================================
   816800.xyz — Reading Time Calculator
   纯前端，无任何依赖。文本只在浏览器内处理，不上传。
   ========================================================= */
(function () {
  "use strict";

  var input = document.getElementById("rtInput");
  if (!input) return;

  var wpmInput = document.getElementById("rtWpm");
  var wpmOut = document.getElementById("rtWpmOut");
  var clearBtn = document.getElementById("rtClear");
  var rowsEl = document.getElementById("rtRows");
  var emptyEl = document.getElementById("rtEmpty");
  var tableWrap = document.getElementById("rtTableWrap");

  var SPEAK_WPM = 130;   // 口语/演示速度
  var PROFILES = [
    { wpm: 130, en: "Reading aloud or presenting", zh: "朗读 / 演示" },
    { wpm: 150, en: "Careful reading, dense material", zh: "精读 / 技术内容" },
    { wpm: 200, en: "Average silent reading", zh: "平均默读速度" },
    { wpm: 250, en: "Fast reader", zh: "较快阅读" },
    { wpm: 400, en: "Skimming", zh: "快速略读" }
  ];

  var el = {
    words: document.getElementById("rtWords"),
    chars: document.getElementById("rtChars"),
    sentences: document.getElementById("rtSentences"),
    paragraphs: document.getElementById("rtParagraphs"),
    read: document.getElementById("rtRead"),
    speak: document.getElementById("rtSpeak"),
    cjk: document.getElementById("rtCjk")
  };

  function lang() {
    return document.documentElement.lang === "zh-CN" ? "zh" : "en";
  }

  function fmt(minutes) {
    var total = Math.round(minutes * 60);
    if (total < 60) return total + "s";
    var m = Math.floor(total / 60);
    var s = total % 60;
    return s === 0 ? m + "m" : m + "m " + s + "s";
  }

  function setText(node, v) { if (node) node.textContent = v; }

  function analyze() {
    var text = input.value;
    var trimmed = text.trim();

    if (!trimmed) {
      ["words", "chars", "sentences", "paragraphs"].forEach(function (k) { setText(el[k], "0"); });
      setText(el.read, "0s");
      setText(el.speak, "0s");
      setText(el.cjk, "0");
      if (rowsEl) rowsEl.innerHTML = "";
      if (tableWrap) tableWrap.style.display = "none";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    if (tableWrap) tableWrap.style.display = "block";

    var words = trimmed.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    var chars = text.length;
    var sentences = trimmed.split(/[.!?。！？]+(?:\s|$)/)
      .filter(function (s) { return s.trim().length > 0; }).length;
    var paragraphs = trimmed.split(/\n\s*\n/)
      .filter(function (p) { return p.trim().length > 0; }).length;
    if (paragraphs === 0) paragraphs = 1;

    var cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
    var wpm = wpmInput ? parseInt(wpmInput.value, 10) : 200;
    if (!wpm || wpm < 50) wpm = 200;

    setText(el.words, String(words));
    setText(el.chars, String(chars));
    setText(el.sentences, String(sentences));
    setText(el.paragraphs, String(paragraphs));
    setText(el.read, fmt(words / wpm));
    setText(el.speak, fmt(words / SPEAK_WPM));
    setText(el.cjk, String(cjk));

    if (rowsEl) {
      var zh = lang() === "zh";
      rowsEl.innerHTML = PROFILES.map(function (p) {
        var t = fmt(words / p.wpm);
        var hl = p.wpm === wpm ? ' style="color:var(--accent)"' : "";
        return "<tr><td>" + p.wpm + " wpm</td><td>" + (zh ? p.zh : p.en) +
          '</td><td class="rt-time"' + hl + ">" + t + "</td></tr>";
      }).join("");
    }
  }

  if (wpmInput) {
    var sync = function () { if (wpmOut) wpmOut.textContent = wpmInput.value; analyze(); };
    wpmInput.addEventListener("input", sync);
    sync();
  }
  input.addEventListener("input", analyze);
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      input.value = "";
      analyze();
      input.focus();
    });
  }
  document.addEventListener("langchange", analyze);
  analyze();
})();
