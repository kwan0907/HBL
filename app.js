// Compatibility bootstrap: keep the legacy /app.js URL stable while the application code lives in /src/app.js.
(function loadHblApp() {
  const script = document.createElement('script');
  script.src = './src/app.js?v=20260915-runtime-layout-v1';
  script.async = false;
  script.onerror = function () {
    console.error('無法載入 HBL 主程式：' + script.src);
    document.documentElement.classList.remove('app-preparing');
  };
  document.head.appendChild(script);
})();
