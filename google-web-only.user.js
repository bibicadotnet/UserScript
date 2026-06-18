// ==UserScript==
// @name         Google Web Only
// @namespace    https://github.com/bibicadotnet/UserScript/
// @homepageURL  https://github.com/bibicadotnet/UserScript/
// @version      1.6
// @author       bibica.net
// @license      MIT
// @description  Mở kết quả tìm kiếm từ Google bằng tab Web thuần túy và dọn URL tracking
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/google-web-only.user.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/google-web-only.user.js
// @match        *://www.google.com/search*
// @match        *://www.google.com.vn/search*
// @match        *://www.google.com/webhp*
// @match        *://www.google.com.vn/webhp*
// @match        *://www.google.com/
// @match        *://www.google.com.vn/
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const url = new URL(window.location.href);

    if (url.pathname === '/webhp') {
        window.location.replace(url.origin + '/');
        return;
    }

    if (url.pathname === '/search' && url.searchParams.has('q') && !url.searchParams.has('tbm') && !url.searchParams.has('udm')) {
        url.searchParams.set('udm', '14');
        window.location.replace(url.href);
        return;
    }

    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form && form.tagName === 'FORM' && form.getAttribute('action') === '/search') {
            if (!form.querySelector('input[name="udm"]') && !form.querySelector('input[name="tbm"]')) {
                const udmInput = document.createElement('input');
                udmInput.type = 'hidden';
                udmInput.name = 'udm';
                udmInput.value = '14';
                form.appendChild(udmInput);
            }
        }
    });

    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href*="/webhp"]');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = window.location.origin + '/';
        }
    }, true);

})();
