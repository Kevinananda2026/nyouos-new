/**
 * NyouOS 26.6 - 完整右键菜单系统
 * 支持桌面、窗口、文件、任务栏等多场景右键菜单
 */

window.OSContextMenu = (function() {
    'use strict';

    var _menu = null;
    var _currentContext = null;
    var _isAnimating = false;
    var _hideTimer = null;
    var _activeSubmenu = null;
    var _submenuStack = [];
    var _keyboardIndex = -1;
    var _keyboardItems = [];

    function init() {
        _menu = document.createElement('div');
        _menu.className = 'os-context-menu';
        _menu.setAttribute('role', 'menu');
        _menu.style.display = 'none';
        _menu.style.position = 'fixed';
        document.body.appendChild(_menu);

        document.addEventListener('click', _onDocClick, true);
        document.addEventListener('contextmenu', _onDocContextMenu, true);
        document.addEventListener('keydown', _onKeyDown, true);
        window.addEventListener('blur', hide);
        window.addEventListener('resize', hide);
        document.addEventListener('scroll', hide, true);

        _bindDesktopMenu();
    }

    function _bindDesktopMenu() {
        var desktop = document.getElementById('desktop-screen');
        if (!desktop) return;

        desktop.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.os-window')) return;
            if (e.target.closest('#os-taskbar')) return;
            if (e.target.closest('.desktop-icon')) return;

            e.preventDefault();
            showMenu(e.clientX, e.clientY, _getDesktopMenu());
        });
    }

    function _getDesktopMenu() {
        return [
            {
                id: 'view', label: '查看', icon: 'eye', submenu: [
                    { id: 'view-large', label: '大图标', icon: 'square' },
                    { id: 'view-medium', label: '中等图标', icon: 'square' },
                    { id: 'view-small', label: '小图标', icon: 'square' }
                ]
            },
            {
                id: 'sort', label: '排序方式', icon: 'sort', submenu: [
                    { id: 'sort-name', label: '名称' },
                    { id: 'sort-size', label: '大小' },
                    { id: 'sort-type', label: '项目类型' },
                    { id: 'sort-date', label: '修改日期' }
                ]
            },
            { id: 'refresh', label: '刷新', icon: 'refresh', shortcut: 'F5', action: function() { location.reload(); } },
            { type: 'separator' },
            {
                id: 'new', label: '新建', icon: 'plus', submenu: [
                    { id: 'new-folder', label: '文件夹', icon: 'folder', action: function() { _alert('创建文件夹'); } },
                    { id: 'new-text', label: '文本文档', icon: 'doc', action: function() { _alert('创建文本文档'); } }
                ]
            },
            { type: 'separator' },
            { id: 'display', label: '显示设置', icon: 'monitor', action: function() { _openSettings(); } },
            { id: 'personalize', label: '个性化', icon: 'palette', action: function() { _openSettings('personalize'); } }
        ];
    }

    function _getWindowMenu(winId) {
        var w = null;
        if (typeof OSWindowSystem !== 'undefined') {
            w = OSWindowSystem._getWindow ? OSWindowSystem._getWindow(winId) : null;
        }

        var isMaximized = w && w.isMaximized;
        var isMinimized = w && w.isMinimized;

        var items = [
            { id: 'restore', label: '还原', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.restoreWindow(winId); }, enabled: isMinimized },
            { id: 'minimize', label: '最小化', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.minimizeWindow(winId); }, enabled: !isMinimized },
            { id: 'maximize', label: isMaximized ? '还原' : '最大化', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.toggleMaximize(winId); } },
            { type: 'separator' },
            { id: 'close', label: '关闭', shortcut: 'Alt+F4', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.closeWindow(winId); } }
        ];

        return items;
    }

    function _getTaskbarMenu() {
        return [
            { id: 'taskmanager', label: '任务管理器', icon: 'chart', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.openApp('process-manager'); } },
            { type: 'separator' },
            { id: 'settings', label: '设置', icon: 'settings', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.openApp('settings'); } },
            { id: 'controlpanel', label: '控制面板', icon: 'panel', action: function() { _alert('控制面板'); } },
            { type: 'separator' },
            { id: 'showdesktop', label: '显示桌面', shortcut: 'Win+D', action: function() { if (typeof OSWindowSystem !== 'undefined') OSWindowSystem.showDesktop(); } }
        ];
    }

    function showMenu(x, y, items, context) {
        if (!_menu) return;
        _hideTimer && clearTimeout(_hideTimer);
        hide(false);

        _currentContext = context || null;
        _renderMenu(items);

        _menu.style.display = 'block';
        _menu.style.visibility = 'hidden';

        requestAnimationFrame(function() {
            _positionMenu(x, y);
            _menu.style.visibility = 'visible';
            _menu.classList.add('os-context-visible');
        });
    }

    function _renderMenu(items) {
        _menu.innerHTML = '';
        _keyboardItems = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (item.type === 'separator') {
                var sep = document.createElement('div');
                sep.className = 'os-context-separator';
                _menu.appendChild(sep);
                continue;
            }

            var el = document.createElement('div');
            el.className = 'os-context-item';
            el.setAttribute('role', 'menuitem');

            if (item.enabled === false) {
                el.classList.add('os-context-disabled');
            }

            if (item.submenu) {
                el.classList.add('os-context-has-submenu');
            }

            var iconHTML = '';
            if (item.icon) {
                iconHTML = '<span class="os-context-icon" data-icon="' + item.icon + '">' +
                    '<svg viewBox="0 0 24 24" width="16" height="16">' +
                        _getIconPath(item.icon) +
                    '</svg>' +
                '</span>';
            } else {
                iconHTML = '<span class="os-context-icon"></span>';
            }

            var shortcutHTML = item.shortcut ? '<span class="os-context-shortcut">' + item.shortcut + '</span>' : '';
            var arrowHTML = item.submenu ? '<span class="os-context-arrow">›</span>' : '';

            el.innerHTML = iconHTML + '<span class="os-context-label">' + item.label + '</span>' + shortcutHTML + arrowHTML;

            if (item.submenu) {
                el.addEventListener('mouseenter', function(e) {
                    e.stopPropagation();
                    _expandSubmenu(item.submenu, el);
                });
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    _expandSubmenu(item.submenu, el);
                });
            } else if (item.action) {
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (item.enabled !== false) {
                        item.action();
                        hide();
                    }
                });
            }

            _menu.appendChild(el);
            _keyboardItems.push({ el: el, item: item });
        }
    }

    function _expandSubmenu(items, parentEl) {
        _closeSubmenus();

        var submenu = document.createElement('div');
        submenu.className = 'os-context-submenu';
        submenu.setAttribute('role', 'menu');

        var subX = parentEl.offsetLeft + parentEl.offsetWidth + 4;
        var subY = parentEl.offsetTop;

        var itemsHTML = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type === 'separator') {
                itemsHTML += '<div class="os-context-separator"></div>';
                continue;
            }
            var iconHTML = item.icon ? '<span class="os-context-icon"><svg viewBox="0 0 24 24" width="16" height="16">' + _getIconPath(item.icon) + '</svg></span>' : '<span class="os-context-icon"></span>';
            var shortcutHTML = item.shortcut ? '<span class="os-context-shortcut">' + item.shortcut + '</span>' : '';
            var arrowHTML = item.submenu ? '<span class="os-context-arrow">›</span>' : '';
            itemsHTML += '<div class="os-context-item' + (item.enabled === false ? ' os-context-disabled' : '') + '"' +
                (item.submenu ? ' os-context-has-submenu' : '') +
                '>' + iconHTML + '<span class="os-context-label">' + item.label + '</span>' + shortcutHTML + arrowHTML + '</div>';
        }
        submenu.innerHTML = itemsHTML;
        submenu.style.left = subX + 'px';
        submenu.style.top = subY + 'px';

        document.body.appendChild(submenu);
        _submenuStack.push(submenu);
        _activeSubmenu = submenu;

        var subItems = submenu.querySelectorAll('.os-context-item');
        for (var i = 0; i < subItems.length; i++) {
            (function(idx) {
                subItems[idx].addEventListener('click', function(e) {
                    e.stopPropagation();
                    var targetItem = items[idx];
                    if (targetItem && targetItem.action && targetItem.enabled !== false) {
                        targetItem.action();
                        hide();
                    }
                });
                subItems[idx].addEventListener('mouseenter', function(e) {
                    e.stopPropagation();
                    if (items[idx] && items[idx].submenu) {
                        _expandSubmenu(items[idx].submenu, subItems[idx]);
                    }
                });
            })(i);
        }
    }

    function _closeSubmenus() {
        for (var i = 0; i < _submenuStack.length; i++) {
            if (_submenuStack[i] && _submenuStack[i].parentNode) {
                _submenuStack[i].parentNode.removeChild(_submenuStack[i]);
            }
        }
        _submenuStack = [];
        _activeSubmenu = null;
    }

    function _positionMenu(x, y) {
        if (!_menu) return;

        var rect = _menu.getBoundingClientRect();
        var menuW = rect.width;
        var menuH = rect.height;

        if (x + menuW > window.innerWidth) {
            x = Math.max(0, x - menuW);
        }
        if (y + menuH > window.innerHeight) {
            y = Math.max(0, y - menuH);
        }

        _menu.style.left = x + 'px';
        _menu.style.top = y + 'px';
    }

    function hide(animate) {
        if (!_menu) return;

        _closeSubmenus();

        _menu.classList.remove('os-context-visible');
        _menu.classList.add('os-context-hiding');

        setTimeout(function() {
            if (_menu) {
                _menu.style.display = 'none';
                _menu.classList.remove('os-context-hiding');
            }
        }, animate !== false ? 120 : 0);

        _currentContext = null;
        _keyboardIndex = -1;
        _keyboardItems = [];
    }

    function _onDocClick(e) {
        if (!_menu || _menu.style.display === 'none') return;
        if (_menu.contains(e.target)) return;
        for (var i = 0; i < _submenuStack.length; i++) {
            if (_submenuStack[i].contains(e.target)) return;
        }
        hide();
    }

    function _onDocContextMenu(e) {
        if (!_menu || _menu.style.display === 'none') return;
        if (_menu.contains(e.target)) return;
        hide();
    }

    function _onKeyDown(e) {
        if (!_menu || _menu.style.display === 'none') return;

        if (e.key === 'Escape') {
            e.preventDefault();
            if (_submenuStack.length > 0) {
                var last = _submenuStack.pop();
                if (last && last.parentNode) last.parentNode.removeChild(last);
                _activeSubmenu = _submenuStack.length > 0 ? _submenuStack[_submenuStack.length - 1] : null;
            } else {
                e.preventDefault();
                hide();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            _moveKeyboardSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            _moveKeyboardSelection(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            _activateKeyboardItem();
        }
    }

    function _moveKeyboardSelection(direction) {
        if (_keyboardItems.length === 0) return;

        var newIndex = _keyboardIndex + direction;
        if (newIndex < 0) newIndex = _keyboardItems.length - 1;
        if (newIndex >= _keyboardItems.length) newIndex = 0;

        _keyboardIndex = newIndex;

        for (var i = 0; i < _keyboardItems.length; i++) {
            _keyboardItems[i].el.classList.toggle('os-context-keyboard-focus', i === _keyboardIndex);
        }
    }

    function _activateKeyboardItem() {
        if (_keyboardIndex < 0 || _keyboardIndex >= _keyboardItems.length) return;
        var item = _keyboardItems[_keyboardIndex].item;
        if (item.action && item.enabled !== false) {
            item.action();
            hide();
        } else if (item.submenu) {
            _expandSubmenu(item.submenu, _keyboardItems[_keyboardIndex].el);
        }
    }

    function _getIconPath(icon) {
        var icons = {
            eye: '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>',
            sort: '<path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="currentColor"/>',
            refresh: '<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>',
            plus: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>',
            folder: '<path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="currentColor"/>',
            doc: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" fill="currentColor"/>',
            settings: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>',
            square: '<path d="M4 4h16v16H4z" fill="currentColor"/>',
            monitor: '<path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" fill="currentColor"/>',
            palette: '<path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm5.5 12c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-4c-.83 0-1.5-.67-1.5-1.5S13.67 7 14.5 7s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-4 0c-.83 0-1.5-.67-1.5-1.5S9.67 7 10.5 7s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3 4c-.83 0-1.5-.67-1.5-1.5S6.67 10 7.5 10s1.5.67 1.5 1.5S8.33 14 7.5 14z" fill="currentColor"/>',
            chart: '<path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" fill="currentColor"/>',
            panel: '<path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" fill="currentColor"/>',
            close: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>'
        };

        return icons[icon] || icons.square;
    }

    function _alert(msg) {
        if (typeof OSNotification !== 'undefined') {
            OSNotification.show('提示', msg);
        } else {
            alert(msg);
        }
    }

    function _openSettings() {
        if (typeof OSWindowSystem !== 'undefined') {
            OSWindowSystem.openApp('settings');
        }
    }

    function showDesktopMenu(x, y) {
        showMenu(x, y, _getDesktopMenu(), 'desktop');
    }

    function showTaskbarMenu(x, y) {
        showMenu(x, y, _getTaskbarMenu(), 'taskbar');
    }

    function showWindowMenu(x, y, winId) {
        showMenu(x, y, _getWindowMenu(winId), winId);
    }

    return {
        init: init,
        showMenu: showMenu,
        showDesktopMenu: showDesktopMenu,
        showTaskbarMenu: showTaskbarMenu,
        showWindowMenu: showWindowMenu,
        hide: hide
    };
})();
