// ==UserScript==
// @name         YouTube Quality Auto Max (Cap at 4K)
// @namespace    https://github.com/bibicadotnet/UserScript/
// @homepageURL  https://github.com/bibicadotnet/UserScript/
// @version      1.1.0
// @author       bibica.net
// @license      MIT
// @description  Tự động chọn Max Quality 4K nhưng cho phép giảm độ phân giải thủ công khi cần
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/youtube-quality-auto-max.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/youtube-quality-auto-max.js
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// @unwrap
// @inject-into  page
// ==/UserScript==

(() => {
    'use strict';

    let isManualOverride = false;
    const TARGET = 'hd2160';

    const ALLOWED = new Set(['hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny']);

    const AUTO_KEYWORDS = [
        'auto',
        'tự động',
        'automatique',
        'automatisch',
        'automático',
        'automatico',
        '自動',
        '자동',
        'авто',
    ];

    function forceQuality(player) {
        if (isManualOverride || !player || document.visibilityState !== 'visible') return;
        if (typeof player.getAvailableQualityLevels !== 'function') {
            try { player.setPlaybackQualityRange(TARGET, TARGET); } catch {}
            return;
        }
        const best = player.getAvailableQualityLevels().find(l => ALLOWED.has(l)) || TARGET;
        if (player.getPlaybackQuality() === best) return;
        try {
            player.setPlaybackQualityRange(best, best);
            player.setPlaybackQuality(best);
        } catch {}
    }

    document.addEventListener('durationchange', e => {
        if (!(e.target instanceof HTMLMediaElement)) return;
        forceQuality(document.getElementById('movie_player'));
    }, true);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible')
            forceQuality(document.getElementById('movie_player'));
    });

    const observer = new MutationObserver(() => {
        const player = document.getElementById('movie_player');
        if (!player) return;
        observer.disconnect();
        if (typeof player.addEventListener === 'function') {
            player.addEventListener('onAvailableQualityLevelsChanged', () => forceQuality(player));
            player.addEventListener('onVideoDataChange', () => forceQuality(player));
            player.addEventListener('onStateChange', s => {
                if (s === -1 || s === 1 || s === 3) forceQuality(player);
            });
        }
        forceQuality(player);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('yt-navigate-finish', () => {
        isManualOverride = false;
        forceQuality(document.getElementById('movie_player'));
    });

    const now = Date.now();
    const QUALITY_STORAGE_VALUE = JSON.stringify({
        data: TARGET,
        expiration: now + 31536000000,
        creation: now
    });

    const patchStorage = s => {
        const { getItem, setItem } = s;
        s.getItem = function(k) {
            if (k === 'yt-player-quality' && !isManualOverride)
                return QUALITY_STORAGE_VALUE;
            return getItem.apply(this, arguments);
        };
        s.setItem = function(k, v) {
            if (k === 'yt-player-quality' && !isManualOverride)
                v = QUALITY_STORAGE_VALUE;
            return setItem.call(this, k, v);
        };
    };
    try { patchStorage(localStorage); } catch {}

    document.addEventListener('click', e => {
        const item = e.target.closest('.ytp-quality-menu .ytp-menuitem, .ytp-settings-menu .ytp-menuitem');
        if (!item) return;
        const label = (item.querySelector('.ytp-menuitem-label') || item).textContent.toLowerCase();
        isManualOverride = !AUTO_KEYWORDS.some(k => label.includes(k));
        if (!isManualOverride) forceQuality(document.getElementById('movie_player'));
    }, true);
})();
