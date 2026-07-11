// ==UserScript==
// @name         MyTV Quality Auto Max
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Tự động chọn chất lượng cao nhất cho MyTV (mytv.com.vn)
// @downloadURL  https://raw.githubusercontent.com/bibicadotnet/UserScript/main/mytv-quality-auto-max.js
// @updateURL    https://raw.githubusercontent.com/bibicadotnet/UserScript/main/mytv-quality-auto-max.js
// @match        *://mytv.com.vn/*
// @match        *://*.mytv.com.vn/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        TIMEOUT: 20000, // Thời gian tối đa tìm kiếm trình phát (ms)
        THROTTLE_MS: 300, // Giãn cách tối thiểu giữa các lần quét DOM (ms)
        // Thứ tự ưu tiên chất lượng từ cao xuống thấp
        PRIORITY: ['Full HD', '1080p', 'HD', '720p', 'SD', '480p', '360p']
    };

    let lastUrl = '';
    let isChecking = false;
    let observer = null;
    let timeoutId = null;
    let isQualitySet = false;
    let lastRunTime = 0;

    function log(...args) {
        console.log('[MyTV Auto Quality]', ...args);
    }

    // Giả lập chuỗi sự kiện click đầy đủ, dùng chung cho cả nút mở menu và item trong menu
    function simulateClickEvents(el) {
        if (!el) return;
        const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        events.forEach(type => {
            el.dispatchEvent(new MouseEvent(type, {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        });
    }

    function trySetHighestQuality() {
        // Tránh chạy song song hoặc chạy lại khi đã set thành công
        if (isChecking || isQualitySet) return;

        // Chỉ kiểm tra các phần tử cơ bản trước
        const wrapper = document.getElementById('player-wrapper');
        const bar = document.getElementById('mytv-control-bar');

        if (!wrapper || !bar) return;

        // Throttle: Chỉ bắt đầu tính giãn cách khi các phần tử của trình phát ĐÃ xuất hiện trong DOM.
        // Điều này đảm bảo không bao giờ bỏ lỡ (miss) sự kiện khi trình phát vừa được tải.
        const now = Date.now();
        if (now - lastRunTime < CONFIG.THROTTLE_MS) return;
        lastRunTime = now;

        isChecking = true;

        try {
            // Kích hoạt hiển thị control bar bằng cách hover giả lập
            wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
            wrapper.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));

            // Tìm nút chất lượng: phần tử có aria-haspopup="menu" chứa thẻ svg
            const menuButtons = Array.from(bar.querySelectorAll('[aria-haspopup="menu"]'));
            const qualityButton = menuButtons.find(btn => btn.querySelector('svg'));

            if (!qualityButton) {
                isChecking = false;
                return;
            }

            // Click để mở menu chất lượng
            simulateClickEvents(qualityButton);

            // Chờ menu popup xuất hiện trong DOM
            let attempts = 0;
            const checkMenu = () => {
                try {
                    const menuItems = Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]'));

                    if (menuItems.length > 0) {
                        const texts = menuItems.map(i => i.innerText.trim());
                        log('Danh sách chất lượng khả dụng:', texts);

                        let targetText = null;
                        for (const q of CONFIG.PRIORITY) {
                            if (texts.includes(q)) {
                                targetText = q;
                                break;
                            }
                        }

                        if (targetText) {
                            const currentQuality = qualityButton.innerText.trim().toLowerCase();
                            const targetLower = targetText.toLowerCase();

                            if (currentQuality === targetLower) {
                                log('Đã ở sẵn chất lượng cao nhất:', targetText);
                                simulateClickEvents(qualityButton); // Đóng menu
                                stopObservingForCurrentPage();
                            } else {
                                const targetItem = menuItems.find(i => i.innerText.trim().toLowerCase() === targetLower);
                                if (targetItem) {
                                    log('Đang chọn chất lượng:', targetText);
                                    simulateClickEvents(targetItem);
                                    stopObservingForCurrentPage();
                                }
                            }
                        } else {
                            // Không tìm thấy tùy chọn phù hợp -> đóng menu, KHÔNG dừng observer
                            // (giữ nguyên như bản gốc: có thể menu chưa load đủ item, để MutationObserver thử lại sau)
                            simulateClickEvents(qualityButton);
                        }
                        isChecking = false;
                    } else {
                        attempts++;
                        if (attempts < 15) {
                            setTimeout(checkMenu, 100);
                        } else {
                            // QUAN TRỌNG: không gọi stopObservingForCurrentPage() ở đây.
                            // Nếu player tập mới chưa kịp render trong 1.5s, ta chỉ bỏ cuộc lần thử này;
                            // observer vẫn tiếp tục theo dõi và sẽ tự thử lại khi DOM thay đổi tiếp,
                            // cho tới khi thành công hoặc hết CONFIG.TIMEOUT tổng.
                            log('Hết thời gian chờ menu chất lượng hiển thị (sẽ thử lại nếu DOM còn thay đổi).');
                            isChecking = false;
                        }
                    }
                } catch (err) {
                    log('Lỗi khi quét menu chất lượng:', err);
                    isChecking = false;
                }
            };

            setTimeout(checkMenu, 100);

        } catch (err) {
            log('Lỗi xảy ra khi kích hoạt trình phát:', err);
            isChecking = false;
        }
    }

    function stopObservingForCurrentPage() {
        isQualitySet = true;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        log('Đã hoàn tất chọn chất lượng cho trang hiện tại. Tạm dừng quan sát DOM.');
    }

    function startObserving() {
        if (location.href === lastUrl && isQualitySet) return;
        lastUrl = location.href;

        // Reset trạng thái cho URL mới
        isChecking = false;
        isQualitySet = false;
        lastRunTime = 0;

        if (observer) {
            observer.disconnect();
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        log('Khởi chạy tìm kiếm trình phát cho trang mới:', lastUrl);
        trySetHighestQuality();

        observer = new MutationObserver(() => trySetHighestQuality());
        observer.observe(document.body, { childList: true, subtree: true });

        timeoutId = setTimeout(() => {
            if (observer) {
                observer.disconnect();
                observer = null;
                log('Hết thời gian tìm kiếm trình phát cho trang này.');
            }
        }, CONFIG.TIMEOUT);
    }

    // Ghi đè phương thức history để bắt sự kiện chuyển trang của Single Page App (Next.js)
    function initNavigationHooks() {
        const pushState = history.pushState;
        const replaceState = history.replaceState;

        history.pushState = function () {
            pushState.apply(this, arguments);
            startObserving();
        };

        history.replaceState = function () {
            replaceState.apply(this, arguments);
            startObserving();
        };

        window.addEventListener('popstate', startObserving);
    }

    log('Script tự động chọn chất lượng đã khởi động...');
    initNavigationHooks();
    startObserving();
})();
