// ==UserScript==
// @name         Google Web Only
// @namespace    https://github.com/bibicadotnet/UserScript/
// @homepageURL  https://github.com/bibicadotnet/UserScript/
// @version      1.7
// @author       bibica.net
// @license      MIT
// @description  Mở kết quả tìm kiếm từ Google bằng tab Web thuần túy và dọn URL tracking
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

    function injectUdmInput() {
        const forms = document.querySelectorAll('form[action="/search"]');
        forms.forEach(form => {
            if (!form.querySelector('input[name="udm"]') && !form.querySelector('input[name="tbm"]')) {
                const udmInput = document.createElement('input');
                udmInput.type = 'hidden';
                udmInput.name = 'udm';
                udmInput.value = '14';
                form.appendChild(udmInput);
            }
        });
    }

    const observer = new MutationObserver(() => {
        injectUdmInput();
    });

    document.addEventListener('DOMContentLoaded', () => {
        injectUdmInput();
        observer.observe(document.body, { childList: true, subtree: true });
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
