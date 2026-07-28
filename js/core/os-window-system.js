/**
 * NyouOS 26.6 - 完整窗口系统
 * 真正的 Windows/macOS 风格窗口管理
 * 支持拖拽、缩放、层叠、最大化/还原、最小化、关闭、窗口吸附、动画
 */

window.OSWindowSystem = (function() {
    'use strict';

    var WINDOW_GAP = 8;
    var MIN_WIDTH = 280;
    var MIN_HEIGHT = 180;
    var TITLEBAR_HEIGHT = 36;
    var ANIMATION_DURATION = 200;
    var SNAP_THRESHOLD = 12;

    var _state = {
        windows: [],
        activeWindowId: null,
        zIndexCounter: 100,
        desktopEl: null,
        taskbarEl: null,
        snapLayouts: {
            left: null,
            right: null,
            top: null,
            bottom: null,
            grid2x2: [],
            grid3x1: []
        },
        onWindowEvent: null
    };

    function _uid(prefix) {
        return (prefix || 'w') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    }

    function _clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function _getDesktopRect() {
        if (_state.desktopEl) {
            var rect = _state.desktopEl.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        }
        return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    }

    function _getWindow(id) {
        for (var i = 0; i < _state.windows.length; i++) {
            if (_state.windows[i].id === id) return _state.windows[i];
        }
        return null;
    }

    function _bringToFront(id) {
        _state.zIndexCounter++;
        var w = _getWindow(id);
        if (w && w.el) {
            w.el.style.zIndex = String(_state.zIndexCounter);
        }
    }

    function _setActiveWindow(id) {
        _state.activeWindowId = id;
        for (var i = 0; i < _state.windows.length; i++) {
            var w = _state.windows[i];
            if (w.el) {
                w.el.classList.toggle('active', w.id === id && !w.isMinimized);
                w.el.classList.toggle('inactive', w.id !== id);
            }
        }
        if (typeof _state.onWindowEvent === 'function') {
            _state.onWindowEvent('focus', id);
        }
    }

    function _notify(event, payload) {
        if (typeof _state.onWindowEvent === 'function') {
            try { _state.onWindowEvent(event, payload); } catch (e) {}
        }
        if (typeof State !== 'undefined' && State.emit) {
            try { State.emit('os:' + event, payload); } catch (e) {}
        }
    }

    function init(desktopId, taskbarId) {
        if (desktopId) {
            _state.desktopEl = document.getElementById(desktopId);
        }
        if (taskbarId) {
            _state.taskbarEl = document.getElementById(taskbarId);
        }
    }

    function setEventCallback(cb) {
        _state.onWindowEvent = cb;
    }

    function createWindow(config) {
        config = config || {};
        var appId = config.appId || config.id || 'app';
        var id = config.id || _uid(appId);
        var title = config.title || t(appId + '.title') || appId;
        var icon = config.icon || '';
        var width = config.width || 800;
        var height = config.height || 560;

        var desktop = _getDesktopRect();
        var left = config.left;
        var top = config.top;

        if (left === undefined) {
            left = Math.round(desktop.left + Math.max(20, (desktop.width - width) / 2 + (Math.random() * 80 - 40)));
        }
        if (top === undefined) {
            top = Math.round(desktop.top + Math.max(20, (desktop.height - height) / 2 - 30 + (Math.random() * 60 - 30)));
        }

        left = _clamp(left, desktop.left + 10, desktop.left + desktop.width - width - 10);
        top = _clamp(top, desktop.top + 10, desktop.top + desktop.height - height - 10);

        var el = document.createElement('div');
        el.className = 'os-window';
        el.id = id;
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.width = width + 'px';
        el.style.height = height + 'px';
        el.style.zIndex = '100';

        el.innerHTML =
            '<div class="os-window-titlebar">' +
                '<div class="os-window-titlebar-drag">' +
                    (icon ? '<img class="os-window-icon" src="' + icon + '" alt="">' : '') +
                    '<span class="os-window-title">' + title + '</span>' +
                '</div>' +
                '<div class="os-window-controls">' +
                    '<button class="os-win-btn os-win-minimize" title="最小化" aria-label="最小化">' +
                        '<svg viewBox="0 0 10 10" width="10" height="10"><rect x="1" y="5" width="8" height="1" fill="currentColor"/></svg>' +
                    '</button>' +
                    '<button class="os-win-btn os-win-maximize" title="最大化" aria-label="最大化">' +
                        '<svg viewBox="0 0 10 10" width="10" height="10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>' +
                    '</button>' +
                    '<button class="os-win-btn os-win-close" title="关闭" aria-label="关闭">' +
                        '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="os-window-content">' +
                '<div class="os-window-loader"><div class="os-spinner"></div></div>' +
            '</div>' +
            '<div class="os-window-resize-handle os-resize-n" data-dir="n"></div>' +
            '<div class="os-window-resize-handle os-resize-s" data-dir="s"></div>' +
            '<div class="os-window-resize-handle os-resize-e" data-dir="e"></div>' +
            '<div class="os-window-resize-handle os-resize-w" data-dir="w"></div>' +
            '<div class="os-window-resize-handle os-resize-ne" data-dir="ne"></div>' +
            '<div class="os-window-resize-handle os-resize-nw" data-dir="nw"></div>' +
            '<div class="os-window-resize-handle os-resize-se" data-dir="se"></div>' +
            '<div class="os-window-resize-handle os-resize-sw" data-dir="sw"></div>';

        var contentEl = el.querySelector('.os-window-content');

        if (config.content) {
            if (typeof config.content === 'string') {
                contentEl.innerHTML = config.content;
            } else if (config.content instanceof HTMLElement) {
                contentEl.appendChild(config.content);
            }
        }

        if (config.appUrl) {
            var iframe = document.createElement('iframe');
            iframe.src = config.appUrl;
            iframe.style.border = 'none';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.display = 'block';
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-modals');
            contentEl.innerHTML = '';
            contentEl.appendChild(iframe);
        }

        var winData = {
            id: id,
            appId: appId,
            title: title,
            icon: icon,
            el: el,
            contentEl: contentEl,
            iframe: config.appUrl ? iframe : null,
            isMinimized: false,
            isMaximized: false,
            isSnapped: false,
            snapPosition: null,
            prevBounds: null,
            bounds: { left: left, top: top, width: width, height: height },
            prevState: null
        };

        _bindWindowEvents(winData);

        if (_state.desktopEl) {
            _state.desktopEl.appendChild(el);
        } else {
            document.getElementById('desktop-screen') && document.getElementById('desktop-screen').appendChild(el);
            _state.desktopEl = document.getElementById('desktop-screen');
        }

        requestAnimationFrame(function() {
            el.classList.add('os-window-opened');
        });

        _state.windows.push(winData);
        _bringToFront(id);
        _setActiveWindow(id);

        if (config.onCreated) {
            try { config.onCreated(winData); } catch (e) {}
        }

        _notify('created', winData);
        _notify('taskbar:update', appId);

        return winData;
    }

    function _bindWindowEvents(winData) {
        var el = winData.el;
        var titlebar = el.querySelector('.os-window-titlebar');
        var dragArea = el.querySelector('.os-window-titlebar-drag');

        dragArea.addEventListener('mousedown', function(e) {
            if (winData.isMaximized || winData.isSnapped) return;
            if (e.target.closest('.os-window-controls')) return;
            e.preventDefault();
            _bringToFront(winData.id);
            _setActiveWindow(winData.id);
            _startDrag(winData, e);
        });

        dragArea.addEventListener('touchstart', function(e) {
            if (winData.isMaximized || winData.isSnapped) return;
            if (e.target.closest('.os-window-controls')) return;
            var touch = e.touches[0];
            _bringToFront(winData.id);
            _setActiveWindow(winData.id);
            _startDrag(winData, touch);
        }, { passive: true });

        titlebar.querySelector('.os-win-minimize').addEventListener('click', function(e) {
            e.stopPropagation();
            minimizeWindow(winData.id);
        });

        titlebar.querySelector('.os-win-maximize').addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMaximize(winData.id);
        });

        titlebar.querySelector('.os-win-close').addEventListener('click', function(e) {
            e.stopPropagation();
            closeWindow(winData.id);
        });

        el.addEventListener('mousedown', function(e) {
            if (winData.isMinimized) return;
            _bringToFront(winData.id);
            _setActiveWindow(winData.id);
        });

        var resizeHandles = el.querySelectorAll('.os-window-resize-handle');
        for (var i = 0; i < resizeHandles.length; i++) {
            var handle = resizeHandles[i];
            var dir = handle.dataset.dir;
            handle.addEventListener('mousedown', function(e) {
                if (winData.isMaximized || winData.isSnapped) return;
                e.preventDefault();
                e.stopPropagation();
                _startResize(winData, e, dir);
            });
        }

        titlebar.addEventListener('dblclick', function(e) {
            if (e.target.closest('.os-window-controls')) return;
            if (winData.isMaximized) {
                restoreFromMaximize(winData.id);
            } else {
                toggleMaximize(winData.id);
            }
        });
    }

    function _startDrag(winData, startEvent) {
        var el = winData.el;
        var startX = startEvent.clientX;
        var startY = startEvent.clientY;
        var startLeft = el.offsetLeft;
        var startTop = el.offsetTop;

        winData.isDragging = true;

        function onMove(ev) {
            var clientX = ev.clientX || (ev.touches && ev.touches[0].clientX);
            var clientY = ev.clientY || (ev.touches && ev.touches[0].clientY);
            if (clientX === undefined) return;

            var dx = clientX - startX;
            var dy = clientY - startY;

            var newLeft = startLeft + dx;
            var newTop = startTop + dy;

            var desktop = _getDesktopRect();
            newLeft = _clamp(newLeft, 0, desktop.width - 60);
            newTop = _clamp(newTop, 0, desktop.height - TITLEBAR_HEIGHT - 20);

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
            winData.bounds.left = newLeft;
            winData.bounds.top = newTop;

            if (!ev.touches) {
                _checkSnap(winData, newLeft, newTop, clientX, clientY);
            }
        }

        function onUp() {
            winData.isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);

            var snapTarget = document.getElementById('os-snap-indicator');
            if (snapTarget) snapTarget.remove();

            _saveBounds(winData);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('touchend', onUp);
    }

    function _startResize(winData, startEvent, direction) {
        var el = winData.el;
        var startX = startEvent.clientX;
        var startY = startEvent.clientY;
        var startBounds = {
            left: el.offsetLeft,
            top: el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight
        };

        function onMove(ev) {
            var clientX = ev.clientX || (ev.touches && ev.touches[0].clientX);
            var clientY = ev.clientY || (ev.touches && ev.touches[0].clientY);
            if (clientX === undefined) return;

            var dx = clientX - startX;
            var dy = clientY - startY;
            var newLeft = startBounds.left;
            var newTop = startBounds.top;
            var newWidth = startBounds.width;
            var newHeight = startBounds.height;

            if (direction.indexOf('e') !== -1) {
                newWidth = Math.max(MIN_WIDTH, startBounds.width + dx);
            }
            if (direction.indexOf('s') !== -1) {
                newHeight = Math.max(MIN_HEIGHT, startBounds.height + dy);
            }
            if (direction.indexOf('w') !== -1) {
                var newL = startBounds.left + dx;
                if (newWidth - dx >= MIN_WIDTH) {
                    newLeft = newL;
                    newWidth = startBounds.width - dx;
                }
            }
            if (direction.indexOf('n') !== -1) {
                var newT = startBounds.top + dy;
                if (newHeight - dy >= MIN_HEIGHT) {
                    newTop = newT;
                    newHeight = startBounds.height - dy;
                }
            }

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
            el.style.width = newWidth + 'px';
            el.style.height = newHeight + 'px';
            winData.bounds = { left: newLeft, top: newTop, width: newWidth, height: newHeight };
        }

        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            _saveBounds(winData);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('touchend', onUp);
    }

    function _checkSnap(winData, left, top, mouseX, mouseY) {
        var desktop = _getDesktopRect();
        var snapTarget = document.getElementById('os-snap-indicator');

        if (!snapTarget) {
            snapTarget = document.createElement('div');
            snapTarget.id = 'os-snap-indicator';
            snapTarget.className = 'os-snap-indicator';
            document.body.appendChild(snapTarget);
        }

        var snapRect = null;
        var snapPos = null;

        if (left <= SNAP_THRESHOLD + desktop.left) {
            snapPos = 'left';
            snapRect = {
                left: desktop.left,
                top: desktop.top,
                width: Math.floor(desktop.width / 2) - WINDOW_GAP / 2,
                height: desktop.height
            };
        } else if (left + winData.bounds.width >= desktop.left + desktop.width - SNAP_THRESHOLD) {
            snapPos = 'right';
            snapRect = {
                left: desktop.left + Math.ceil(desktop.width / 2) + WINDOW_GAP / 2,
                top: desktop.top,
                width: Math.floor(desktop.width / 2) - WINDOW_GAP / 2,
                height: desktop.height
            };
        } else if (top <= SNAP_THRESHOLD + desktop.top) {
            snapPos = 'top';
            snapRect = {
                left: desktop.left,
                top: desktop.top,
                width: desktop.width,
                height: Math.floor(desktop.height / 2) - WINDOW_GAP / 2
            };
        } else if (top + winData.bounds.height >= desktop.top + desktop.height - SNAP_THRESHOLD) {
            snapPos = 'bottom';
            snapRect = {
                left: desktop.left,
                top: desktop.top + Math.ceil(desktop.height / 2) + WINDOW_GAP / 2,
                width: desktop.width,
                height: Math.floor(desktop.height / 2) - WINDOW_GAP / 2
            };
        }

        if (snapRect) {
            snapTarget.style.display = 'block';
            snapTarget.style.left = snapRect.left + 'px';
            snapTarget.style.top = snapRect.top + 'px';
            snapTarget.style.width = snapRect.width + 'px';
            snapTarget.style.height = snapRect.height + 'px';
            snapTarget.dataset.snapPos = snapPos;
        } else {
            snapTarget.style.display = 'none';
        }

        return snapRect;
    }

    function _applySnap(winData, snapPos) {
        var desktop = _getDesktopRect();
        var snapRect;

        switch (snapPos) {
            case 'left':
                snapRect = {
                    left: desktop.left,
                    top: desktop.top,
                    width: Math.floor(desktop.width / 2) - WINDOW_GAP / 2,
                    height: desktop.height
                };
                break;
            case 'right':
                snapRect = {
                    left: desktop.left + Math.ceil(desktop.width / 2) + WINDOW_GAP / 2,
                    top: desktop.top,
                    width: Math.floor(desktop.width / 2) - WINDOW_GAP / 2,
                    height: desktop.height
                };
                break;
            case 'top':
                snapRect = {
                    left: desktop.left,
                    top: desktop.top,
                    width: desktop.width,
                    height: Math.floor(desktop.height / 2) - WINDOW_GAP / 2
                };
                break;
            case 'bottom':
                snapRect = {
                    left: desktop.left,
                    top: desktop.top + Math.ceil(desktop.height / 2) + WINDOW_GAP / 2,
                    width: desktop.width,
                    height: Math.floor(desktop.height / 2) - WINDOW_GAP / 2
                };
                break;
            default:
                return;
        }

        if (!winData.prevState) {
            winData.prevState = {
                bounds: { left: winData.bounds.left, top: winData.bounds.top, width: winData.bounds.width, height: winData.bounds.height },
                isMaximized: winData.isMaximized
            };
        }

        winData.el.style.transition = 'left ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), top ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), width ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), height ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1)';

        winData.el.style.left = snapRect.left + 'px';
        winData.el.style.top = snapRect.top + 'px';
        winData.el.style.width = snapRect.width + 'px';
        winData.el.style.height = snapRect.height + 'px';

        winData.bounds = snapRect;
        winData.isSnapped = true;
        winData.snapPosition = snapPos;
        winData.isMaximized = false;
        winData.el.classList.add('os-window-snapped');

        setTimeout(function() {
            if (winData.el) {
                winData.el.style.transition = '';
            }
        }, ANIMATION_DURATION);

        _notify('snap', winData);
    }

    function minimizeWindow(id) {
        var w = _getWindow(id);
        if (!w) return;
        if (w.isMinimized) return;

        w.el.classList.add('os-window-minimizing');
        setTimeout(function() {
            w.el.style.display = 'none';
            w.isMinimized = true;
            w.isMaximized = false;
            w.el.classList.remove('os-window-minimizing');
            _notify('minimize', w);

            if (_state.activeWindowId === id) {
                _state.activeWindowId = null;
                for (var i = 0; i < _state.windows.length; i++) {
                    if (!_state.windows[i].isMinimized) {
                        _setActiveWindow(_state.windows[i].id);
                        break;
                    }
                }
            }
        }, 180);
    }

    function restoreWindow(id) {
        var w = _getWindow(id);
        if (!w || !w.isMinimized) return;
        w.el.style.display = '';
        w.isMinimized = false;
        _bringToFront(id);
        _setActiveWindow(id);
        _notify('restore', w);
    }

    function toggleMaximize(id) {
        var w = _getWindow(id);
        if (!w) return;
        if (w.isMaximized) {
            restoreFromMaximize(id);
        } else {
            maximizeWindow(id);
        }
    }

    function maximizeWindow(id) {
        var w = _getWindow(id);
        if (!w || w.isMaximized) return;

        if (!w.prevState) {
            w.prevState = {
                bounds: { left: w.bounds.left, top: w.bounds.top, width: w.bounds.width, height: w.bounds.height },
                isMaximized: false,
                isSnapped: false,
                snapPosition: null
            };
        }

        w.el.style.transition = 'left ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), top ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), width ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), height ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1)';

        var desktop = _getDesktopRect();
        w.el.style.left = desktop.left + 'px';
        w.el.style.top = desktop.top + 'px';
        w.el.style.width = desktop.width + 'px';
        w.el.style.height = desktop.height + 'px';

        w.bounds = { left: desktop.left, top: desktop.top, width: desktop.width, height: desktop.height };
        w.isMaximized = true;
        w.isSnapped = false;
        w.snapPosition = null;
        w.el.classList.add('os-window-maximized');

        setTimeout(function() {
            if (w.el) w.el.style.transition = '';
        }, ANIMATION_DURATION);

        _notify('maximize', w);
    }

    function restoreFromMaximize(id) {
        var w = _getWindow(id);
        if (!w) return;

        if (!w.prevState) return;

        w.el.style.transition = 'left ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), top ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), width ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), height ' + ANIMATION_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1)';

        w.el.style.left = w.prevState.bounds.left + 'px';
        w.el.style.top = w.prevState.bounds.top + 'px';
        w.el.style.width = w.prevState.bounds.width + 'px';
        w.el.style.height = w.prevState.bounds.height + 'px';

        w.bounds = { ...w.prevState.bounds };
        w.isMaximized = w.prevState.isMaximized;
        w.isSnapped = w.prevState.isSnapped;
        w.snapPosition = w.prevState.snapPosition;
        w.el.classList.remove('os-window-maximized');
        w.el.classList.toggle('os-window-snapped', w.isSnapped);

        setTimeout(function() {
            if (w.el) w.el.style.transition = '';
        }, ANIMATION_DURATION);

        _notify('restore-max', w);
    }

    function closeWindow(id) {
        var idx = -1;
        for (var i = 0; i < _state.windows.length; i++) {
            if (_state.windows[i].id === id) {
                idx = i;
                break;
            }
        }

        if (idx === -1) return;

        var w = _state.windows[idx];
        var appId = w.appId;

        w.el.classList.add('os-window-closing');

        setTimeout(function() {
            if (w.el && w.el.parentNode) {
                w.el.parentNode.removeChild(w.el);
            }
            _state.windows.splice(idx, 1);

            if (_state.activeWindowId === id) {
                _state.activeWindowId = null;
                for (var i = 0; i < _state.windows.length; i++) {
                    if (!_state.windows[i].isMinimized) {
                        _setActiveWindow(_state.windows[i].id);
                        break;
                    }
                }
            }

            _notify('close', { id: id, appId: appId });
            _notify('taskbar:update', appId);
        }, 150);
    }

    function openApp(appId, params) {
        var configs = {
            files: { title: t('files.title'), icon: 'Theme/Icon/App_icon/files.png', url: 'apps/files.html' },
            settings: { title: t('settings.title'), icon: 'Theme/Icon/App_icon/settings.png', url: 'apps/settings.html' },
            browser: { title: t('browser.title'), icon: 'Theme/Icon/App_icon/browser.png', url: 'apps/browser.html' },
            terminal: { title: t('terminal.title'), icon: 'Theme/Icon/App_icon/terminal.png', url: 'apps/terminal.html' },
            'process-manager': { title: t('processManager.title'), icon: 'Theme/Icon/App_icon/Taskmgr.png', url: 'apps/process-manager.html' },
            calculator: { title: t('calculator.title'), icon: 'Theme/Icon/App_icon/calculator.png', url: 'apps/calculator.html', width: 320, height: 480 },
            notes: { title: t('notes.title'), icon: 'Theme/Icon/App_icon/notes.png', url: 'apps/notes.html' },
            clock: { title: t('clock.title'), icon: 'Theme/Icon/App_icon/clock.png', url: 'apps/clock.html', width: 360, height: 440 },
            weather: { title: t('weather.title'), icon: 'Theme/Icon/App_icon/weather.png', url: 'apps/weather.html', width: 400, height: 520 },
            appshop: { title: t('appshop.title'), icon: 'Theme/Icon/App_icon/app_gallery.png', url: 'apps/appshop.html' },
            camera: { title: t('camera.title'), icon: 'Theme/Icon/App_icon/camera.png', url: 'apps/camera.html', width: 720, height: 560 },
            photos: { title: t('photos.title'), icon: 'Theme/Icon/App_icon/photos.png', url: 'apps/photos.html' },
            media: { title: t('media.title'), icon: 'Theme/Icon/App_icon/media.png', url: 'apps/media.html' },
            tips: { title: t('tips.title'), icon: 'Theme/Icon/App_icon/tips.png', url: 'apps/tips.html' }
        };

        var cfg = configs[appId];
        if (!cfg) {
            cfg = { title: appId, icon: '', url: appId + '.html' };
        }

        var running = findWindowByApp(appId);
        if (running) {
            if (running.isMinimized) {
                restoreWindow(running.id);
            } else {
                _bringToFront(running.id);
                _setActiveWindow(running.id);
            }
            return running;
        }

        return createWindow({
            appId: appId,
            title: cfg.title,
            icon: cfg.icon,
            width: cfg.width,
            height: cfg.height,
            appUrl: cfg.url
        });
    }

    function findWindowByApp(appId) {
        for (var i = 0; i < _state.windows.length; i++) {
            if (_state.windows[i].appId === appId) return _state.windows[i];
        }
        return null;
    }

    function showDesktop() {
        for (var i = 0; i < _state.windows.length; i++) {
            if (!_state.windows[i].isMinimized) {
                minimizeWindow(_state.windows[i].id);
            }
        }
    }

    function restoreAllFromMinimize() {
        for (var i = 0; i < _state.windows.length; i++) {
            if (_state.windows[i].isMinimized) {
                restoreWindow(_state.windows[i].id);
            }
        }
    }

    function _saveBounds(winData) {
        try {
            var raw = localStorage.getItem('osWindowBounds');
            var map = raw ? JSON.parse(raw) : {};
            map[winData.appId] = {
                left: winData.bounds.left,
                top: winData.bounds.top,
                width: winData.bounds.width,
                height: winData.bounds.height
            };
            localStorage.setItem('osWindowBounds', JSON.stringify(map));
        } catch (e) {}
    }

    function getWindows() {
        return _state.windows.slice();
    }

    function getActiveWindow() {
        return _getWindow(_state.activeWindowId);
    }

    function getWindowCount() {
        return _state.windows.length;
    }

    function getMinimizedWindows() {
        return _state.windows.filter(function(w) { return w.isMinimized; });
    }

    function getOpenAppIds() {
        var ids = [];
        for (var i = 0; i < _state.windows.length; i++) {
            if (ids.indexOf(_state.windows[i].appId) === -1) {
                ids.push(_state.windows[i].appId);
            }
        }
        return ids;
    }

    return {
        init: init,
        setEventCallback: setEventCallback,
        createWindow: createWindow,
        openApp: openApp,
        closeWindow: closeWindow,
        minimizeWindow: minimizeWindow,
        restoreWindow: restoreWindow,
        toggleMaximize: toggleMaximize,
        maximizeWindow: maximizeWindow,
        restoreFromMaximize: restoreFromMaximize,
        showDesktop: showDesktop,
        restoreAllFromMinimize: restoreAllFromMinimize,
        getWindows: getWindows,
        getActiveWindow: getActiveWindow,
        getWindowCount: getWindowCount,
        getMinimizedWindows: getMinimizedWindows,
        getOpenAppIds: getOpenAppIds,
        findWindowByApp: findWindowByApp,
        _applySnap: _applySnap
    };
})();
