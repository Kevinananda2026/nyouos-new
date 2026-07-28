/**
 * NyouOS 26.6 - Alt+Tab 窗口切换器
 * 类 Windows/macOS 风格的窗口切换体验
 * IIFE 模式，兼容所有 NyouOS 26.6 模块
 */
window.AltTabSwitcher = (function () {
    'use strict';

    var overlay = null;
    var listEl = null;
    var titleEl = null;
    var footerEl = null;
    var items = [];
    var currentIndex = 0;
    var isActive = false;
    var isAltDown = false;
    var isTabDown = false;
    var tabPressedDuringAlt = false;
    var hideTimer = null;
    var thumbCache = {};
    var canvasSupported = false;

    function detectCanvasSupport() {
        try {
            var c = document.createElement('canvas');
            canvasSupported = !!(c.getContext && c.getContext('2d'));
        } catch (e) {
            canvasSupported = false;
        }
    }

    function sortByRecent(winArr) {
        if (typeof WindowManager === 'undefined') return winArr;
        var activeId = WindowManager.activeWindowId;
        if (!activeId) return winArr;
        var result = winArr.slice();
        result.sort(function (a, b) {
            if (a.id === activeId) return 1;
            if (b.id === activeId) return -1;
            return 0;
        });
        return result;
    }

    function getOpenWindows() {
        if (typeof WindowManager === 'undefined' || !Array.isArray(WindowManager.windows)) {
            return [];
        }
        var wins = WindowManager.windows.filter(function (w) {
            return w && w.element && !w.element.classList.contains('closing');
        });
        return sortByRecent(wins);
    }

    function getAppConfig(appId) {
        if (typeof WindowManager !== 'undefined' && WindowManager.appConfigs) {
            return WindowManager.appConfigs[appId] || null;
        }
        return null;
    }

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'nyouos-alttab-overlay';
        overlay.innerHTML =
            '<div class="nyouos-alttab-bg"></div>' +
            '<div class="nyouos-alttab-panel">' +
                '<div class="nyouos-alttab-title">' +
                    '<span class="nyouos-alttab-app-name">选择应用</span>' +
                    '<span class="nyouos-alttab-hint">按住 Alt+Tab 切换</span>' +
                '</div>' +
                '<div class="nyouos-alttab-list"></div>' +
                '<div class="nyouos-alttab-footer">按住 Alt+Tab 切换</div>' +
            '</div>';
        document.body.appendChild(overlay);
        listEl = overlay.querySelector('.nyouos-alttab-list');
        titleEl = overlay.querySelector('.nyouos-alttab-app-name');
        footerEl = overlay.querySelector('.nyouos-alttab-footer');
    }

    function renderThumbnailFallback(winData, thumbEl) {
        if (!winData.element) return;
        var rect = winData.element.getBoundingClientRect();
        var thumbW = 200;
        var thumbH = rect.width > 0 ? Math.round(thumbW * (rect.height / rect.width)) : 120;
        try {
            var clone = winData.element.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.width = thumbW + 'px';
            clone.style.height = thumbH + 'px';
            clone.style.transformOrigin = 'top left';
            clone.style.transform = 'scale(1)';
            clone.style.pointerEvents = 'none';
            clone.style.opacity = '0.85';
            thumbEl.innerHTML = '';
            thumbEl.appendChild(clone);
        } catch (e) {
            renderThumbnailIcon(winData, thumbEl);
        }
    }

    function renderThumbnailIcon(winData, thumbEl) {
        var cfg = getAppConfig(winData.appId);
        var title = (cfg && cfg.title) || winData.appId || '应用';
        var icon = (cfg && cfg.icon) || 'Theme/Icon/App_icon/app_error.png';
        thumbEl.innerHTML =
            '<div class="nyouos-alttab-thumb-content">' +
                '<img src="' + icon + '" alt="" class="nyouos-alttab-icon">' +
                '<div class="nyouos-alttab-title-text">' + title + '</div>' +
            '</div>';
    }

    function renderThumbnail(winData, thumbEl) {
        var id = winData.id;
        if (thumbCache[id]) {
            thumbEl.innerHTML = '';
            thumbEl.appendChild(thumbCache[id].cloneNode(true));
            return;
        }
        if (canvasSupported) {
            var rect = winData.element.getBoundingClientRect();
            var thumbW = 200;
            var thumbH = rect.width > 0 ? Math.round(thumbW * (rect.height / rect.width)) : 120;
            var canvas = document.createElement('canvas');
            canvas.width = thumbW;
            canvas.height = thumbH;
            var ctx = canvas.getContext('2d');
            try {
                var data = new XMLSerializer().serializeToString(winData.element);
                var img = new Image();
                img.onload = function () {
                    ctx.drawImage(img, 0, 0, thumbW, thumbH);
                    thumbEl.innerHTML = '';
                    thumbEl.appendChild(canvas);
                    thumbCache[id] = canvas;
                };
                img.onerror = function () {
                    renderThumbnailIcon(winData, thumbEl);
                };
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="' + thumbW + '" height="' + thumbH + '">' +
                    '<foreignObject width="100%" height="100%">' +
                    '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + thumbW + 'px;height:' + thumbH + 'px;overflow:hidden;">' +
                    data +
                    '</div>' +
                    '</foreignObject>' +
                    '</svg>'
                );
            } catch (e) {
                renderThumbnailFallback(winData, thumbEl);
            }
        } else {
            renderThumbnailFallback(winData, thumbEl);
        }
    }

    function buildList() {
        var windows = getOpenWindows();
        items = windows;

        if (windows.length === 0) {
            return false;
        }

        currentIndex = 0;
        listEl.innerHTML = '';

        windows.forEach(function (winData, i) {
            var item = document.createElement('div');
            item.className = 'nyouos-alttab-item';
            item.dataset.index = String(i);

            var cfg = getAppConfig(winData.appId);
            var title = (cfg && cfg.title) || winData.appId || '应用';
            var icon = (cfg && cfg.icon) || 'Theme/Icon/App_icon/app_error.png';

            var thumbWrap = document.createElement('div');
            thumbWrap.className = 'nyouos-alttab-thumb';
            thumbWrap.dataset.windowId = winData.id;

            var thumbInner = document.createElement('div');
            thumbInner.className = 'nyouos-alttab-thumb-inner';

            thumbWrap.appendChild(thumbInner);

            var label = document.createElement('div');
            label.className = 'nyouos-alttab-item-label';
            label.textContent = title;

            var iconImg = document.createElement('img');
            iconImg.className = 'nyouos-alttab-item-icon';
            iconImg.src = icon;
            iconImg.alt = '';
            iconImg.draggable = false;

            item.appendChild(iconImg);
            item.appendChild(thumbWrap);
            item.appendChild(label);

            item.addEventListener('mouseenter', function () {
                currentIndex = i;
                updateHighlight();
            });

            item.addEventListener('click', function () {
                currentIndex = i;
                selectCurrent();
            });

            listEl.appendChild(item);

            setTimeout(function () {
                renderThumbnail(winData, thumbInner);
            }, i * 30);
        });

        updateHighlight();
        return true;
    }

    function updateHighlight() {
        if (!listEl) return;
        var nodeList = listEl.querySelectorAll('.nyouos-alttab-item');
        for (var i = 0; i < nodeList.length; i++) {
            if (i === currentIndex) {
                nodeList[i].classList.add('selected');
                nodeList[i].classList.add('active');
            } else {
                nodeList[i].classList.remove('selected');
                nodeList[i].classList.remove('active');
            }
        }
        var activeItem = nodeList[currentIndex];
        if (activeItem) {
            var labelEl = activeItem.querySelector('.nyouos-alttab-item-label');
            if (titleEl && labelEl) {
                titleEl.textContent = labelEl.textContent;
            }
        }
    }

    function show() {
        if (!overlay) createOverlay();
        if (!buildList()) return;
        isActive = true;
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        overlay.classList.remove('nyouos-alttab-hide');
        overlay.style.display = 'flex';
        overlay.classList.add('nyouos-alttab-show');
        var hint = isAltDown && isTabDown ? '松开 Alt 切换到所选窗口' : '按住 Alt+Tab 切换';
        if (footerEl) footerEl.textContent = hint;
    }

    function hide() {
        if (!overlay) return;
        overlay.classList.remove('nyouos-alttab-show');
        overlay.classList.add('nyouos-alttab-hide');
        hideTimer = setTimeout(function () {
            overlay.style.display = 'none';
            overlay.classList.remove('nyouos-alttab-hide');
            isActive = false;
            items = [];
            thumbCache = {};
        }, 200);
    }

    function cancel() {
        hide();
        items = [];
        currentIndex = 0;
    }

    function selectCurrent() {
        var selected = items[currentIndex];
        if (selected && selected.id && typeof WindowManager !== 'undefined') {
            if (selected.isMinimized) {
                if (typeof WindowManager.restoreWindow === 'function') {
                    WindowManager.restoreWindow(selected.id);
                }
            } else {
                if (typeof WindowManager.activateWindow === 'function') {
                    WindowManager.activateWindow(selected.id);
                }
            }
            if (typeof WindowManager.focusWindow === 'function') {
                WindowManager.focusWindow(selected.id);
            }
        }
        hide();
        items = [];
        currentIndex = 0;
    }

    function nextItem() {
        if (items.length < 2) return;
        currentIndex = (currentIndex + 1) % items.length;
        updateHighlight();
    }

    function prevItem() {
        if (items.length < 2) return;
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateHighlight();
    }

    function onKeyDown(e) {
        if (e.altKey && !e.repeat) {
            isAltDown = true;
            if (!isActive) {
                e.preventDefault();
                e.stopPropagation();
                show();
                return;
            }
        }

        if (e.key === 'Tab' && isAltDown) {
            e.preventDefault();
            e.stopPropagation();
            isTabDown = true;
            tabPressedDuringAlt = true;

            if (!isActive) {
                show();
            }

            if (isActive) {
                if (e.shiftKey) {
                    prevItem();
                } else {
                    nextItem();
                }
            }
            return;
        }

        if (isActive) {
            if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextItem();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                prevItem();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectCurrent();
            }
        }
    }

    function onKeyUp(e) {
        if (e.key === 'Alt') {
            isAltDown = false;
            if (isActive) {
                e.preventDefault();
                if (tabPressedDuringAlt && items.length > 0) {
                    selectCurrent();
                } else {
                    cancel();
                }
            }
            tabPressedDuringAlt = false;
        } else if (e.key === 'Tab') {
            isTabDown = false;
        }
    }

    function onMouseDown(e) {
        if (isActive && overlay && overlay.contains(e.target)) {
            var item = e.target.closest('.nyouos-alttab-item');
            if (item) {
                var idx = parseInt(item.dataset.index, 10);
                if (!isNaN(idx)) {
                    currentIndex = idx;
                    updateHighlight();
                    selectCurrent();
                }
            } else if (e.target.classList.contains('nyouos-alttab-bg')) {
                cancel();
            }
        }
    }

    function onBlur() {
        if (isActive) {
            cancel();
        }
        isAltDown = false;
        isTabDown = false;
        tabPressedDuringAlt = false;
    }

    function init() {
        detectCanvasSupport();
        createOverlay();

        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('keyup', onKeyUp, true);
        document.addEventListener('mousedown', onMouseDown);
        window.addEventListener('blur', onBlur);

        return {
            init: init,
            show: show,
            hide: hide,
            isActive: function () { return isActive; }
        };
    }

    return {
        init: init,
        show: show,
        hide: hide,
        isActive: function () { return isActive; }
    };

})();