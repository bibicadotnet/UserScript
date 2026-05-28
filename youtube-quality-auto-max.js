// ==UserScript==
// @name         YouTube: Quality Auto Max
// @namespace    https://github.com/bibicadotnet/UserScript/
// @homepageURL  https://github.com/bibicadotnet/UserScript/
// @version      1.0
// @author       CY Fung
// @license      MIT
// @description  Tự động chọn Max Quality nhưng cho phép giảm độ phân giải thủ công khi cần
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/youtube-quality-auto-max.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/youtube-quality-auto-max.js
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// @unwrap
// @inject-into  page
// ==/UserScript==

(() => {
    const Promise = (async () => { })().constructor;

    const PromiseExternal = ((resolve_, reject_) => {
        const h = (resolve, reject) => { resolve_ = resolve; reject_ = reject };
        return class PromiseExternal extends Promise {
            constructor(cb = h) {
                super(cb);
                if (cb === h) {
                    this.resolve = resolve_;
                    this.reject = reject_;
                }
            }
        };
    })();

    const insp = o => o ? (o.polymerController || o.inst || o || 0) : (o || 0);

    const getResValue = (m) => {
        return m.width < m.height ? m.width : m.height;
    };

    const observablePromise = (proc, timeoutPromise) => {
        let promise = null;
        return {
            obtain() {
                if (!promise) {
                    promise = new Promise(resolve => {
                        let mo = null;
                        const f = () => {
                            let t = proc();
                            if (t) {
                                mo.disconnect();
                                mo.takeRecords();
                                mo = null;
                                resolve(t);
                            }
                        }
                        mo = new MutationObserver(f);
                        mo.observe(document, { subtree: true, childList: true });
                        f();
                        timeoutPromise && timeoutPromise.then(() => {
                            resolve(null);
                        });
                    });
                }
                return promise;
            }
        };
    };

    const addProtoToArr = (parent, key, arr) => {
        let isChildProto = false;
        for (const sr of arr) {
            if (parent[key].prototype instanceof parent[sr]) {
                isChildProto = true;
                break;
            }
        }
        if (isChildProto) return;
        arr = arr.filter(sr => {
            if (parent[sr].prototype instanceof parent[key]) {
                return false;
            }
            return true;
        });
        arr.push(key);
        return arr;
    };

    const getuU = (_yt_player) => {
        let arr = [];
        let brr = new Map();

        for (const [k, v] of Object.entries(_yt_player)) {
            const p = typeof v === 'function' ? v.prototype : 0;
            if (p) {
                let q = 0;
                if (typeof p.setPlaybackQualityRange === 'function' && p.setPlaybackQualityRange.length === 3) q += 200;
                if (typeof p.updateVideoData === 'function' && p.updateVideoData.length === 2) q += 80;
                if (p.getVideoAspectRatio) q += 20;
                if (p.getStreamTimeOffset) q += 20;

                if (q < 200) continue;
                if (q > 0) arr = addProtoToArr(_yt_player, k, arr) || arr;
                if (q > 0) brr.set(k, q);
            }
        }

        if (arr.length > 0) {
            arr = arr.map(key => [key, (brr.get(key) || 0)]);
            if (arr.length > 1) arr.sort((a, b) => b[1] - a[1]);
            return arr[0][0];
        }
    };

    const getL0 = (_yt_player) => {
        let arr = [];

        for (const [k, v] of Object.entries(_yt_player)) {
            const p = typeof v === 'function' ? v.prototype : 0;
            if (p) {
                let q = 0;
                if (typeof p.getPreferredQuality === 'function' && p.getPreferredQuality.length === 0) q += 200;
                if (typeof p.getVideoData === 'function' && p.getVideoData.length === 0) q += 80;
                if (typeof p.isPlaying === 'function' && p.isPlaying.length === 0) q += 2;
                if (typeof p.getPlayerState === 'function' && p.getPlayerState.length === 0) q += 2;
                if (typeof p.getPlayerType === 'function' && p.getPlayerType.length === 0) q += 2;

                if (q < 280) continue;
                if (q > 0) arr.push([k, q]);
            }
        }

        if (arr.length > 0) {
            if (arr.length > 1) arr.sort((a, b) => b[1] - a[1]);
            return arr[0][0];
        }
    };

    const getZf = (vL0) => {
        let arr = [];

        for (const [k, v] of Object.entries(vL0)) {
            const p = v;
            if (p) {
                let q = 0;
                if (typeof p.videoData === 'object' && p.videoData) {
                    if (Object.keys(p).length === 2) q += 200;
                }
                if (q > 0) arr.push([k, q]);
            }
        }

        if (arr.length > 0) {
            if (arr.length > 1) arr.sort((a, b) => b[1] - a[1]);
            return arr[0][0];
        }
    };

    const cleanContext = async (win) => {
        const waitFn = requestAnimationFrame;
        try {
            let mx = 16;
            const frameId = 'vanillajs-iframe-v1';
            let frame = document.getElementById(frameId);
            let removeIframeFn = null;
            if (!frame) {
                frame = document.createElement('iframe');
                frame.id = frameId;
                const blobURL = typeof webkitCancelAnimationFrame === 'function' && typeof kagi === 'undefined' ? (frame.src = URL.createObjectURL(new Blob([], { type: 'text/html' }))) : null;
                frame.sandbox = 'allow-same-origin';
                let n = document.createElement('noscript');
                n.appendChild(frame);
                while (!document.documentElement && mx-- > 0) await new Promise(waitFn);
                const root = document.documentElement;
                root.appendChild(n);
                if (blobURL) Promise.resolve().then(() => URL.revokeObjectURL(blobURL));

                removeIframeFn = (setTimeout) => {
                    const removeIframeOnDocumentReady = (e) => {
                        e && win.removeEventListener("DOMContentLoaded", removeIframeOnDocumentReady, false);
                        win = null;
                        const m = n;
                        n = null;
                        setTimeout(() => m.remove(), 200);
                    }
                    if (document.readyState !== 'loading') {
                        removeIframeOnDocumentReady();
                    } else {
                        win.addEventListener("DOMContentLoaded", removeIframeOnDocumentReady, false);
                    }
                }
            }
            while (!frame.contentWindow && mx-- > 0) await new Promise(waitFn);
            const fc = frame.contentWindow;
            if (!fc) throw "window is not found.";
            const { requestAnimationFrame, setTimeout, cancelAnimationFrame, setInterval, clearInterval, requestIdleCallback, getComputedStyle } = fc;
            const res = { requestAnimationFrame, setTimeout, cancelAnimationFrame, setInterval, clearInterval, requestIdleCallback, getComputedStyle };
            for (let k in res) res[k] = res[k].bind(win);
            if (removeIframeFn) Promise.resolve(res.setTimeout).then(removeIframeFn);
            res.animate = fc.HTMLElement.prototype.animate;
            return res;
        } catch (e) {
            console.warn(e);
            return null;
        }
    };

    const isUrlInEmbed = location.href.includes('.youtube.com/embed/');
    const isAbortSignalSupported = typeof AbortSignal !== "undefined";

    cleanContext(window).then(__CONTEXT__ => {
        if (!__CONTEXT__) return null;

        const { setTimeout } = __CONTEXT__;

        const promiseForTamerTimeout = new Promise(resolve => {
            !isUrlInEmbed && isAbortSignalSupported && document.addEventListener('yt-action', function () {
                setTimeout(resolve, 480);
            }, { capture: true, passive: true, once: true });
            !isUrlInEmbed && isAbortSignalSupported && typeof customElements === "object" && customElements.whenDefined('ytd-app').then(() => {
                setTimeout(resolve, 1200);
            });
            setTimeout(resolve, 3000);
        });

        let resultantQualities = null;
        let byPass = false;
        let pm2 = new PromiseExternal();
        let lastURL = null;

        // --- CÁC BIẾN KIỂM SOÁT THỦ CÔNG THÊM VÀO ---
        let userOverridden = false;
        let currentVideoId = '';

        function getVideoId() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('v') || window.location.pathname;
        }

        // Lắng nghe khi bạn click chọn độ phân giải thủ công để tắt Auto ép chất lượng
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.ytp-menuitem');
            if (!menuItem) return;
            if (menuItem.getAttribute('aria-haspopup') === 'true') return; // Bỏ qua nếu chỉ là nút mở menu con

            const text = menuItem.textContent.toLowerCase().trim();
            const isRes = /(\d+p|\d+k)/i.test(text); // Kiểm tra xem có phải là 480p, 720p, 1080p, 4k...
            const isAuto = /^(auto|tự động)$/i.test(text); // Kiểm tra nút Auto (loại trừ nút Tự động phát/Autoplay)

            if (isRes || isAuto) {
                userOverridden = true;
            }
        }, true);
        // --------------------------------------------

        const fn = async (evt) => {
            try {
                const target = (evt || 0).target;
                if (!(target instanceof HTMLMediaElement)) return;

                // Đồng bộ hóa trạng thái theo ID Video thực tế thay vì dựa vào link phát raw
                const vId = getVideoId();
                if (vId !== currentVideoId) {
                    currentVideoId = vId;
                    userOverridden = false; // Reset lại tính năng Auto Max cho video mới
                }

                // Nếu người dùng đã tự chọn chất lượng thấp hơn, dừng ngay lệnh ép của Script
                if (userOverridden) return;

                pm2.resolve();
                const pm1 = pm2 = new PromiseExternal();
                const mainMedia = await observablePromise(() => {
                    return isUrlInEmbed ? document.querySelector('#movie_player .html5-main-video') : document.querySelector('ytd-player#ytd-player #movie_player .html5-main-video');
                }, pm2.then()).obtain();
                if (!mainMedia || pm1 !== pm2) return;
                const ytdPlayerElm = isUrlInEmbed ? mainMedia.closest('#movie_player') : mainMedia.closest('ytd-player#ytd-player');
                if (!ytdPlayerElm) return;

                let player_;
                for (let i = 10; --i;) {
                    player_ = isUrlInEmbed ? ytdPlayerElm : await ((insp(ytdPlayerElm) || 0).player_ || 0);
                    if (player_ || pm1 !== pm2) break;
                    await new Promise(r => setTimeout(r, 18));
                }

                if (!player_ || pm1 !== pm2) return;
                for (let i = 10; --i;) {
                    if (player_.setPlaybackQualityRange || pm1 !== pm2) break;
                    await new Promise(r => setTimeout(r, 18));
                }

                if (pm1 !== pm2 || typeof player_.setPlaybackQualityRange !== 'function') return;

                let url = mainMedia.src;
                if (url === lastURL) return;
                lastURL = url;

                if (resultantQualities) {
                    let resultantQuality;
                    let qualityThreshold = +localStorage.qualityThreshold || 0;
                    if (!(qualityThreshold > 60)) qualityThreshold = 0;
                    for (const entry of resultantQualities) {
                        const entryRes = getResValue(entry);
                        if (entryRes > 60 && entry.quality && typeof entry.quality === 'string') {
                            if (qualityThreshold === 0 || (qualityThreshold > 60 && entryRes <= qualityThreshold)) {
                                resultantQuality = entry.quality;
                                break;
                            }
                        }
                    }
                    if (resultantQuality) {
                        byPass = true;
                        const setItemN = function (a, b) {};
                        const pd = Object.getOwnPropertyDescriptor(localStorage.constructor.prototype, 'setItem');
                        if (pd && pd.configurable) {
                            delete localStorage.constructor.prototype.setItem;
                            Object.defineProperty(localStorage.constructor.prototype, 'setItem', {
                                get() { return setItemN },
                                set(nv) { return true; },
                                enumerable: false,
                                configurable: true,
                            });
                        }
                        player_.setPlaybackQualityRange(resultantQuality, resultantQuality);
                        if (pd && pd.configurable && setItemN === localStorage.setItem) {
                            delete localStorage.constructor.prototype.setItem;
                            Object.defineProperty(localStorage.constructor.prototype, 'setItem', pd);
                        }
                        byPass = false;
                    }
                }
            } catch (e) {
                console.warn(e);
            }
        };
        document.addEventListener('durationchange', fn, true);

        (async () => {
            try {
                const _yt_player = await observablePromise(() => {
                    return (((window || 0)._yt_player || 0) || 0);
                }, promiseForTamerTimeout).obtain();

                if (!_yt_player || typeof _yt_player !== 'object') return;

                const vmHash = new WeakSet();
                const g = _yt_player;
                const keyuU = getuU(_yt_player);
                const keyL0 = getL0(_yt_player);

                if (keyuU) {
                    let k = keyuU;
                    let gkp = g[k].prototype;

                    if (typeof gkp.setPlaybackQualityRange132 !== "function" && typeof gkp.setPlaybackQualityRange === "function") {
                        gkp.setPlaybackQualityRange132 = gkp.setPlaybackQualityRange;
                        gkp.setPlaybackQualityRange = function (...args) {
                            if (!byPass && resultantQualities && document.visibilityState === 'visible') {
                                if (args[0] === args[1] && typeof args[0] === 'string' && args[0]) {
                                    const selectionEntry = resultantQualities.filter(e => e.quality === args[0])[0] || 0;
                                    const selectionHeight = selectionEntry ? getResValue(selectionEntry) : 0;
                                    if (selectionHeight > 60) {
                                        localStorage.qualityThreshold = selectionHeight;
                                    }
                                } else if (!args[0] && !args[1]) {
                                    delete localStorage.qualityThreshold;
                                }
                            }
                            return this.setPlaybackQualityRange132(...args);
                        };
                    }
                }

                if (keyL0) {
                    let k = keyL0;
                    let gkp = g[k].prototype;
                    let keyZf = null;

                    if (typeof gkp.getVideoData31 !== "function" && typeof gkp.getVideoData === "function" && typeof gkp.setupOnNewVideoData61 !== "function") {
                        gkp.getVideoData31 = gkp.getVideoData;
                        gkp.setupOnNewVideoData61 = function () {
                            keyZf = getZf(this);
                            if (!keyZf) return;

                            const tZf = this[keyZf];
                            if (!tZf) return;

                            let keyJ = Object.keys(tZf).filter(e => e !== 'videoData')[0];
                            const tZfJ = tZf[keyJ];
                            const videoData = tZf.videoData;
                            if (!tZfJ || !videoData || !tZfJ.videoInfos) return;

                            let videoTypes = tZfJ.videoInfos.map(info => info.video);
                            if (!videoTypes[0] || !videoTypes[0].quality || !getResValue(videoTypes[0])) return;

                            let keyLists = new Set();
                            let keyLists2 = new Set();
                            const o = {
                                [keyZf]: {
                                    videoData: new Proxy(videoData, {
                                        get(obj, key) {
                                            keyLists.add(key);
                                            const v = obj[key];
                                            if (typeof v === 'object') return new Proxy(v, {
                                                get(obj, key) {
                                                    keyLists2.add(key);
                                                    return obj[key];
                                                }
                                            });
                                            return v;
                                        }
                                    })
                                }
                            };

                            this.getPreferredQuality.call(o);
                            if (keyLists.size !== 2 || keyLists2.size < 3) return;

                            resultantQualities = videoTypes;
                        };
                        gkp.getVideoData = function () {
                            const vd = this.getVideoData31();
                            if (!vd || typeof vd !== 'object') return vd;
                            if (!vmHash.has(vd)) {
                                vmHash.add(vd);
                                this.setupOnNewVideoData61();
                                if (!keyZf) vmHash.delete(vd);
                            }
                            return vd;
                        };
                    }
                }
            } catch (e) {
                console.warn(e);
            }
        })();
    });
})();
