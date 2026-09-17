/* =========================================================
   816800.xyz — Google Analytics 4（同意门控版）
   - 未经访客明确同意，不写入任何 cookie、不发送任何统计请求
   - 同意后按 Consent Mode v2 升级权限并在此刻才加载 gtag
   - 拒绝：完全不加载分析脚本（隐私政策承诺与实际行为保持一致）
   ========================================================= */
(function () {
  "use strict";

  var GA_ID = "G-JEMKSVKD32";
  var KEY = "cc_consent_v1"; // 'accepted' | 'rejected'
  if (!GA_ID || GA_ID.indexOf("XXXX") !== -1) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // 默认一律拒绝；等待访客在横幅上作出选择（wait_for_update 给横幅留出响应时间）
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500
  });

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID, { send_page_view: true });
  }

  function grant() {
    gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted"
    });
    loadGA();
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  // 回访直客：已有授权则直接放行；已拒绝或尚未表态则维持拒绝态
  if (stored() === "accepted") grant();

  // 新访客：等待横幅上的选择
  window.addEventListener("cc:accepted", grant);
})();
