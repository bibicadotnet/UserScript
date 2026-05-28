// ==UserScript==
// @name         GitHub Proxy Smart Click
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Chỉ proxy link download/raw, không đổi domain github.com khi lướt web
// @author       gh.bibica.net
// @match        *://github.com/*
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/github-proxy-smart-click.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/github-proxy-smart-click.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const PROXY = 'gh.bibica.net';
    const MAP = {
        'raw.githubusercontent.com': '/_raw',
        'api.github.com': '/_api',
        'release-assets.githubusercontent.com': '/_release-assets',
        'objects.githubusercontent.com': '/_objects',
        'codeload.github.com': '/_codeload'
    };

    function getProxied(originalUrl) {
        try {
            // Check if repository is public to prevent 404 on private repos
            const meta = document.querySelector('meta[name="octolytics-dimension-repository_public"]');
            if (meta && meta.content === 'false') {
                return null;
            }

            const url = new URL(originalUrl);

            if (MAP.hasOwnProperty(url.hostname)) {
                return `https://${PROXY}${MAP[url.hostname]}${url.pathname}${url.search}${url.hash}`;
            }

            if (url.hostname === 'github.com') {
                const isDownload = ['/releases/download/', '/archive/', '/raw/'].some(p => url.pathname.includes(p));
                if (isDownload) {
                    return `https://${PROXY}${url.pathname}${url.search}${url.hash}`;
                }
            }
        } catch (e) {}
        return null;
    }

    const handle = (e) => {
        const a = e.target.closest('a');
        if (a && a.href) {
            const newUrl = getProxied(a.href);
            if (newUrl) {
                a.href = newUrl;
                a.setAttribute('data-turbo', 'false');
            }
        }
    };

    document.addEventListener('mousedown', handle, true);
    document.addEventListener('mouseover', handle, true);
})();
