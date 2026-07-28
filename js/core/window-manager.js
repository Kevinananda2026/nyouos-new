/**
 * NyouOS 26.6 - WindowManager
 * 窗口管理器：创建、拖动、缩放、层叠、聚焦、最大化/还原、最小化/还原、窗口吸附、状态持久化
 * IIFE 模式，兼容所有 NyouOS 26.6 模块
 */
window.WindowManager = (function () {
    'use strict';

    var SNAP_THRESHOLD = 24;
    var TITLEBAR_HEIGHT = 40;
    var MIN_WIDTH = 320;
    var MIN_HEIGHT = 200;
    var ANIMATION_DURATION = 220;
    var CLOSE_ANIMATION_DURATION = 160;

    var state = {
        windows: [],
        activeWindowId: null,
        zIndexCounter: 100,
        appConfigs: {},
        desktop: null,
        taskbarCallbacks: null,
        _resizeListenersBound: false
    };

    function WindowManager(desktopId) {
        if (desktopId) {
            state.desktop = document.getElementById(desktopId);
        }
        return WindowManager;
    }

    WindowManager.windows = state.windows;
    WindowManager.appConfigs = state.appConfigs;

    Object.defineProperty(WindowManager, 'activeWindowId', {
        get: function () { return state.activeWindowId; },
        set: function (v) { state.activeWindowId = v; },
        configurable: true
    });

    Object.defineProperty(WindowManager, 'zIndexCounter', {
        get: function () { return state.zIndexCounter; },
        set: function (v) { state.zIndexCounter = v; },
        configurable: true
    });

    Object.defineProperty(WindowManager, 'MINIMIZE_DOCK_SCALE', {
        get: function () { return 0.08; },
        configurable: true
    });

    function _clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function _generateId(prefix) {
        return (prefix || 'win') + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    }

    function _getDesktopBounds() {
        if (state.desktop) {
            var rect = state.desktop.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        }
        return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    }

    function _findWindowIndex(id) {
        for (var i = 0; i < state.windows.length; i++) {
            if (state.windows[i].id === id) return i;
        }
        return -1;
    }

    function _getWindow(id) {
        var idx = _findWindowIndex(id);
        return idx !== -1 ? state.windows[idx] : null;
    }

    function _removeWindowFromArray(id) {
        var idx = _findWindowIndex(id);
        if (idx !== -1) {
            state.windows.splice(idx, 1);
        }
    }

    function _bringToFront(id) {
        state.zIndexCounter++;
        var w = _getWindow(id);
        if (w && w.element) {
            w.element.style.zIndex = String(state.zIndexCounter);
        }
    }

    function _updateActiveWindowClass() {
        state.windows.forEach(function (w) {
            if (w.element) {
                w.element.classList.toggle('active', w.id === state.activeWindowId && !w.isMinimized);
                w.element.classList.toggle('window-inactive', w.id !== state.activeWindowId);
            }
        });
    }

    function _notifyWindowChange(eventName, payload) {
        if (typeof State !== 'undefined' && State.emit) {
            try { State.emit(eventName, payload); } catch (e) { /* noop */ }
        }
    }

    function _syncTaskbarAppState(appId) {
        if (typeof state.taskbarCallbacks === 'object' && typeof state.taskbarCallbacks.update === 'function') {
            try { state.taskbarCallbacks.update(appId); } catch (e) { /* noop */ }
        }
        _notifyWindowChange('taskbar:update', appId);
    }

    function _readWindowBounds(appId, config) {
        var bounds = null;
        try {
            var raw = localStorage.getItem('windowBoundsMemory');
            if (raw) {
                var map = JSON.parse(raw);
                if (map && map[appId]) bounds = map[appId];
            }
        } catch (e) { /* noop */ }

        var desktop = _getDesktopBounds();
        var w = (bounds && bounds.width) || config.width || 800;
        var h = (bounds && bounds.height) || config.height || 600;
        var l, t;

        if (bounds && bounds.left !== undefined) {
            l = bounds.left;
            t = bounds.top;
        } else {
            l = Math.round(desktop.left + Math.max(40, (desktop.width - w) / 2 + (Math.random() * 80 - 40)));
            t = Math.round(desktop.top + Math.max(30, (desktop.height - h) / 2 - 40 + (Math.random() * 60 - 30)));
        }

        l = _clamp(l, desktop.left + 10, desktop.left + desktop.width - w - 10);
        t = _clamp(t, desktop.top + 10, desktop.top + desktop.height - h - 10);

        return {
            left: l,
            top: t,
            width: w,
            height: h,
            snapLayout: (bounds && bounds.snapLayout) || null,
            lastNormalBounds: (bounds && bounds.lastNormalBounds) || null
        };
    }

    function _persistWindowBounds(win) {
        try {
            var raw = localStorage.getItem('windowBoundsMemory');
            var map = raw ? JSON.parse(raw) : {};
            var el = win.element;
            map[win.appId] = {
                left: el.offsetLeft,
                top: el.offsetTop,
                width: el.offsetWidth,
                height: el.offsetHeight,
                snapLayout: win.snapLayout || null,
                lastNormalBounds: win.lastNormalBounds || null
            };
            localStorage.setItem('windowBoundsMemory', JSON.stringify(map));
        } catch (e) { /* noop */ }
    }

    function _applyBoundsToWindow(el, bounds) {
        if (!el || !bounds) return;
        el.style.left = bounds.left + 'px';
        el.style.top = bounds.top + 'px';
        el.style.width = bounds.width + 'px';
        el.style.height = bounds.height + 'px';
    }

    function _clampWindowBounds(bounds) {
        var desktop = _getDesktopBounds();
        var w = _clamp(bounds.width, MIN_WIDTH, desktop.width);
        var h = _clamp(bounds.height, MIN_HEIGHT, desktop.height - TITLEBAR_HEIGHT);
        var l = _clamp(bounds.left, desktop.left, desktop.left + desktop.width - w);
        var t = _clamp(bounds.top, desktop.top, desktop.top + desktop.height - h);
        return { left: l, top: t, width: w, height: h };
    }

    function _saveCurrentBounds(win) {
        if (!win.element) return;
        if (!win.lastNormalBounds && !win.isMaximized && !win.snapLayout) {
            win.lastNormalBounds = {
                left: win.element.offsetLeft,
                top: win.element.offsetTop,
                width: win.element.offsetWidth,
                height: win.element.offsetHeight
            };
        }
    }

    function _bindWindowEvents(win) {
        var el = win.element;
        var titlebar = el.querySelector('.nyouos-window-titlebar');
        var resizeHandle = el.querySelector('.nyouos-window-resize-handle');
        var minimizeBtn = el.querySelector('.nyouos-window-minimize');
        var maximizeBtn = el.querySelector('.nyouos-window-maximize');
        var closeBtn = el.querySelector('.nyouos-window-close');

        var drag = {
            active: false,
            startX: 0, startY: 0,
            startLeft: 0, startTop: 0,
            moved: false,
            unsnapped: false
        };

        var resize = {
            active: false,
            startX: 0, startY: 0,
            startWidth: 0, startHeight: 0
        };

        el.addEventListener('mousedown', function (e) {
            if (e.target.classList && e.target.classList.contains('nyouos-window-btn')) return;
            if (win.isMinimized) return;
            if (win.isMinimizing) return;
            WindowManager.activateWindow(win.id);
        });

        if (titlebar) {
            titlebar.addEventListener('mousedown', function (e) {
                if (e.target.classList && e.target.classList.contains('nyouos-window-btn')) return;
                if (win.isMaximized || win.isMinimized || win.isMinimizing) return;

                drag.active = true;
                drag.moved = false;
                drag.startX = e.clientX;
                drag.startY = e.clientY;
                drag.startLeft = el.offsetLeft;
                drag.startTop = el.offsetTop;
                drag.unsnapped = false;

                if (win.snapLayout) {
                    _unsnapWindow(win, drag.startX, drag.startY);
                    drag.unsnapped = true;
                }

                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'move';
            });

            titlebar.addEventListener('dblclick', function (e) {
                if (e.target.classList && e.target.classList.contains('nyouos-window-btn')) return;
                if (win.isMaximized) {
                    WindowManager.unmaximizeWindow(win.id);
                } else {
                    WindowManager.maximizeWindow(win.id);
                }
            });
        }

        document.addEventListener('mousemove', function (e) {
            if (drag.active) {
                var dx = e.clientX - drag.startX;
                var dy = e.clientY - drag.startY;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;

                var newLeft = drag.startLeft + dx;
                var newTop = drag.startTop + dy;

                if (drag.unsnapped) {
                    var desktop = _getDesktopBounds();
                    newTop = _clamp(newTop, desktop.top, desktop.top + desktop.height - TITLEBAR_HEIGHT - 20);
                    newLeft = _clamp(newLeft, desktop.left, desktop.left + desktop.width - 80);
                }

                el.style.left = newLeft + 'px';
                el.style.top = newTop + 'px';
            }

            if (resize.active) {
                var rdx = e.clientX - resize.startX;
                var rdy = e.clientY - resize.startY;
                var newW = _clamp(resize.startWidth + rdx, MIN_WIDTH, 5000);
                var newH = _clamp(resize.startHeight + rdy, MIN_HEIGHT, 5000);
                el.style.width = newW + 'px';
                el.style.height = newH + 'px';
            }
        });

        document.addEventListener('mouseup', function (e) {
            if (drag.active) {
                drag.active = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';

                if (drag.moved && !win.isMaximized) {
                    _checkSnap(win, e.clientX, e.clientY);
                    _persistWindowBounds(win);
                }
                drag.unsnapped = false;
            }

            if (resize.active) {
                resize.active = false;
                _persistWindowBounds(win);
                _notifyWindowChange('window:resize', { id: win.id });
            }
        });

        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', function (e) {
                if (win.isMaximized || win.isMinimized) return;
                e.stopPropagation();
                resize.active = true;
                resize.startX = e.clientX;
                resize.startY = e.clientY;
                resize.startWidth = el.offsetWidth;
                resize.startHeight = el.offsetHeight;
                document.body.style.userSelect = 'none';
            });
        }

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                WindowManager.minimizeWindow(win.id);
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (win.isMaximized) {
                    WindowManager.unmaximizeWindow(win.id);
                } else {
                    WindowManager.maximizeWindow(win.id);
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                WindowManager.closeWindow(win.id);
            });
        }
    }

    function _unsnapWindow(win, mouseX, mouseY) {
        var el = win.element;
        var desktop = _getDesktopBounds();

        if (win.snapLayout === 'left-half') {
            win.lastNormalBounds = win.lastNormalBounds || {
                left: desktop.left + Math.round(desktop.width * 0.25) - 40,
                top: desktop.top + Math.round(desktop.height * 0.25) - 30,
                width: 600,
                height: 400
            };
        } else if (win.snapLayout === 'right-half') {
            win.lastNormalBounds = win.lastNormalBounds || {
                left: desktop.left + Math.round(desktop.width * 0.75) - 40,
                top: desktop.top + Math.round(desktop.height * 0.25) - 30,
                width: 600,
                height: 400
            };
        }

        var bounds = win.lastNormalBounds || {
            left: mouseX - (el.offsetWidth / 2),
            top: mouseY - (TITLEBAR_HEIGHT / 2),
            width: el.offsetWidth,
            height: el.offsetHeight
        };

        el.style.transition = 'none';
        el.style.left = bounds.left + 'px';
        el.style.top = bounds.top + 'px';
        el.style.width = bounds.width + 'px';
        el.style.height = bounds.height + 'px';
        el.style.maxWidth = '';
        el.style.maxHeight = '';
        win.snapLayout = null;
        win.isMaximized = false;
    }

    function _checkSnap(win, mouseX, mouseY) {
        var desktop = _getDesktopBounds();
        var el = win.element;
        var snapMargin = SNAP_THRESHOLD;
        var rect = el.getBoundingClientRect();

        var nearLeft = (rect.left - desktop.left) <= snapMargin;
        var nearRight = (desktop.left + desktop.width - rect.right) <= snapMargin;
        var nearTop = (rect.top - desktop.top) <= snapMargin;

        if (nearLeft && !win.isMaximized) {
            _applySnapLayout(win, 'left-half');
        } else if (nearRight && !win.isMaximized) {
            _applySnapLayout(win, 'right-half');
        } else if (nearTop && !win.isMaximized && !win.snapLayout) {
            _applySnapLayout(win, 'maximize');
        }
    }

    function _applySnapLayout(win, layout) {
        var el = win.element;
        var desktop = _getDesktopBounds();

        if (layout === 'maximize') {
            if (!win.isMaximized) {
                win.lastNormalBounds = {
                    left: el.offsetLeft,
                    top: el.offsetTop,
                    width: el.offsetWidth,
                    height: el.offsetHeight
                };
            }
            el.style.transition = 'left 0.22s ease, top 0.22s ease, width 0.22s ease, height 0.22s ease';
            el.style.left = '0';
            el.style.top = '0';
            el.style.width = '100%';
            el.style.height = 'calc(100% - 60px)';
            win.isMaximized = true;
            win.snapLayout = null;
        } else if (layout === 'left-half' || layout === 'right-half') {
            if (win.isMaximized) {
                win.isMaximized = false;
            }
            if (!win.snapLayout && !win.lastNormalBounds) {
                win.lastNormalBounds = {
                    left: el.offsetLeft,
                    top: el.offsetTop,
                    width: el.offsetWidth,
                    height: el.offsetHeight
                };
            }
            var halfW = Math.round(desktop.width / 2);
            var halfH = Math.round(desktop.height - TITLEBAR_HEIGHT);
            el.style.transition = 'left 0.22s ease, top 0.22s ease, width 0.22s ease, height 0.22s ease';
            el.style.width = halfW + 'px';
            el.style.height = halfH + 'px';
            el.style.top = '0';
            if (layout === 'left-half') {
                el.style.left = '0';
            } else {
                el.style.left = halfW + 'px';
            }
            win.snapLayout = layout;
        }

        _persistWindowBounds(win);
        _updateActiveWindowClass();
        _notifyWindowChange('window:snap', { id: win.id, layout: layout });
    }

    WindowManager.createWindow = function (config) {
        var cfg = config || {};
        var id = cfg.id || _generateId('win');
        var appId = cfg.appId || id;
        var title = cfg.title || '';
        var titleKey = cfg.titleKey || '';
        var icon = cfg.icon || '';
        var content = cfg.content || '';
        var resizable = cfg.resizable !== false;
        var minimizable = cfg.minimizable !== false;
        var maximizable = cfg.maximizable !== false;
        var w = cfg.width || 800;
        var h = cfg.height || 600;
        var x, y;

        if (cfg.bounds) {
            x = cfg.bounds.left;
            y = cfg.bounds.top;
            w = cfg.bounds.width;
            h = cfg.bounds.height;
        } else {
            var desktop = _getDesktopBounds();
            x = cfg.x != null ? cfg.x : Math.round(desktop.left + Math.max(40, (desktop.width - w) / 2 + (Math.random() * 80 - 40)));
            y = cfg.y != null ? cfg.y : Math.round(desktop.top + Math.max(30, (desktop.height - h) / 2 - 40 + (Math.random() * 60 - 30)));
        }

        var el = document.createElement('div');
        el.className = 'nyouos-window';
        el.id = id;
        el.dataset.appId = appId;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = w + 'px';
        el.style.height = h + 'px';

        var titleText = titleKey && typeof t === 'function' ? t(titleKey) : (title || appId);

        el.innerHTML =
            '<div class="nyouos-window-titlebar">' +
                '<div class="nyouos-window-title">' +
                    (icon ? '<span class="nyouos-window-icon">' + icon + '</span>' : '') +
                    '<span class="nyouos-window-title-text">' + titleText + '</span>' +
                '</div>' +
                '<div class="nyouos-window-controls">' +
                    (minimizable ? '<button class="nyouos-window-btn nyouos-window-minimize" title="最小化"></button>' : '') +
                    (maximizable ? '<button class="nyouos-window-btn nyouos-window-maximize" title="最大化"></button>' : '') +
                    '<button class="nyouos-window-btn nyouos-window-close" title="关闭"></button>' +
                '</div>' +
            '</div>' +
            '<div class="nyouos-window-content">' + content + '</div>' +
            (resizable ? '<div class="nyouos-window-resize-handle"></div>' : '');

        if (state.desktop) {
            state.desktop.appendChild(el);
        } else {
            document.body.appendChild(el);
        }

        el.classList.add('opening');
        el.style.opacity = '0';
        el.style.transform = 'scale(0.96)';

        var winObj = {
            id: id,
            appId: appId,
            element: el,
            isMinimized: false,
            isMinimizing: false,
            isRestoring: false,
            isMaximized: false,
            isFrozen: false,
            minimizedAt: null,
            frozenAt: null,
            snapLayout: null,
            lastNormalBounds: null
        };

        state.windows.push(winObj);
        _bindWindowEvents(winObj);
        _bringToFront(id);
        state.activeWindowId = id;
        _updateActiveWindowClass();

        setTimeout(function () {
            el.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            el.style.opacity = '';
            el.style.transform = '';
            el.classList.remove('opening');
        }, 10);

        _notifyWindowChange('window:created', { id: id, appId: appId });

        return winObj;
    };

    WindowManager.openApp = function (appId, params) {
        params = params || null;

        var cfg = state.appConfigs[appId];
        if (!cfg) {
            console.warn('[WindowManager] App config not found:', appId);
            if (typeof State !== 'undefined' && State.addNotification) {
                try {
                    State.addNotification({
                        title: 'Error',
                        message: 'Cannot open app: ' + appId,
                        type: 'error'
                    });
                } catch (e) { /* noop */ }
            }
            return null;
        }

        if (typeof SettingsApp !== 'undefined' && SettingsApp.isAppRepairing && SettingsApp.isAppRepairing(appId)) {
            if (typeof FluentUI !== 'undefined' && FluentUI.Toast) {
                try {
                    FluentUI.Toast({ title: 'App is repairing', message: 'Please wait...', type: 'warning' });
                } catch (e) { /* noop */ }
            }
            return null;
        }

        if (typeof State !== 'undefined' && typeof State.recordAppUsage === 'function') {
            try { State.recordAppUsage(appId); } catch (e) { /* noop */ }
        }

        var existing = WindowManager.getAppWindow(appId);
        if (existing) {
            WindowManager.focusWindow(existing.id);
            _syncTaskbarAppState(appId);

            if (params && cfg.component && globalThis[cfg.component]) {
                var comp = globalThis[cfg.component];
                if (params.fileId && typeof comp.loadFile === 'function') {
                    try { comp.loadFile(params.fileId); } catch (e) { /* noop */ }
                } else if (typeof comp.openData === 'function') {
                    try { comp.openData(params); } catch (e) { /* noop */ }
                }
            }
            return existing;
        }

        var titleText = cfg.titleKey && typeof t === 'function' ? t(cfg.titleKey) : (cfg.title || appId);
        var config = {
            id: _generateId('win'),
            appId: appId,
            title: titleText,
            titleKey: cfg.titleKey,
            icon: cfg.icon || '',
            width: cfg.width || 800,
            height: cfg.height || 600,
            component: cfg.component,
            bounds: null
        };

        var bounds = _readWindowBounds(appId, cfg);
        config.bounds = bounds;

        var win = WindowManager.createWindow(config);

        if (typeof State !== 'undefined' && typeof State.addRunningApp === 'function') {
            try { State.addRunningApp(appId); } catch (e) { /* noop */ }
        }

        _syncTaskbarAppState(appId);

        WindowManager.focusWindow(win.id);

        if (cfg.component && globalThis[cfg.component]) {
            var component = globalThis[cfg.component];
            var initialData = component.handlesInitialOpenData === true ? params : undefined;
            var handled = false;
            try {
                handled = component.init(win.id, initialData) === true;
            } catch (err) {
                console.error('[WindowManager] Component init failed:', err);
            }

            if (!handled && params) {
                if (params.fileId && typeof component.loadFile === 'function') {
                    setTimeout(function () {
                        try { component.loadFile(params.fileId); } catch (e) { /* noop */ }
                    }, 0);
                } else if (typeof component.openData === 'function') {
                    setTimeout(function () {
                        try { component.openData(params); } catch (e) { /* noop */ }
                    }, 0);
                }
            }
        } else if (cfg.component) {
            console.error('[WindowManager] Component not found:', cfg.component);
        }

        return win;
    };

    WindowManager.getWindow = function (id) {
        return _getWindow(id);
    };

    WindowManager.hasWindow = function (id) {
        return _findWindowIndex(id) !== -1;
    };

    WindowManager.getAppWindow = function (appId) {
        for (var i = 0; i < state.windows.length; i++) {
            if (state.windows[i].appId === appId) return state.windows[i];
        }
        return null;
    };

    WindowManager.getAppConfig = function (appId) {
        var cfg = state.appConfigs[appId];
        if (!cfg) return null;
        var title = cfg.titleKey && typeof t === 'function' ? t(cfg.titleKey) : (cfg.title || appId);
        return Object.assign({}, cfg, { title: title });
    };

    WindowManager.focusWindow = function (id) {
        var win = _getWindow(id);
        if (!win) return;

        if (win.isMinimized) {
            win.isMinimized = false;
            win.isMinimizing = false;
            win.isRestoring = true;
            if (win.element) {
                win.element.style.display = 'flex';
                win.element.classList.remove('nyouos-window-minimizing');
            }
        }

        if (win.element) {
            win.element.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            win.element.style.opacity = '';
            win.element.style.transform = '';
            win.element.classList.remove('window-inactive');
        }

        _bringToFront(id);
        state.activeWindowId = id;
        _updateActiveWindowClass();
        _syncTaskbarAppState(win.appId);

        if (win.isRestoring) {
            setTimeout(function () {
                if (win) win.isRestoring = false;
            }, 180);
        }

        _notifyWindowChange('window:focus', { id: id, appId: win.appId });
    };

    WindowManager.activateWindow = function (id) {
        WindowManager.focusWindow(id);
    };

    WindowManager.closeWindow = function (id) {
        var win = _getWindow(id);
        if (!win) return;

        var el = win.element;
        if (!el) {
            _removeWindowFromArray(id);
            return;
        }

        if (typeof State !== 'undefined' && typeof State.removeRunningApp === 'function') {
            try { State.removeRunningApp(win.appId); } catch (e) { /* noop */ }
        }

        el.classList.add('closing');
        el.style.transition = 'opacity ' + CLOSE_ANIMATION_DURATION + 'ms ease, transform ' + CLOSE_ANIMATION_DURATION + 'ms ease';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.95)';

        var capturedId = id;
        var capturedAppId = win.appId;
        var capturedEl = el;

        setTimeout(function () {
            if (capturedEl.parentNode) {
                capturedEl.parentNode.removeChild(capturedEl);
            }
            _removeWindowFromArray(capturedId);

            if (state.activeWindowId === capturedId) {
                var remaining = state.windows.filter(function (w) { return !w.isMinimized; });
                if (remaining.length > 0) {
                    var top = remaining[remaining.length - 1];
                    state.activeWindowId = top.id;
                    _bringToFront(top.id);
                    _updateActiveWindowClass();
                } else {
                    state.activeWindowId = null;
                    _updateActiveWindowClass();
                }
            }

            _syncTaskbarAppState(capturedAppId);
            _notifyWindowChange('window:closed', { id: capturedId, appId: capturedAppId });
        }, CLOSE_ANIMATION_DURATION);
    };

    WindowManager.minimizeWindow = function (id) {
        var win = _getWindow(id);
        if (!win || win.isMinimized) return;

        win.isMinimizing = true;

        var el = win.element;
        if (el) {
            el.classList.add('nyouos-window-minimizing');
            el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.85) translateY(30px)';
        }

        var capturedId = id;
        var capturedAppId = win.appId;
        var capturedEl = el;

        setTimeout(function () {
            win.isMinimized = true;
            win.isMinimizing = false;
            if (capturedEl) {
                capturedEl.style.display = 'none';
                capturedEl.style.opacity = '';
                capturedEl.style.transform = '';
                capturedEl.classList.remove('nyouos-window-minimizing');
            }

            if (state.activeWindowId === capturedId) {
                state.activeWindowId = null;
                var remaining = state.windows.filter(function (w) { return !w.isMinimized; });
                if (remaining.length > 0) {
                    var top = remaining[remaining.length - 1];
                    state.activeWindowId = top.id;
                    _bringToFront(top.id);
                }
                _updateActiveWindowClass();
            }

            _syncTaskbarAppState(capturedAppId);
            _notifyWindowChange('window:minimized', { id: capturedId, appId: capturedAppId });
        }, 220);
    };

    WindowManager.maximizeWindow = function (id) {
        var win = _getWindow(id);
        if (!win || win.isMaximized) return;

        var el = win.element;
        if (!el) return;

        if (!win.isMaximized && !win.snapLayout) {
            win.lastNormalBounds = {
                left: el.offsetLeft,
                top: el.offsetTop,
                width: el.offsetWidth,
                height: el.offsetHeight
            };
        }

        el.style.transition = 'left 0.22s ease, top 0.22s ease, width 0.22s ease, height 0.22s ease';
        el.style.left = '0';
        el.style.top = '0';
        el.style.width = '100%';
        el.style.height = 'calc(100% - 60px)';
        win.isMaximized = true;
        win.snapLayout = null;

        WindowManager.focusWindow(id);
        _updateActiveWindowClass();
        _persistWindowBounds(win);

        WindowManager.updateMaximizedWallpaperEffect();
        _notifyWindowChange('window:maximized', { id: id, appId: win.appId });
    };

    WindowManager.unmaximizeWindow = function (id) {
        var win = _getWindow(id);
        if (!win || !win.isMaximized) return;

        var el = win.element;
        if (!el) return;

        var rect = win.lastNormalBounds || { left: 100, top: 50, width: 800, height: 600 };
        el.style.transition = 'left 0.22s ease, top 0.22s ease, width 0.22s ease, height 0.22s ease';
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        win.isMaximized = false;

        _updateActiveWindowClass();
        _persistWindowBounds(win);

        WindowManager.updateMaximizedWallpaperEffect();
        _notifyWindowChange('window:restored', { id: id, appId: win.appId });
    };

    WindowManager.restoreWindow = function (id) {
        var win = _getWindow(id);
        if (!win) return;

        if (win.isMaximized) {
            WindowManager.unmaximizeWindow(id);
            return;
        }

        if (win.snapLayout) {
            _unsnapWindow(win, 0, 0);
            _updateActiveWindowClass();
            _persistWindowBounds(win);
            return;
        }

        if (win.isMinimized) {
            WindowManager.focusWindow(id);
        }
    };

    WindowManager.minimizeAll = function () {
        var ids = state.windows
            .filter(function (w) { return !w.isMinimized && !w.isMinimizing; })
            .map(function (w) { return w.id; });

        ids.forEach(function (id) {
            WindowManager.minimizeWindow(id);
        });

        state.activeWindowId = null;
        _updateActiveWindowClass();
        _notifyWindowChange('window:minimizeAll', {});
    };

    WindowManager.toggleWindow = function (appId) {
        var win = WindowManager.getAppWindow(appId);
        if (!win) {
            WindowManager.openApp(appId);
            return;
        }

        if (win.isMinimized) {
            WindowManager.focusWindow(win.id);
        } else if (state.activeWindowId === win.id) {
            WindowManager.minimizeWindow(win.id);
        } else {
            WindowManager.focusWindow(win.id);
        }
    };

    WindowManager.updateMaximizedWallpaperEffect = function () {
        var hasMaximized = state.windows.some(function (w) { return w.isMaximized && !w.isMinimized; });
        var desktop = state.desktop || document.getElementById('desktop-screen');
        if (!desktop) return;

        if (hasMaximized) {
            desktop.classList.add('window-maximized');
        } else {
            desktop.classList.remove('window-maximized');
        }
    };

    WindowManager.getTaskbarButtonPosition = function (appId) {
        var taskbar = document.getElementById('taskbar');
        if (!taskbar) return null;

        var btn = taskbar.querySelector('[data-app-id="' + appId + '"]');
        if (!btn) return null;

        var rect = btn.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height
        };
    };

    WindowManager.setTaskbarCallbacks = function (cb) {
        state.taskbarCallbacks = cb || null;
    };

    WindowManager._syncTaskbarAppState = function (appId) {
        _syncTaskbarAppState(appId);
    };

    WindowManager._shouldDimFrozenWindows = function () {
        return false;
    };

    WindowManager._playTaskbarDockFeedback = function (appId) {
        var pos = WindowManager.getTaskbarButtonPosition(appId);
        if (!pos) return;
        try {
            if (navigator.vibrate) navigator.vibrate(15);
        } catch (e) { /* noop */ }
    };

    WindowManager._restoreWindowFromTombstone = function (windowData) {
        if (!windowData || !windowData.id) return;
        WindowManager.focusWindow(windowData.id);
    };

    WindowManager.init = function (desktopId) {
        if (desktopId) {
            state.desktop = document.getElementById(desktopId);
        }
    };

    return WindowManager;
})();