/* =========================================================
   816800.xyz — M3U8 / HLS / MPD 在线播放测试核心逻辑
   - hls.js 解码 .m3u8，dash.js 解码 .mpd
   - Plyr 作为扁平化播放 UI
   - CORS 跨域自动诊断（no-cors 探活 + cors 校验）
   - localStorage 最近 5 条测试历史
   - 中英双语：动态提示调用 t(zh, en)，依据 <html lang>
   ========================================================= */
(function () {
  "use strict";

  var video = document.getElementById("player");
  var input = document.getElementById("urlInput");
  var playBtn = document.getElementById("playBtn");
  var tagsBox = document.getElementById("tags");
  var statusEl = document.getElementById("status");
  var historyList = document.getElementById("historyList");
  var historyEmpty = document.getElementById("historyEmpty");
  var histCount = document.getElementById("histCount");

  var HISTORY_KEY = "m3u8_history_v1";
  var MAX_HISTORY = 5;

  var player = null;
  var hls = null;
  var dash = null;
  var diagTimer = null;

  /* 双语取值：依据 <html lang> 由 i18n.js 设置 */
  function t(zh, en) {
    return document.documentElement.lang === "en" ? en : zh;
  }

  /* ---------- Plyr 初始化 ---------- */
  if (window.Plyr && video) {
    player = new Plyr(video, {
      controls: [
        "play-large", "play", "progress", "current-time",
        "duration", "mute", "volume", "settings", "fullscreen"
      ],
      settings: ["speed"],
      ratio: "16:9",
      autoplay: false,
      blankVideo: false
    });
  }

  /* ---------- 状态条 ---------- */
  function setStatus(type, html) {
    if (!statusEl) return;
    statusEl.className = "status show " + (type || "info");
    statusEl.innerHTML = html || "";
  }
  function clearStatus() {
    if (statusEl) statusEl.className = "status";
  }

  /* ---------- 历史记录 ---------- */
  function getHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveHistory(arr) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function pushHistory(url) {
    var arr = getHistory().filter(function (u) { return u !== url; });
    arr.unshift(url);
    if (arr.length > MAX_HISTORY) arr = arr.slice(0, MAX_HISTORY);
    saveHistory(arr);
    renderHistory();
  }
  function removeHistory(url) {
    var arr = getHistory().filter(function (u) { return u !== url; });
    saveHistory(arr);
    renderHistory();
  }
  function renderHistory() {
    var arr = getHistory();
    if (!historyList || !historyEmpty) return;
    // 空状态（自带中英双版，由 i18n.js 切换）
    if (!arr.length) {
      historyEmpty.style.display = "";
      historyList.style.display = "none";
      if (histCount) histCount.textContent = "";
      return;
    }
    historyEmpty.style.display = "none";
    historyList.style.display = "";
    historyList.innerHTML = "";
    if (histCount) histCount.textContent = "(" + arr.length + ")";

    arr.forEach(function (url) {
      var item = document.createElement("div");
      item.className = "history-item";

      var u = document.createElement("span");
      u.className = "h-url";
      u.textContent = url;
      u.title = url;

      var replay = document.createElement("button");
      replay.className = "h-replay";
      replay.type = "button";
      replay.setAttribute("data-zh", "复测");
      replay.setAttribute("data-en", "Replay");
      replay.textContent = t("复测", "Replay");
      replay.addEventListener("click", function () {
        input.value = url;
        loadStream(url);
      });

      var del = document.createElement("button");
      del.className = "h-del";
      del.type = "button";
      del.setAttribute("data-zh", "×");
      del.setAttribute("data-en", "×");
      del.setAttribute("data-zh-title", "删除");
      del.setAttribute("data-en-title", "Delete");
      del.textContent = "×";
      del.addEventListener("click", function () { removeHistory(url); });

      item.appendChild(u);
      item.appendChild(replay);
      item.appendChild(del);
      historyList.appendChild(item);
    });
  }

  /* ---------- 清理上一次流 ---------- */
  function clearStream() {
    try { if (hls) { hls.destroy(); hls = null; } } catch (e) {}
    try { if (dash) { dash.reset(); dash = null; } } catch (e) {}
    try { video.removeAttribute("src"); video.load(); } catch (e) {}
  }

  /* ---------- CORS / 网络诊断 ---------- */
  function runDiagnose(url) {
    if (!url) return;
    setStatus("loading", t("正在诊断连接与跨域状态…", "Diagnosing connectivity and CORS…"));

    fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", headers: { Range: "bytes=0-0" } })
      .then(function () { return diagnoseCors(url); })
      .catch(function () { return diagnoseCors(url); })
      .then(function (msg) { setStatus("error", msg); });
  }

  function diagnoseCors(url) {
    if (!window.fetch) {
      return t(
        "无法自动诊断（浏览器不支持 fetch）。请确认地址有效且服务器已配置 CORS 跨域许可。",
        "Cannot auto-diagnose (browser lacks fetch support). Please confirm the URL is valid and the server allows CORS."
      );
    }
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store", headers: { Range: "bytes=0-0" } })
      .then(function (res) {
        if (res.ok || res.status === 206 || res.status === 200) {
          return t(
            "地址可跨域访问，理论上应能播放。若仍黑屏，请检查该清单是否指向有效的音视频分片，或换用下方快捷测试源对比。",
            "The URL is CORS-accessible and should play. If it is still black, check whether the playlist points to valid audio/video segments, or try the quick sources below."
          );
        }
        return t(
          "服务器返回 HTTP " + res.status + "，地址可能已失效、需要鉴权（Token）或被限流。若该地址是快捷测试源，它可能已临时下线，请换用下方的其他测试源对比。",
          "The server returned HTTP " + res.status + ". The URL may be expired, require auth (Token), or be rate-limited. If this is one of the quick sources, it may be temporarily down — try another quick source below."
        );
      })
      .catch(function () {
        return t(
          "<strong>视频加载失败：该流媒体服务器未配置 CORS 跨域许可，浏览器已拦截请求。</strong><br>这是「在线播放 m3u8 报错」最常见的原因。请确认源站返回了 <code>Access-Control-Allow-Origin</code> 响应头，或改用下方支持 CORS 的官方测试源。你也可以在自己的服务器上做一层同源反向代理来绕过跨域限制。",
          "<strong>Playback failed: the streaming server has no CORS permission configured, so the browser blocked the request.</strong><br>This is the most common cause of \"online m3u8 playback errors.\" Confirm the origin returns an <code>Access-Control-Allow-Origin</code> header, or use the CORS-enabled official test sources below. You can also add a same-origin reverse proxy on your own server to bypass the cross-origin limit."
        );
      });
  }

  function onFatal(url) {
    clearTimeout(diagTimer);
    runDiagnose(url);
  }

  /* ---------- 加载流 ---------- */
  function loadStream(rawUrl) {
    var url = (rawUrl || "").trim();
    if (!url) {
      setStatus("error", t("请输入有效的流媒体地址（.m3u8 或 .mpd）。", "Please enter a valid stream URL (.m3u8 or .mpd)."));
      return;
    }
    clearStream();
    pushHistory(url);
    setStatus("loading", t("正在解析流地址 <code>" + escapeHtml(url) + "</code> …", "Resolving stream <code>" + escapeHtml(url) + "</code> …"));
    clearTimeout(diagTimer);
    diagTimer = setTimeout(function () { runDiagnose(url); }, 14000);

    var lower = url.split("?")[0].toLowerCase();

    try {
      if (lower.endsWith(".m3u8")) {
        if (window.Hls && window.Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            clearTimeout(diagTimer);
            setStatus("ok", t("清单解析成功，开始播放。", "Playlist parsed, starting playback."));
            video.play().catch(function () {});
          });
          hls.on(window.Hls.Events.ERROR, function (evt, data) {
            if (data && data.fatal) onFatal(url);
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          video.addEventListener("loadedmetadata", function () {
            clearTimeout(diagTimer);
            setStatus("ok", t("清单解析成功，开始播放。", "Playlist parsed, starting playback."));
            video.play().catch(function () {});
          }, { once: true });
          video.addEventListener("error", function () { onFatal(url); }, { once: true });
        } else {
          clearTimeout(diagTimer);
          setStatus("error", t("当前浏览器不支持 HLS 播放，请更换 Chrome / Edge / Firefox 等现代浏览器。", "Your browser does not support HLS. Please use a modern browser such as Chrome, Edge or Firefox."));
        }
      } else if (lower.endsWith(".mpd")) {
        if (window.dashjs) {
          dash = window.dashjs.MediaPlayer().create();
          dash.initialize(video, url, true);
          dash.on("error", function () { onFatal(url); });
          dash.on("streamInitialized", function () {
            clearTimeout(diagTimer);
            setStatus("ok", t("DASH 流初始化成功，开始播放。", "DASH stream initialized, starting playback."));
          });
        } else {
          clearTimeout(diagTimer);
          setStatus("error", t("DASH 播放内核（dash.js）加载失败，请刷新页面重试。", "DASH player (dash.js) failed to load. Please refresh and retry."));
        }
      } else {
        video.src = url;
        video.addEventListener("loadedmetadata", function () {
          clearTimeout(diagTimer);
          setStatus("ok", t("媒体加载成功，开始播放。", "Media loaded, starting playback."));
          video.play().catch(function () {});
        }, { once: true });
        video.addEventListener("error", function () { onFatal(url); }, { once: true });
      }
    } catch (err) {
      clearTimeout(diagTimer);
      onFatal(url);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 事件绑定 ---------- */
  if (playBtn) {
    playBtn.addEventListener("click", function () { loadStream(input.value); });
  }
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); loadStream(input.value); }
    });
  }
  if (tagsBox) {
    tagsBox.addEventListener("click", function (e) {
      var tag = e.target.closest(".tag");
      if (!tag) return;
      var u = tag.getAttribute("data-url");
      if (u) { input.value = u; loadStream(u); }
    });
  }

  /* ---------- 初始渲染 ---------- */
  renderHistory();
})();
