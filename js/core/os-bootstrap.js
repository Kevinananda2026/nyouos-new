/**
 * NyouOS 26.6 - OS Bootstrap
 * 以增强模式初始化新的 OS 模块
 * 不覆盖现有 WindowManager 和 Taskbar，仅添加新功能
 * @version 26.6.2
 */

(function() {
    'use strict';

    var _initialized = false;

    function init() {
        if (_initialized) return;
        _initialized = true;

        var modulesLoaded = [];

        // Alt+Tab 切换器 — 安全增强，不覆盖现有系统
        try {
            if (window.OSAltTab) {
                OSAltTab.init();
                modulesLoaded.push('OSAltTab');
            }
        } catch (e) {
            console.warn('[NyouOS] OSAltTab init failed:', e);
        }

        // 增强快捷键 — 添加 Win+D, Win+R 等
        try {
            if (window.OSShortcuts) {
                OSShortcuts.init();
                modulesLoaded.push('OSShortcuts');
            }
        } catch (e) {
            console.warn('[NyouOS] OSShortcuts init failed:', e);
        }

        // 操作中心 — 通知和快速设置
        try {
            if (window.OSActionCenter) {
                OSActionCenter.init();
                modulesLoaded.push('OSActionCenter');
            }
        } catch (e) {
            console.warn('[NyouOS] OSActionCenter init failed:', e);
        }

        // 右键菜单增强 — 仅在桌面空白处生效，不干扰现有菜单
        try {
            if (window.OSContextMenu) {
                OSContextMenu.init();
                modulesLoaded.push('OSContextMenu');
            }
        } catch (e) {
            console.warn('[NyouOS] OSContextMenu init failed:', e);
        }

        // 将 OSWindowSystem 挂载为 WindowManager 的增强层，不替换原有方法
        try {
            if (window.OSWindowSystem) {
                OSWindowSystem.init('desktop-screen', 'taskbar');
                modulesLoaded.push('OSWindowSystem');
            }
        } catch (e) {
            console.warn('[NyouOS] OSWindowSystem init failed:', e);
        }

        _wireEnhancements();

        console.log('[NyouOS] OS enhancements loaded:', modulesLoaded.join(', '));

        _showWelcomeNotification();
    }

    function _wireEnhancements() {
        // 监听现有系统的通知，转发到操作中心
        if (typeof State !== 'undefined' && window.OSActionCenter) {
            State.on('notificationAdd', function(notif) {
                if (notif && OSActionCenter) {
                    OSActionCenter.addNotification(
                        notif.title || '通知',
                        notif.message || '',
                        notif.icon || '📢'
                    );
                }
            });
        }

        // 桌面右键菜单增强 — 仅在桌面空白区域触发，不干扰现有右键菜单
        var desktop = document.getElementById('desktop-screen');
        if (desktop && window.OSContextMenu) {
            desktop.addEventListener('contextmenu', function(e) {
                // 如果点击的是窗口、图标、任务栏等，不拦截
                if (e.target.closest('.window') ||
                    e.target.closest('.os-window') ||
                    e.target.closest('.desktop-icon') ||
                    e.target.closest('#taskbar') ||
                    e.target.closest('.os-taskbar') ||
                    e.target.closest('.start-menu') ||
                    e.target.closest('.control-center') ||
                    e.target.closest('.notification-center') ||
                    e.target.closest('#Surf-panel') ||
                    e.target.closest('.widgets-layer')) {
                    return;
                }
                // 仅在桌面空白处显示增强右键菜单
                e.preventDefault();
                e.stopPropagation();
                OSContextMenu.showDesktopMenu(e.clientX, e.clientY);
            }, false);
        }

        // Win+D 显示桌面 — 调用现有 WindowManager 的方法
        if (window.OSShortcuts && typeof WindowManager !== 'undefined') {
            // 覆盖默认的 win+d 行为，优先使用现有系统方法
            OSShortcuts.register('win+d', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.minimizeAll) {
                    WindowManager.minimizeAll();
                } else if (window.OSWindowSystem) {
                    OSWindowSystem.showDesktop();
                }
            });

            // Win+E 打开文件管理器 — 使用现有 WindowManager
            OSShortcuts.register('win+e', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                    WindowManager.openApp('files');
                } else if (window.OSWindowSystem) {
                    OSWindowSystem.openApp('files');
                }
            });

            // Win+I 打开设置
            OSShortcuts.register('win+i', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                    WindowManager.openApp('settings');
                } else if (window.OSWindowSystem) {
                    OSWindowSystem.openApp('settings');
                }
            });

            // Ctrl+Shift+Esc 任务管理器
            OSShortcuts.register('ctrl+shift+esc', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.openApp) {
                    WindowManager.openApp('process-manager');
                } else if (window.OSWindowSystem) {
                    OSWindowSystem.openApp('process-manager');
                }
            });

            // Win+Up 最大化当前窗口
            OSShortcuts.register('win+up', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                    var w = WindowManager.getWindow(WindowManager.activeWindowId);
                    if (w) {
                        if (w.isMaximized) {
                            WindowManager.unmaximizeWindow(w.id);
                        } else {
                            WindowManager.maximizeWindow(w.id);
                        }
                    }
                }
            });

            // Win+Down 最小化当前窗口
            OSShortcuts.register('win+down', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                    WindowManager.minimizeWindow(WindowManager.activeWindowId);
                }
            });

            // Alt+F4 / Win+W 关闭当前窗口
            OSShortcuts.register('alt+f4', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                    WindowManager.closeWindow(WindowManager.activeWindowId);
                }
            });

            OSShortcuts.register('win+w', function() {
                if (typeof WindowManager !== 'undefined' && WindowManager.activeWindowId) {
                    WindowManager.closeWindow(WindowManager.activeWindowId);
                }
            });
        }
    }

    function _showWelcomeNotification() {
        if (window.OSActionCenter) {
            setTimeout(function() {
                OSActionCenter.show(
                    'NyouOS 26.6',
                    '系统已升级！试试 Alt+Tab 切换窗口，Win+D 显示桌面，右键桌面查看菜单。',
                    '🎉'
                );
            }, 3000);
        }
    }

    // 等待桌面就绪后初始化
    if (typeof State !== 'undefined') {
        State.on('oobeComplete', function() {
            setTimeout(init, 800);
        });
        State.on('desktopReady', function() {
            setTimeout(init, 500);
        });
    }

    // 兜底：如果事件没触发，延迟初始化
    setTimeout(function() {
        if (!_initialized) {
            var desktop = document.getElementById('desktop-screen');
            if (desktop && !desktop.classList.contains('hidden')) {
                init();
            }
        }
    }, 5000);

    // 最终兜底
    setTimeout(function() {
        if (!_initialized) {
            init();
        }
    }, 10000);

})();
