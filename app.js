// Compatibility bootstrap: keep the legacy /app.js URL stable while the application code lives in /src/app.js.
(function loadHblApp() {
  const script = document.createElement('script');
  script.src = './src/app.js?v=20261009-match-v2';
  script.async = false;
  script.onerror = function () {
    console.error('無法載入 HBL 主程式：' + script.src);
    document.documentElement.classList.remove('app-preparing');
  };
  document.head.appendChild(script);
})();
