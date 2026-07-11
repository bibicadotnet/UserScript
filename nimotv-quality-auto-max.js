// ==UserScript==
// @name         NimoTV Quality Auto Max
// @namespace    https://github.com/bibicadotnet/UserScript/
// @version      1.0
// @description  Tự động chọn chất lượng cao nhất cho NimoTV embed
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/nimotv-quality-auto-max.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/nimotv-quality-auto-max.js
// @match        *://www.nimo.tv/embed/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        TIMEOUT: 15000,
        KEYWORDS: { '4k': 2160, 'gốc': 4000, 'original': 4000, 'source': 4000 }
    };

    let isHovered = false;

    function simulateEvent(element, type) {
        if (!element) return;
        element.dispatchEvent(new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }

    function parseQuality(text) {
        const normalized = text.toLowerCase();

        for (const [key, val] of Object.entries(CONFIG.KEYWORDS)) {
            if (normalized.includes(key)) return val;
        }

        const match = normalized.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    function checkAndSelect(observer) {
        const rateControlWrapper = document.querySelector('[class*="rate-control"]:not(.rate-control_list):not(.rate-control_item)');
        const qualityList = document.querySelector('.rate-control_list');

        if (rateControlWrapper && !qualityList && !isHovered) {
            simulateEvent(rateControlWrapper, 'mouseenter');
            isHovered = true;
            return;
        }

        if (qualityList) {
            const qualityItems = qualityList.querySelectorAll('.rate-control_item');
            if (qualityItems.length === 0) return;

            let targetNode = null;
            let maxRes = -1;

            qualityItems.forEach(item => {
                const text = item.textContent || item.innerText || '';
                const res = parseQuality(text);

                if (res > maxRes) {
                    maxRes = res;
                    targetNode = item;
                }
            });

            const finalTarget = targetNode || qualityItems[0];
            if (finalTarget) {
                simulateEvent(finalTarget, 'click');

                if (observer) observer.disconnect();
                clearTimeout(timeoutId);
            }
        }
    }

    checkAndSelect(null);

    const observer = new MutationObserver(() => checkAndSelect(observer));
    observer.observe(document.body, { childList: true, subtree: true });

    const timeoutId = setTimeout(() => {
        observer.disconnect();
    }, CONFIG.TIMEOUT);
})();
