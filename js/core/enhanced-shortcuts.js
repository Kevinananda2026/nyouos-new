/**
 * NyouOS 26.6 - 增强快捷键系统
 * 完整的系统级全局快捷键支持
 * IIFE 模式，挂载到 window.EnhancedShortcuts
 */

window.EnhancedShortcuts = (function () {
    'use strict';

    var bindings = {};
    var isInitialized = false;
    var customShortcuts = {};
    var toastEnabled = true;

    var TEXT_EDITING_COMBOS = {
        'ctrl+c': true,
        'ctrl+v': true,
        'ctrl+x': true,
        'ctrl+a': true
    };

    var SYSTEM_SHORTCUT_LABELS = {
        'win+d': '显示桌面',
        'win+e': '打开文件管理器',
        'win+r': '运行对话框',
        'win+l': '锁屏',
        'win+i': '打开设置',
        'win+s': '保存',
        'win+w': '关闭窗口',
        'win+up': '最大化窗口',
        'win+down': '最小化窗口',
        'win+left': '左半屏',
        'win+right': '右半屏',
        'ctrl+shift+esc': '任务管理器',
        'alt+f4': '关闭窗口',
        'f1': '帮助',
        'f5': '刷新',
        'delete': '删除',
        'ctrl+a': '全选',
        'ctrl+c': '复制',
        'ctrl+v': '粘贴',
        'ctrl+x': '剪切'
    };

    function normalizeCombo(e) {
        var parts = [];

        if (e.ctrlKey) parts.push('ctrl');
        if (e.metaKey) parts.push('win');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');

        var key = e.key;

        if (key === 'Control' || key === 'Meta' || key === 'Alt' || key === 'Shift') {
            return null;
        }

        var specialKeys = {
            'Escape': 'esc',
            ' ': 'space',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'Enter': 'enter',
            'Delete': 'delete',
            'Backspace': 'backspace',
            'Tab': 'tab',
            'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4',
            'F5': 'f5', 'F6': 'f6', 'F7': 'f7', 'F8': 'f8',
            'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12'
        };

        if (specialKeys[key]) {
            parts.push(specialKeys[key]);
        } else if (key.length === 1) {
            parts.push(key.toLowerCase());
        } else {
            parts.push(key.toLowerCase());
        }

        return parts.join('+');
    }

    function normalizeComboString(combo) {
        return combo.toLowerCase().replace(/\bmeta\b/g, 'win').trim();
    }

    function isInInput(target) {
        if (!target) return false;
        var tag = (target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (target.isContentEditable) return true;
        if (target.closest && target.closest('[contenteditable="true"]')) return true;
        return false;
    }

    function showToast(message) {
        if (!toastEnabled) return;
        try {
            if (typeof FluentUI !== 'undefined' && FluentUI.Toast) {
                FluentUI.Toast({
                    title: '快捷键',
                    message: message,
                    type: 'info',
                    duration: 2500
                });
            } else {
                console.log('[EnhancedShortcuts]', message);
            }
        } catch (e) {
            console.log('[EnhancedShortcuts]', message);
        }
    }

    function handleGlobalKeyDown(e) {
        if (e.repeat) return;

        var combo = normalizeCombo(e);
        if (!combo) return;

        var handler = bindings[combo];
        if (!handler) return;

        var inInput = isInInput(e.target);

        if (inInput && !TEXT_EDITING_COMBOS[combo]) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        var label = SYSTEM_SHORTCUT_LABELS[combo];
        if (label) {
            showToast(label);
        }

        try {
            handler(e);
        } catch (err) {
            console.error('[EnhancedShortcuts] Handler error:', err);
        }
    }

    function registerDefaults() {
        register('Win+D', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.minimizeAll) {
                WindowManager.minimizeAll();
            }
        });

        register('Win+E', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                WindowManager.openApp('files');
            }
        });

        register('Win+R', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                var appId = prompt('运行', '输入要打开的应用名称：');
                if (appId) {
                    WindowManager.openApp(appId.toLowerCase());
                }
            }
        });

        register('Win+L', function () {
            if (typeof State !== 'undefined' && typeof State.lock === 'function') {
                State.lock();
            }
        });

        register('Win+I', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                WindowManager.openApp('settings');
            }
        });

        register('Win+S', function () {
            var activeId = null;
            if (typeof WindowManager !== 'undefined') {
                activeId = WindowManager.activeWindowId;
            }
            if (activeId) {
                var win = null;
                if (typeof WindowManager !== 'undefined' && WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === activeId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.appId) {
                    var saveEvent = new CustomEvent('nyouos:save', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    window.dispatchEvent(saveEvent);
                }
            }
        });

        register('Win+W', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                if (WindowManager.closeWindow) {
                    WindowManager.closeWindow(WindowManager.activeWindowId);
                }
            }
        });

        register('Win+Up', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                var id = WindowManager.activeWindowId;
                var win = null;
                if (WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === id) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win) {
                    if (win.isMaximized) {
                        if (WindowManager.restoreWindow) WindowManager.restoreWindow(id);
                    } else {
                        if (WindowManager.maximizeWindow) WindowManager.maximizeWindow(id);
                    }
                }
            }
        });

        register('Win+Down', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                var id = WindowManager.activeWindowId;
                var win = null;
                if (WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === id) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win) {
                    if (win.isMaximized) {
                        if (WindowManager.restoreWindow) WindowManager.restoreWindow(id);
                    } else {
                        if (WindowManager.minimizeWindow) WindowManager.minimizeWindow(id);
                    }
                }
            }
        });

        register('Win+Left', function () {
            snapActiveWindow('left');
        });

        register('Win+Right', function () {
            snapActiveWindow('right');
        });

        register('Ctrl+Shift+Esc', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                WindowManager.openApp('task-manager');
            }
        });

        register('Alt+F4', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                if (WindowManager.closeWindow) {
                    WindowManager.closeWindow(WindowManager.activeWindowId);
                }
            }
        });

        register('F1', function () {
            if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                WindowManager.openApp('help');
            }
        });

        register('F5', function () {
            if (typeof Desktop !== 'undefined' && Desktop.renderIcons) {
                Desktop.renderIcons();
            }
            if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                var win = null;
                if (WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === WindowManager.activeWindowId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.element) {
                    var refreshEvent = new CustomEvent('nyouos:refresh', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    win.element.dispatchEvent(refreshEvent);
                }
            }
        });

        register('Delete', function () {
            var activeId = null;
            if (typeof WindowManager !== 'undefined') {
                activeId = WindowManager.activeWindowId;
            }
            if (activeId) {
                var win = null;
                if (typeof WindowManager !== 'undefined' && WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === activeId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.element) {
                    var deleteEvent = new CustomEvent('nyouos:delete', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    win.element.dispatchEvent(deleteEvent);
                }
            }
        });

        register('Ctrl+A', function () {
            var activeId = null;
            if (typeof WindowManager !== 'undefined') {
                activeId = WindowManager.activeWindowId;
            }
            if (activeId) {
                var win = null;
                if (typeof WindowManager !== 'undefined' && WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === activeId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.element) {
                    var selectAllEvent = new CustomEvent('nyouos:selectall', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    win.element.dispatchEvent(selectAllEvent);
                }
            }
        });

        register('Ctrl+C', function () {
            var activeId = null;
            if (typeof WindowManager !== 'undefined') {
                activeId = WindowManager.activeWindowId;
            }
            if (activeId) {
                var win = null;
                if (typeof WindowManager !== 'undefined' && WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === activeId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.element) {
                    var copyEvent = new CustomEvent('nyouos:copy', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    win.element.dispatchEvent(copyEvent);
                }
            }
        });

        register('Ctrl+V', function () {
            var activeId = null;
            if (typeof WindowManager !== 'undefined') {
                activeId = WindowManager.activeWindowId;
            }
            if (activeId) {
                var win = null;
                if (typeof WindowManager !== 'undefined' && WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === activeId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.element) {
                    var pasteEvent = new CustomEvent('nyouos:paste', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    win.element.dispatchEvent(pasteEvent);
                }
            }
        });

        register('Ctrl+X', function () {
            var activeId = null;
            if (typeof WindowManager !== 'undefined') {
                activeId = WindowManager.activeWindowId;
            }
            if (activeId) {
                var win = null;
                if (typeof WindowManager !== 'undefined' && WindowManager.windows) {
                    for (var i = 0; i < WindowManager.windows.length; i++) {
                        if (WindowManager.windows[i].id === activeId) {
                            win = WindowManager.windows[i];
                            break;
                        }
                    }
                }
                if (win && win.element) {
                    var cutEvent = new CustomEvent('nyouos:cut', {
                        detail: { appId: win.appId, windowId: win.id }
                    });
                    win.element.dispatchEvent(cutEvent);
                }
            }
        });
    }

    function snapActiveWindow(direction) {
        if (typeof WindowManager === 'undefined' || !WindowManager.activeWindowId) return;

        var id = WindowManager.activeWindowId;
        var win = null;
        if (WindowManager.windows) {
            for (var i = 0; i < WindowManager.windows.length; i++) {
                if (WindowManager.windows[i].id === id) {
                    win = WindowManager.windows[i];
                    break;
                }
            }
        }
        if (!win) return;

        var vw = window.innerWidth;
        var vh = window.innerHeight;

        if (WindowManager.restoreWindow) {
            WindowManager.restoreWindow(id);
        }

        setTimeout(function () {
            var el = win.element;
            if (!el) return;
            el.style.transition = 'all 0.3s ease';
            if (direction === 'left') {
                el.style.left = '0';
                el.style.top = '0';
                el.style.width = Math.floor(vw / 2) + 'px';
                el.style.height = vh + 'px';
            } else if (direction === 'right') {
                el.style.left = Math.floor(vw / 2) + 'px';
                el.style.top = '0';
                el.style.width = Math.floor(vw / 2) + 'px';
                el.style.height = vh + 'px';
            }
        }, 50);
    }

    function init() {
        if (isInitialized) return;
        isInitialized = true;

        registerDefaults();

        document.addEventListener('keydown', handleGlobalKeyDown, true);
    }

    function register(combo, handler) {
        var normalized = normalizeComboString(combo);
        bindings[normalized] = handler;
        customShortcuts[normalized] = combo;
    }

    function unregister(combo) {
        var normalized = normalizeComboString(combo);
        delete bindings[normalized];
        delete customShortcuts[normalized];
    }

    function getShortcuts() {
        var list = [];
        var keys = Object.keys(bindings);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            list.push({
                combo: customShortcuts[key] || key,
                normalized: key,
                label: SYSTEM_SHORTCUT_LABELS[key] || '',
                isCustom: !!customShortcuts[key]
            });
        }
        return list;
    }

    function setToastEnabled(enabled) {
        toastEnabled = !!enabled;
    }

    return {
        init: init,
        register: register,
        unregister: unregister,
        showToast: showToast,
        getShortcuts: getShortcuts,
        setToastEnabled: setToastEnabled
    };
})();