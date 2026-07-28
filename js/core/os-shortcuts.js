/**
 * NyouOS 26.6 - 完整系统快捷键
 * Win+D, Win+E, Win+I, Alt+Tab, Ctrl+Shift+Esc 等系统级快捷键
 */

window.OSShortcuts = (function() {
    'use strict';

    var _bindings = {};
    var _initialized = false;

    var _TEXT_INPUT_COMBOS = {
        'ctrl+c': true,
        'ctrl+v': true,
        'ctrl+x': true,
        'ctrl+a': true,
        'ctrl+z': true,
        'ctrl+y': true
    };

    var _SYSTEM_SHORTCUTS = {
        'win+d': { label: '显示桌面', description: '最小化所有窗口' },
        'win+e': { label: '打开文件管理器', description: '快速访问文件' },
        'win+i': { label: '打开设置', description: '系统设置' },
        'win+r': { label: '运行对话框', description: '执行命令' },
        'win+l': { label: '锁屏', description: '锁定屏幕' },
        'win+w': { label: '关闭窗口', description: '关闭当前窗口' },
        'alt+f4': { label: '关闭窗口/程序', description: '关闭当前应用' },
        'ctrl+shift+esc': { label: '任务管理器', description: '打开任务管理器' },
        'win+up': { label: '最大化窗口', description: '将窗口最大化' },
        'win+down': { label: '最小化窗口', description: '将窗口最小化' },
        'win+left': { label: '左半屏', description: '窗口吸附到左侧' },
        'win+right': { label: '右半屏', description: '窗口吸附到右侧' },
        'f1': { label: '帮助', description: '打开帮助文档' },
        'f5': { label: '刷新', description: '刷新当前页面' },
        'win+tab': { label: '任务视图', description: '显示所有窗口' }
    };

    function init() {
        if (_initialized) return;
        _initialized = true;

        registerDefaultShortcuts();

        document.addEventListener('keydown', _onKeyDown, true);
    }

    function registerDefaultShortcuts() {
        register('win+d', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                OSWindowSystem.showDesktop();
            }
        });

        register('win+e', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                OSWindowSystem.openApp('files');
            }
        });

        register('win+i', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                OSWindowSystem.openApp('settings');
            }
        });

        register('win+r', function() {
            _showRunDialog();
        });

        register('win+l', function() {
            if (typeof LockScreen !== 'undefined') {
                LockScreen.show();
            }
        });

        register('win+w', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                var active = OSWindowSystem.getActiveWindow();
                if (active) {
                    OSWindowSystem.closeWindow(active.id);
                }
            }
        });

        register('alt+f4', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                var active = OSWindowSystem.getActiveWindow();
                if (active) {
                    OSWindowSystem.closeWindow(active.id);
                }
            }
        });

        register('ctrl+shift+esc', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                OSWindowSystem.openApp('process-manager');
            }
        });

        register('win+up', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                var active = OSWindowSystem.getActiveWindow();
                if (active) {
                    OSWindowSystem.maximizeWindow(active.id);
                }
            }
        });

        register('win+down', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                var active = OSWindowSystem.getActiveWindow();
                if (active) {
                    if (active.isMaximized) {
                        OSWindowSystem.restoreFromMaximize(active.id);
                    } else {
                        OSWindowSystem.minimizeWindow(active.id);
                    }
                }
            }
        });

        register('win+left', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                var active = OSWindowSystem.getActiveWindow();
                if (active) {
                    OSWindowSystem._applySnap(active, 'left');
                }
            }
        });

        register('win+right', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                var active = OSWindowSystem.getActiveWindow();
                if (active) {
                    OSWindowSystem._applySnap(active, 'right');
                }
            }
        });

        register('f1', function() {
            if (typeof OSWindowSystem !== 'undefined') {
                OSWindowSystem.openApp('tips');
            }
        });

        register('f5', function() {
            location.reload();
        });

        register('win+tab', function() {
            if (typeof OSTaskbar !== 'undefined') {
                OSTaskbar._toggleTaskView();
            }
        });
    }

    function register(combo, callback) {
        var key = _normalizeCombo(combo);
        _bindings[key] = callback;
    }

    function unregister(combo) {
        var key = _normalizeCombo(combo);
        delete _bindings[key];
    }

    function _normalizeCombo(combo) {
        return combo.toLowerCase().trim();
    }

    function _comboFromEvent(e) {
        var parts = [];

        if (e.ctrlKey) parts.push('ctrl');
        if (e.metaKey || e.key === 'Meta') parts.push('win');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');

        var key = e.key;
        var specialKeys = {
            'Escape': 'esc',
            ' ': 'space',
            'ArrowUp': 'up', 'ArrowDown': 'down',
            'ArrowLeft': 'left', 'ArrowRight': 'right',
            'Enter': 'enter',
            'Delete': 'delete',
            'Backspace': 'backspace',
            'Tab': 'tab'
        };

        for (var i = 1; i <= 12; i++) {
            specialKeys['F' + i] = 'f' + i;
        }

        if (specialKeys[key]) {
            parts.push(specialKeys[key]);
        } else if (key.length === 1) {
            parts.push(key.toLowerCase());
        } else {
            parts.push(key.toLowerCase());
        }

        return parts.join('+');
    }

    function _isInInput(target) {
        if (!target) return false;
        var tag = (target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (target.isContentEditable) return true;
        if (target.closest && target.closest('[contenteditable="true"]')) return true;
        return false;
    }

    function _onKeyDown(e) {
        var combo = _comboFromEvent(e);

        if (!combo || combo === 'alt' || combo === 'control' || combo === 'meta' || combo === 'shift') {
            return;
        }

        var callback = _bindings[combo];
        if (!callback) return;

        var isTextEditing = _isInInput(e.target);
        var comboBase = combo.replace(/\+shift/g, '');
        var isTextCombo = _TEXT_INPUT_COMBOS[comboBase] || _TEXT_INPUT_COMBOS[combo];

        if (isTextEditing && isTextCombo) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        try {
            callback(e);
        } catch (err) {
            console.error('[OSShortcuts] Error executing ' + combo + ':', err);
        }
    }

    function _showRunDialog() {
        var existing = document.getElementById('os-run-dialog');
        if (existing) {
            existing.remove();
        }

        var dlg = document.createElement('div');
        dlg.id = 'os-run-dialog';
        dlg.className = 'os-run-dialog';
        dlg.innerHTML =
            '<div class="os-run-title">运行</div>' +
            '<div class="os-run-desc">输入程序、文件夹、文档或 Internet 资源的名称</div>' +
            '<div class="os-run-input-row">' +
                '<input type="text" class="os-run-input" placeholder="输入命令..." autofocus>' +
            '</div>' +
            '<div class="os-run-buttons">' +
                '<button class="os-run-cancel" type="button">取消</button>' +
                '<button class="os-run-ok" type="button">确定</button>' +
            '</div>';

        document.body.appendChild(dlg);

        var input = dlg.querySelector('.os-run-input');
        setTimeout(function() { input.focus(); }, 50);

        dlg.querySelector('.os-run-cancel').addEventListener('click', function() {
            dlg.remove();
        });

        dlg.querySelector('.os-run-ok').addEventListener('click', function() {
            var val = input.value.trim();
            if (val) {
                _executeCommand(val);
            }
            dlg.remove();
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                dlg.querySelector('.os-run-ok').click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                dlg.remove();
            }
        });

        setTimeout(function() {
            input.select();
        }, 100);
    }

    function _executeCommand(cmd) {
        var appMap = {
            'notepad': 'notes',
            'calc': 'calculator',
            'calc.exe': 'calculator',
            'explorer': 'files',
            'explorer.exe': 'files',
            'control': 'settings',
            'mspaint': 'photos',
            'cmd': 'terminal',
            'cmd.exe': 'terminal',
            'taskmgr': 'process-manager',
            'taskmgr.exe': 'process-manager'
        };

        var lower = cmd.toLowerCase();
        if (appMap[lower]) {
            if (typeof OSWindowSystem !== 'undefined') {
                OSWindowSystem.openApp(appMap[lower]);
            }
        } else if (lower.startsWith('http://') || lower.startsWith('https://')) {
            window.open(cmd, '_blank');
        } else if (lower.includes('.exe') || lower.includes('.com')) {
            if (typeof OSNotification !== 'undefined') {
                OSNotification.show('运行', '无法运行: ' + cmd + ' (未找到命令)');
            }
        }
    }

    function getList() {
        var result = [];
        for (var combo in _SYSTEM_SHORTCUTS) {
            var info = _SYSTEM_SHORTCUTS[combo];
            result.push({ combo: combo, label: info.label, description: info.description });
        }
        return result;
    }

    return {
        init: init,
        register: register,
        unregister: unregister,
        getList: getList
    };
})();
