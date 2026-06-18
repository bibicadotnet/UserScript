// ==UserScript==
// @name         Google Web Only
// @namespace    https://github.com/bibicadotnet/UserScript/
// @homepageURL  https://github.com/bibicadotnet/UserScript/
// @version      1.0
// @author       bibica.net
// @license      MIT
// @description  Tự động thêm &udm=14 vào URL Google Search để loại bỏ AI Overviews và quảng cáo, đưa về giao diện Web thuần túy.
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/google-web-only.user.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/google-web-only.user.js
// @match        *://www.google.com/search*
// @match        *://www.google.com.vn/search*
// @run-at       document-start
// @grant        none
// @unwrap
// @inject-into  page
// ==/UserScript==

(function() {
    'use strict';
    const url = new URL(window.location.href);
    if (url.searchParams.has('q') && !url.searchParams.has('tbm') && !url.searchParams.has('udm')) {
        url.searchParams.set('udm', '14');
        window.location.replace(url.href);
    }
})();
