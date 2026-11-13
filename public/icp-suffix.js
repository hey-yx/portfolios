// 同一套页面挂在 itcox.cn 和 hey-yx.com 两个域名，备案号按访问域名取。
// 静态构建分不出域名，HTML 先渲染 -1，这里再按 hostname 换成 -4。
(() => {
  const applyIcpSuffix = () => {
    const suffix = document.querySelector("[data-icp-suffix]");
    if (!(suffix instanceof HTMLElement)) {
      return;
    }

    const host = window.location.hostname;
    suffix.textContent =
      host === "hey-yx.com" || host.endsWith(".hey-yx.com") ? "-4" : "-1";
  };

  applyIcpSuffix();
  document.addEventListener("astro:page-load", applyIcpSuffix);
})();
