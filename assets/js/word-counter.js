/* =========================================================
   816800.xyz — Word Counter (含关键词密度)
   纯前端，无任何依赖。文本只在浏览器内处理，不上传。
   ========================================================= */
(function () {
  "use strict";

  var input = document.getElementById("wcInput");
  if (!input) return;

  var el = {
    words: document.getElementById("wcWords"),
    chars: document.getElementById("wcChars"),
    charsNoSpace: document.getElementById("wcCharsNoSpace"),
    sentences: document.getElementById("wcSentences"),
    paragraphs: document.getElementById("wcParagraphs"),
    read: document.getElementById("wcRead"),
    speak: document.getElementById("wcSpeak"),
    unique: document.getElementById("wcUnique"),
    kwWrap: document.getElementById("wcKwWrap"),
    kw: document.getElementById("wcKw"),
    kwHint: document.getElementById("wcKwHint"),
    empty: document.getElementById("wcEmpty"),
    stop: document.getElementById("wcStop"),
    clear: document.getElementById("wcClear")
  };

  // 常见英文停用词
  var STOP = ("a about above after again against all am an and any are as at be because been before being " +
    "below between both but by can did do does doing dont down during each few for from further had has have " +
    "having he her here hers herself him himself his how i if in into is it its itself just me more most my " +
    "myself no nor not now of off on once only or other ought our ours ourselves out over own same she should " +
    "so some such than that the their theirs them themselves then there these they this those through to too " +
    "under until up very was we were what when where which while who whom why with would you your yours " +
    "yourself yourselves will can could shall s t dont isn t arent").split(/\s+/);

  var STOPSET = {};
  STOP.forEach(function (w) { STOPSET[w] = true; });

  var WPM_READ = 200;   // 默读速度（词/分钟）
  var WPM_SPEAK = 130;  // 朗读速度（词/分钟）

  function fmtTime(minutes) {
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
      ["words", "chars", "charsNoSpace", "sentences", "paragraphs", "read", "speak", "unique"]
        .forEach(function (k) { setText(el[k], k === "read" || k === "speak" ? "0s" : "0"); });
      if (el.kwWrap) el.kwWrap.style.display = "none";
      if (el.kw) el.kw.innerHTML = "";
      if (el.empty) el.empty.style.display = "block";
      return;
    }
    if (el.empty) el.empty.style.display = "none";

    // 词数：按空白切分
    var rawWords = trimmed.split(/\s+/).filter(function (w) { return w.length > 0; });
    var wordCount = rawWords.length;

    // 字符
    var charCount = text.length;
    var charNoSpace = text.replace(/\s+/g, "").length;

    // 句数
    var sentences = trimmed.split(/[.!?。！？]+(?:\s|$)/)
      .filter(function (s) { return s.trim().length > 0; }).length;

    // 段落数
    var paragraphs = trimmed.split(/\n\s*\n/)
      .filter(function (p) { return p.trim().length > 0; }).length;
    if (paragraphs === 0) paragraphs = 1;

    // 归一化词（用于去重与密度）
    var norm = trimmed.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s'-]/g, " ")
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 0 && !/^['-]+$/.test(w);
      });

    var useStop = el.stop && el.stop.checked;
    var pool = useStop ? norm.filter(function (w) { return !STOPSET[w]; }) : norm;

    var freq = {};
    pool.forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });

    var ranked = Object.keys(freq).map(function (w) {
      return { word: w, count: freq[w] };
    }).sort(function (a, b) {
      return b.count - a.count || a.word.localeCompare(b.word);
    }).slice(0, 10);

    var maxCount = ranked.length ? ranked[0].count : 1;

    setText(el.words, String(wordCount));
    setText(el.chars, String(charCount));
    setText(el.charsNoSpace, String(charNoSpace));
    setText(el.sentences, String(sentences));
    setText(el.paragraphs, String(paragraphs));
    setText(el.read, fmtTime(wordCount / WPM_READ));
    setText(el.speak, fmtTime(wordCount / WPM_SPEAK));
    setText(el.unique, String(Object.keys(freq).length));

    // 关键词密度表
    if (el.kwWrap && el.kw) {
      if (!ranked.length) {
        el.kwWrap.style.display = "none";
      } else {
        el.kwWrap.style.display = "block";
        var html = ranked.map(function (r) {
          var pct = wordCount ? (r.count / wordCount) * 100 : 0;
          var pctTxt = pct.toFixed(pct < 1 ? 2 : 1) + "%";
          var w = Math.max(4, Math.round((r.count / maxCount) * 100));
          return '<div class="kw-row">' +
            '<span class="kw-word" title="' + esc(r.word) + '">' + esc(r.word) + "</span>" +
            '<span class="kw-bar-wrap"><span class="kw-bar" style="width:' + w + '%"></span></span>' +
            '<span class="kw-pct">' + pctTxt + "</span>" +
            "</div>";
        }).join("");
        el.kw.innerHTML = html;
        if (el.kwHint) {
          el.kwHint.textContent = useStop ? "stop words removed" : "raw counts";
        }
      }
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  input.addEventListener("input", analyze);
  if (el.stop) el.stop.addEventListener("change", analyze);
  if (el.clear) {
    el.clear.addEventListener("click", function () {
      input.value = "";
      analyze();
      input.focus();
    });
  }

  analyze();
})();
