(function () {
  // 替换为你在 Google Analytics 4 后台拿到的 Measurement ID（以 G- 开头）
  var GA_ID = 'G-XXXXXXXXXX';
  if (!GA_ID || GA_ID.indexOf('XXXX') !== -1) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: true });
})();
