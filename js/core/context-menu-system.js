/**
 * NyouOS 26.6 - 全局右键菜单系统
 * 真正可用的右键菜单，支持多场景、多级子菜单、键盘导航
 */

window.ContextMenuSystem = (function () {
    'use strict';

    var menuEl = null;
    var currentContext = null;
    var activeSubmenu = null;
    var submenuStack = [];
    var isAnimating = false;
    var hideTimer = null;
    var keyboardItems = [];
    var keyboardIndex = -1;
    var boundElements = [];
    var initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;

        menuEl = document.createElement('div');
        menuEl.className = 'nyouos-context-menu';
        menuEl.setAttribute('role', 'menu');
        menuEl.style.display = 'none';
        menuEl.style.position = 'fixed';
        document.body.appendChild(menuEl);

        document.addEventListener('click', onDocClick, true);
        document.addEventListener('contextmenu', onDocContextMenu, true);
        document.addEventListener('keydown', onKeyDown, true);

        window.addEventListener('blur', hide);
        window.addEventListener('resize', hide);
        window.addEventListener('scroll', onScroll, true);

        bindDesktopMenu();
        bindWindowTitlebarMenu();
    }

    function onDocClick(e) {
        if (!menuEl || menuEl.style.display === 'none') return;
        if (menuEl.contains(e.target)) return;
        if (activeSubmenu && activeSubmenu.contains(e.target)) return;
        for (var i = 0; i < submenuStack.length; i++) {
            if (submenuStack[i].contains(e.target)) return;
        }
        hide();
    }

    function onDocContextMenu(e) {
        if (!menuEl || menuEl.style.display === 'none') return;
        if (menuEl.contains(e.target)) return;
        hide();
    }

    function onKeyDown(e) {
        if (!menuEl || menuEl.style.display === 'none') return;

        if (e.key === 'Escape') {
            if (submenuStack.length > 0) {
                e.preventDefault();
                closeTopSubmenu();
            } else {
                e.preventDefault();
                hide();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveKeyboardSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveKeyboardSelection(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            expandCurrentSubmenu();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (submenuStack.length > 0) {
                closeTopSubmenu();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            activateCurrentItem();
        }
    }

    function moveKeyboardSelection(direction) {
        var items = getKeyboardItems();
        if (items.length === 0) return;

        keyboardIndex += direction;
        if (keyboardIndex < 0) keyboardIndex = items.length - 1;
        if (keyboardIndex >= items.length) keyboardIndex = 0;

        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('active', 'keyboard-focus');
        }
        items[keyboardIndex].classList.add('active', 'keyboard-focus');

        var submenu = items[keyboardIndex]._submenu;
        if (submenu) {
            scheduleSubmenuOpen(items[keyboardIndex]);
        } else {
            hideActiveSubmenu();
        }
    }

    function getKeyboardItems() {
        var container = activeSubmenu || menuEl;
        if (!container) return [];
        var raw = container.querySelectorAll(':scope > .nyouos-cm-item:not(.disabled)');
        var items = [];
        for (var i = 0; i < raw.length; i++) {
            var item = raw[i];
            var idx = parseInt(item.getAttribute('data-index'), 10);
            var itemData = container._items && container._items[idx];
            item._submenu = itemData && itemData.submenu ? itemData.submenu : null;
            items.push(item);
        }
        return items;
    }

    function expandCurrentSubmenu() {
        var items = getKeyboardItems();
        if (items.length > 0 && keyboardIndex >= 0) {
            var item = items[keyboardIndex];
            if (item._submenu) {
                showSubmenu(item, item._submenu);
                keyboardIndex = 0;
                var subItems = getKeyboardItems();
                if (subItems.length > 0) {
                    subItems[0].classList.add('active', 'keyboard-focus');
                }
            }
        }
    }

    function activateCurrentItem() {
        var items = getKeyboardItems();
        if (items.length > 0 && keyboardIndex >= 0) {
            var item = items[keyboardIndex];
            if (item._submenu) {
                expandCurrentSubmenu();
                return;
            }
            var idx = parseInt(item.getAttribute('data-index'), 10);
            var container = activeSubmenu || menuEl;
            var itemData = container._items && container._items[idx];
            if (itemData && itemData.action) {
                itemData.action(currentContext);
                hide();
            }
        }
    }

    function scheduleSubmenuOpen(itemEl) {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        if (itemEl._submenu) {
            showSubmenu(itemEl, itemEl._submenu);
        } else {
            hideActiveSubmenu();
        }
    }

    function onScroll() {
        if (menuEl && menuEl.style.display !== 'none') {
            hide();
        }
    }

    function bindDesktopMenu() {
        var desktop = document.getElementById('desktop-screen');
        if (!desktop) return;

        desktop.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.window') ||
                e.target.closest('.taskbar') ||
                e.target.closest('.start-menu') ||
                e.target.closest('.control-center') ||
                e.target.closest('.notification-center') ||
                e.target.closest('#Surf-panel') ||
                e.target.closest('.widgets-layer') ||
                e.target.closest('.desktop-icon')) {
                return;
            }
            e.preventDefault();
            showDesktopMenu(e.clientX, e.clientY);
        });
    }

    function bindWindowTitlebarMenu() {
        document.addEventListener('contextmenu', function (e) {
            var titlebar = e.target.closest('.window-titlebar, .nyouos-window-titlebar');
            if (!titlebar) return;

            e.preventDefault();
            var winEl = titlebar.closest('.window, .nyouos-window');
            if (winEl) {
                showWindowMenu(e.clientX, e.clientY, winEl);
            }
        });
    }

    function show(x, y, items, context) {
        if (!initialized) init();

        currentContext = context || null;
        keyboardIndex = -1;
        hideActiveSubmenu();
        submenuStack = [];

        renderItems(menuEl, items);
        positionAt(menuEl, x, y);

        isAnimating = true;
        menuEl.style.display = 'block';

        setTimeout(function () {
            isAnimating = false;
        }, 160);
    }

    function hide() {
        if (!menuEl) return;
        menuEl.style.display = 'none';
        menuEl.innerHTML = '';
        menuEl._items = null;

        hideActiveSubmenu();
        submenuStack = [];
        currentContext = null;
        keyboardIndex = -1;
        keyboardItems = [];
    }

    function renderItems(container, items) {
        container._items = items || [];

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="nyouos-cm-empty">无可用选项</div>';
            return;
        }

        var html = '';
        var hasIcon = false;
        for (var i = 0; i < items.length; i++) {
            if (items[i].icon) { hasIcon = true; break; }
        }

        for (var index = 0; index < items.length; index++) {
            var item = items[index];

            if (item.separator) {
                html += '<div class="nyouos-cm-separator"></div>';
                continue;
            }

            var classes = ['nyouos-cm-item'];
            if (item.disabled) classes.push('disabled');
            if (item.submenu) classes.push('has-submenu');
            if (index === 0) classes.push('first');
            if (index === items.length - 1) classes.push('last');

            html += '<div class="' + classes.join(' ') + '" data-index="' + index + '">';

            if (hasIcon) {
                html += '<span class="nyouos-cm-icon">' + (item.icon || '') + '</span>';
            } else {
                html += '<span class="nyouos-cm-icon" style="visibility:hidden"></span>';
            }

            html += '<span class="nyouos-cm-label">' + item.label + '</span>';

            if (item.shortcut) {
                html += '<span class="nyouos-cm-shortcut">' + item.shortcut + '</span>';
            }
            if (item.submenu) {
                html += '<span class="nyouos-cm-arrow">›</span>';
            }

            html += '</div>';
        }

        container.innerHTML = html;

        var itemEls = container.querySelectorAll(':scope > .nyouos-cm-item');
        for (var i = 0; i < itemEls.length; i++) {
            (function (itemEl, idx) {
                var itemData = items[idx];

                itemEl.addEventListener('mouseenter', function () {
                    if (itemData.disabled) return;
                    setActiveItem(itemEl, container);

                    if (itemData.submenu) {
                        scheduleSubmenuOpen(itemEl);
                    } else {
                        hideActiveSubmenu();
                    }
                });

                itemEl.addEventListener('mouseleave', function () {
                    if (hideTimer) clearTimeout(hideTimer);
                    hideTimer = setTimeout(function () {
                        if (!itemEl.matches(':hover') && container !== menuEl && !isSubmenuHovered()) {
                            hideActiveSubmenu();
                        }
                    }, 200);
                });

                itemEl.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (itemData.disabled) return;

                    if (itemData.submenu) {
                        showSubmenu(itemEl, itemData.submenu);
                        return;
                    }

                    if (itemData.action) {
                        itemData.action(currentContext);
                    }
                    hide();
                });
            })(itemEls[i], i);
        }
    }

    function setActiveItem(itemEl, container) {
        var siblings = container.querySelectorAll(':scope > .nyouos-cm-item');
        for (var i = 0; i < siblings.length; i++) {
            siblings[i].classList.remove('active', 'keyboard-focus');
        }
        itemEl.classList.add('active');
    }

    function isSubmenuHovered() {
        if (activeSubmenu && activeSubmenu.matches(':hover')) return true;
        return false;
    }

    function showSubmenu(parentEl, items) {
        hideActiveSubmenu();

        activeSubmenu = document.createElement('div');
        activeSubmenu.className = 'nyouos-context-menu nyouos-cm-submenu';
        activeSubmenu.setAttribute('role', 'menu');
        activeSubmenu.style.position = 'fixed';
        activeSubmenu.style.display = 'none';

        renderItems(activeSubmenu, items);

        var parentRect = parentEl.getBoundingClientRect();
        var menuRect = menuEl.getBoundingClientRect();
        var margin = 8;

        document.body.appendChild(activeSubmenu);

        var menuW = activeSubmenu.offsetWidth || 180;
        var menuH = activeSubmenu.offsetHeight || 100;

        var left = menuRect.right - 4;
        var top = parentRect.top - 4;

        if (left + menuW > window.innerWidth - margin) {
            left = menuRect.left - menuW + 4;
        }
        if (top + menuH > window.innerHeight - margin) {
            top = window.innerHeight - menuH - margin;
        }
        if (top < margin) top = margin;

        activeSubmenu.style.left = left + 'px';
        activeSubmenu.style.top = top + 'px';
        activeSubmenu.style.display = 'block';

        submenuStack.push(activeSubmenu);
    }

    function hideActiveSubmenu() {
        if (activeSubmenu) {
            activeSubmenu.remove();
            activeSubmenu = null;
        }
        submenuStack = [];
    }

    function closeTopSubmenu() {
        if (submenuStack.length === 0) return;

        var top = submenuStack.pop();
        if (top) {
            top.remove();
        }

        activeSubmenu = submenuStack.length > 0 ? submenuStack[submenuStack.length - 1] : null;

        var targetContainer = activeSubmenu || menuEl;
        var items = targetContainer.querySelectorAll(':scope > .nyouos-cm-item');
        if (items.length > 0) {
            items[0].classList.add('active', 'keyboard-focus');
            keyboardIndex = 0;
        }
    }

    function positionAt(container, x, y) {
        var margin = 8;

        container.style.visibility = 'hidden';
        container.style.display = 'block';

        var menuW = container.offsetWidth || 220;
        var menuH = container.offsetHeight || 200;

        container.style.display = 'none';
        container.style.visibility = '';

        var left = x;
        var top = y;

        if (left + menuW > window.innerWidth - margin) {
            left = x - menuW;
        }
        if (top + menuH > window.innerHeight - margin) {
            top = y - menuH;
        }
        left = Math.max(margin, left);
        top = Math.max(margin, top);

        container.style.left = left + 'px';
        container.style.top = top + 'px';
    }

    function showDesktopMenu(x, y) {
        var totalIcons = 0;
        var allSelected = false;

        var items = [
            { icon: '🔄', label: '刷新', shortcut: 'F5', action: function () {
                if (typeof Desktop !== 'undefined' && Desktop.renderIcons) {
                    Desktop.renderIcons();
                }
                showToast('桌面已刷新');
            }},
            { separator: true },
            { icon: '📁', label: '新建', submenu: [
                { icon: '📂', label: '文件夹', action: function () { createNewFolder(); }},
                { icon: '📄', label: '文本文档', action: function () { createNewFile(); }}
            ]},
            { separator: true },
            { icon: '🔍', label: '查看方式', submenu: [
                { icon: '🔲', label: '大图标', action: function () { setViewSize('large'); }},
                { icon: '◻️', label: '中等图标', action: function () { setViewSize('medium'); }},
                { icon: '▫️', label: '小图标', action: function () { setViewSize('small'); }},
                { separator: true },
                { icon: '📋', label: '列表', action: function () { setViewSize('list'); }}
            ]},
            { icon: '↕️', label: '排序方式', submenu: [
                { icon: '🔤', label: '按名称', action: function () { setSortBy('name'); }},
                { icon: '📏', label: '按大小', action: function () { setSortBy('size'); }},
                { icon: '🏷️', label: '按类型', action: function () { setSortBy('type'); }},
                { icon: '📅', label: '按日期', action: function () { setSortBy('date'); }}
            ]},
            { separator: true },
            { icon: '🎨', label: '个性化', action: function () {
                if (typeof WindowManager !== 'undefined') {
                    WindowManager.openApp('settings');
                }
            }},
            { icon: '🖼️', label: '显示设置', action: function () {
                if (typeof WindowManager !== 'undefined') {
                    WindowManager.openApp('settings');
                }
            }},
            { separator: true },
            { icon: '👁️', label: '显示桌面图标', action: function () {
                toggleDesktopIcons();
            }},
            { separator: true },
            { icon: '🖥️', label: '显示桌面', shortcut: 'Win+D', action: function () {
                showDesktop();
            }}
        ];

        show(x, y, items, { type: 'desktop' });
    }

    function showFileMenu(x, y, fileInfo) {
        var items;

        if (Array.isArray(fileInfo)) {
            items = buildMultiFileMenu(fileInfo);
        } else {
            items = buildSingleFileMenu(fileInfo);
        }

        show(x, y, items, { type: 'file', target: fileInfo });
    }

    function buildSingleFileMenu(fileInfo) {
        var fileName = fileInfo && fileInfo.name ? fileInfo.name : '未知项目';
        var isFolder = fileInfo && fileInfo.type === 'folder';

        return [
            { icon: '📂', label: '打开', shortcut: 'Enter', action: function () { openFile(fileInfo); }},
            { icon: '📂', label: '打开方式', submenu: [
                { icon: '📝', label: '记事本', action: function () { openWith(fileInfo, 'notes'); }},
                { icon: '🌐', label: '浏览器', action: function () { openWith(fileInfo, 'browser'); }},
                { icon: '🖼️', label: '照片查看器', action: function () { openWith(fileInfo, 'photos'); }},
                { separator: true },
                { icon: '🔧', label: '选择其他应用...', action: function () { chooseApp(fileInfo); }}
            ]},
            { separator: true },
            { icon: '✂️', label: '剪切', shortcut: 'Ctrl+X', action: function () { cutFile(fileInfo); }},
            { icon: '📋', label: '复制', shortcut: 'Ctrl+C', action: function () { copyFile(fileInfo); }},
            { icon: '📌', label: '创建快捷方式', action: function () { createShortcut(fileInfo); }},
            { separator: true },
            { icon: '🔍', label: '搜索', action: function () { searchFile(fileInfo); }},
            { icon: '📤', label: '分享', action: function () { shareFile(fileInfo); }},
            { separator: true },
            { icon: '🗑️', label: '删除', shortcut: 'Delete', action: function () { deleteFile(fileInfo); }},
            { icon: '✏️', label: '重命名', shortcut: 'F2', action: function () { renameFile(fileInfo); }},
            { separator: true },
            { icon: 'ℹ️', label: '属性', shortcut: 'Alt+Enter', action: function () { showProperties(fileInfo); }}
        ];
    }

    function buildMultiFileMenu(fileInfos) {
        var count = fileInfos.length;
        return [
            { icon: '📂', label: '打开 ' + count + ' 个项目', action: function () {
                for (var i = 0; i < fileInfos.length; i++) {
                    openFile(fileInfos[i]);
                }
            }},
            { separator: true },
            { icon: '✂️', label: '剪切', shortcut: 'Ctrl+X', action: function () {
                for (var i = 0; i < fileInfos.length; i++) cutFile(fileInfos[i]);
            }},
            { icon: '📋', label: '复制', shortcut: 'Ctrl+C', action: function () {
                for (var i = 0; i < fileInfos.length; i++) copyFile(fileInfos[i]);
            }},
            { separator: true },
            { icon: '🗑️', label: '删除 ' + count + ' 个项目', shortcut: 'Delete', action: function () {
                for (var i = 0; i < fileInfos.length; i++) deleteFile(fileInfos[i]);
            }},
            { separator: true },
            { icon: 'ℹ️', label: '属性', shortcut: 'Alt+Enter', action: function () {
                showProperties(fileInfos[0]);
            }}
        ];
    }

    function showTaskbarMenu(x, y, appId) {
        if (!appId) return;

        var isRunning = false;
        var isPinned = false;

        if (typeof State !== 'undefined') {
            if (State.runningApps && State.runningApps.has) {
                isRunning = State.runningApps.has(appId);
            }
            if (State.settings && State.settings.pinnedApps) {
                isPinned = State.settings.pinnedApps.indexOf(appId) !== -1;
            }
        }

        var items = [];

        if (isRunning) {
            items.push({ icon: '🔄', label: '恢复', action: function () {
                if (typeof WindowManager !== 'undefined' && WindowManager.focusWindow) {
                    WindowManager.focusWindow(appId);
                }
            }});
            items.push({ icon: '🔽', label: '最小化', action: function () {
                if (typeof WindowManager !== 'undefined') {
                    var win = WindowManager.getAppWindow ? WindowManager.getAppWindow(appId) : null;
                    if (win) WindowManager.minimizeWindow(win.id);
                }
            }});
            items.push({ separator: true });
            items.push({ icon: '❌', label: '关闭窗口', action: function () {
                if (typeof WindowManager !== 'undefined') {
                    var win = WindowManager.getAppWindow ? WindowManager.getAppWindow(appId) : null;
                    if (win) WindowManager.closeWindow(win.id);
                }
            }});
        }

        items.push({ separator: true });

        if (isPinned) {
            items.push({ icon: '📌', label: '从任务栏取消固定', action: function () {
                if (typeof Taskbar !== 'undefined' && Taskbar.unpinApp) {
                    Taskbar.unpinApp(appId);
                }
            }});
        } else {
            items.push({ icon: '📌', label: '固定到任务栏', action: function () {
                if (typeof Taskbar !== 'undefined' && Taskbar.pinApp) {
                    Taskbar.pinApp(appId);
                }
            }});
        }

        items.push({ icon: '📂', label: '转到文件位置', action: function () {
                if (typeof WindowManager !== 'undefined') {
                    WindowManager.openApp('files');
                }
            }});

        show(x, y, items, { type: 'taskbar', appId: appId });
    }

    function showWindowMenu(x, y, windowEl) {
        if (!windowEl) return;

        var isMaximized = windowEl.classList.contains('maximized') || windowEl.classList.contains('maximized-window');
        var isMinimized = windowEl.classList.contains('minimized');
        var windowId = windowEl.id || windowEl.getAttribute('data-window-id');
        var appId = windowEl.getAttribute('data-app-id') || '';

        var items = [
            { icon: '📋', label: '还原', shortcut: 'Ctrl+Z', action: function () {
                if (typeof WindowManager !== 'undefined' && windowId) {
                    if (isMaximized) WindowManager.unmaximizeWindow(windowId);
                    if (isMinimized) WindowManager.restoreWindow(windowId);
                }
            }},
            { icon: '📌', label: '移动', action: function () {
                enableWindowMove(windowEl);
            }},
            { icon: '📐', label: '大小调整', action: function () {
                enableWindowResize(windowEl);
            }},
            { separator: true },
            { icon: isMaximized ? '🔼' : '🔽', label: isMaximized ? '最大化' : '最小化', shortcut: isMaximized ? 'Win+↑' : 'Win+↓', action: function () {
                if (typeof WindowManager !== 'undefined' && windowId) {
                    if (isMaximized) {
                        WindowManager.unmaximizeWindow(windowId);
                    } else {
                        if (isMinimized) {
                            WindowManager.restoreWindow(windowId);
                        } else {
                            WindowManager.minimizeWindow(windowId);
                        }
                    }
                }
            }},
            { icon: isMaximized ? '🔽' : '🔼', label: isMaximized ? '还原' : '最大化', shortcut: 'Win+↑', action: function () {
                if (typeof WindowManager !== 'undefined' && windowId) {
                    if (isMaximized) {
                        WindowManager.unmaximizeWindow(windowId);
                    } else {
                        WindowManager.maximizeWindow(windowId);
                    }
                }
            }},
            { separator: true },
            { icon: '📑', label: '层叠窗口', action: function () { cascadeWindows(); }},
            { icon: '📐', label: '并排显示', submenu: [
                { icon: '⬅️', label: '靠左对齐', action: function () { snapWindows('left'); }},
                { icon: '➡️', label: '靠右对齐', action: function () { snapWindows('right'); }},
                { icon: '🔳', label: '全屏', action: function () { maximizeWindows(); }}
            ]},
            { separator: true },
            { icon: '🔍', label: '搜索', action: function () {
                if (typeof WindowManager !== 'undefined') {
                    WindowManager.openApp('files');
                }
            }},
            { separator: true },
            { icon: '❌', label: '关闭窗口', shortcut: 'Alt+F4', action: function () {
                if (typeof WindowManager !== 'undefined' && windowId) {
                    WindowManager.closeWindow(windowId);
                }
            }}
        ];

        show(x, y, items, { type: 'window', element: windowEl, windowId: windowId, appId: appId });
    }

    function showFolderContentMenu(x, y, context) {
        var items = [
            { icon: '📁', label: '新建', submenu: [
                { icon: '📂', label: '文件夹', action: function () { createNewFolder(); }},
                { icon: '📄', label: '文本文档', action: function () { createNewFile(); }}
            ]},
            { icon: '📋', label: '粘贴', shortcut: 'Ctrl+V', action: function () {
                showToast('已粘贴');
            }},
            { separator: true },
            { icon: '🔲', label: '全选', shortcut: 'Ctrl+A', action: function () {
                showToast('已全选');
            }},
            { separator: true },
            { icon: '↕️', label: '排序方式', submenu: [
                { icon: '🔤', label: '按名称', action: function () { setSortBy('name'); }},
                { icon: '📏', label: '按大小', action: function () { setSortBy('size'); }},
                { icon: '🏷️', label: '按类型', action: function () { setSortBy('type'); }},
                { icon: '📅', label: '按日期', action: function () { setSortBy('date'); }}
            ]},
            { icon: '👁️', label: '查看方式', submenu: [
                { icon: '🔲', label: '大图标', action: function () { setViewSize('large'); }},
                { icon: '◻️', label: '中等图标', action: function () { setViewSize('medium'); }},
                { icon: '▫️', label: '小图标', action: function () { setViewSize('small'); }},
                { separator: true },
                { icon: '📋', label: '列表', action: function () { setViewSize('list'); }}
            ]},
            { separator: true },
            { icon: '🔄', label: '刷新', shortcut: 'F5', action: function () {
                showToast('已刷新');
            }}
        ];

        show(x, y, items, context || { type: 'folder' });
    }

    function createNewFolder() {
        var name = prompt('输入文件夹名称：', '新建文件夹');
        if (!name) return;
        if (typeof State !== 'undefined' && State.findNode) {
            var desktop = State.findNode('desktop');
            if (desktop && desktop.children) {
                var newFolder = {
                    id: 'folder-' + Date.now(),
                    name: name,
                    type: 'folder',
                    children: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                desktop.children.push(newFolder);
                if (State.updateFS) State.updateFS(State.fs);
                showToast('文件夹 "' + name + '" 已创建');
            }
        }
    }

    function createNewFile() {
        var name = prompt('输入文件名：', '新建文本文档.txt');
        if (!name) return;
        if (typeof State !== 'undefined' && State.findNode) {
            var desktop = State.findNode('desktop');
            if (desktop && desktop.children) {
                var newFile = {
                    id: 'file-' + Date.now(),
                    name: name,
                    type: 'file',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                desktop.children.push(newFile);
                if (State.updateFS) State.updateFS(State.fs);
                showToast('文件 "' + name + '" 已创建');
            }
        }
    }

    function setViewSize(size) {
        if (typeof State !== 'undefined' && State.updateSettings) {
            State.updateSettings({ desktopIconSize: size });
        }
        showToast('查看方式：' + size);
    }

    function setSortBy(by) {
        if (typeof State !== 'undefined' && State.updateSettings) {
            State.updateSettings({ desktopSortBy: by });
        }
        showToast('排序方式：' + by);
    }

    function openFile(fileInfo) {
        if (fileInfo && fileInfo.appId && typeof WindowManager !== 'undefined') {
            WindowManager.openApp(fileInfo.appId);
        } else if (fileInfo && typeof Desktop !== 'undefined' && Desktop.openFile) {
            Desktop.openFile(fileInfo);
        }
    }

    function cutFile(fileInfo) {
        showToast('已剪切');
    }

    function copyFile(fileInfo) {
        showToast('已复制');
    }

    function createShortcut(fileInfo) {
        showToast('已创建快捷方式');
    }

    function searchFile(fileInfo) {
        if (typeof WindowManager !== 'undefined') {
            WindowManager.openApp('files');
        }
    }

    function shareFile(fileInfo) {
        showToast('分享功能开发中...');
    }

    function deleteFile(fileInfo) {
        if (typeof Desktop !== 'undefined' && Desktop.moveDesktopNodeToRecycle && fileInfo) {
            Desktop.moveDesktopNodeToRecycle(fileInfo.nodeId || fileInfo.id);
        } else if (fileInfo) {
            showToast('已移动到回收站');
        }
    }

    function renameFile(fileInfo) {
        if (fileInfo && fileInfo.name) {
            var newName = prompt('重命名为：', fileInfo.name);
            if (newName && typeof State !== 'undefined' && State.findNode) {
                var node = State.findNode(fileInfo.nodeId || fileInfo.id);
                if (node) {
                    node.name = newName;
                    if (State.updateFS) State.updateFS(State.fs);
                    showToast('已重命名');
                }
            }
        }
    }

    function showProperties(fileInfo) {
        if (fileInfo) {
            var info = '';
            if (fileInfo.name) info += '名称: ' + fileInfo.name + '\n';
            if (fileInfo.type) info += '类型: ' + fileInfo.type + '\n';
            if (fileInfo.size) info += '大小: ' + fileInfo.size + ' bytes\n';
            if (fileInfo.created) info += '创建时间: ' + new Date(fileInfo.created).toLocaleString() + '\n';
            alert(info || '无可用信息');
        }
    }

    function openWith(fileInfo, appId) {
        if (typeof WindowManager !== 'undefined') {
            WindowManager.openApp(appId);
        }
    }

    function chooseApp(fileInfo) {
        showToast('选择应用功能开发中...');
    }

    function enableWindowMove(windowEl) {
        showToast('拖动窗口移动');
    }

    function enableWindowResize(windowEl) {
        showToast('拖拽窗口边缘调整大小');
    }

    function cascadeWindows() {
        var windows = getOpenWindows();
        if (windows.length === 0) return;

        var offset = 20;
        for (var i = 0; i < windows.length; i++) {
            var el = windows[i].element;
            if (!el) continue;
            el.style.transition = 'left 0.3s ease, top 0.3s ease';
            el.style.left = (50 + offset) + 'px';
            el.style.top = (50 + offset) + 'px';
            offset += 30;
        }
    }

    function snapWindows(direction) {
        var windows = getOpenWindows();
        if (windows.length === 0) return;

        var vw = window.innerWidth;
        var vh = window.innerHeight - 60;

        for (var i = 0; i < windows.length; i++) {
            var el = windows[i].element;
            if (!el) continue;
            el.style.transition = 'all 0.3s ease';

            if (direction === 'left') {
                el.style.left = '0';
                el.style.top = '0';
                el.style.width = (vw / 2) + 'px';
                el.style.height = vh + 'px';
            } else if (direction === 'right') {
                el.style.left = (vw / 2) + 'px';
                el.style.top = '0';
                el.style.width = (vw / 2) + 'px';
                el.style.height = vh + 'px';
            }
        }
    }

    function maximizeWindows() {
        var windows = getOpenWindows();
        for (var i = 0; i < windows.length; i++) {
            if (windows[i].id && typeof WindowManager !== 'undefined') {
                WindowManager.maximizeWindow(windows[i].id);
            }
        }
    }

    function getOpenWindows() {
        if (typeof WindowManager !== 'undefined' && Array.isArray(WindowManager.windows)) {
            return WindowManager.windows.filter(function (w) {
                return w && w.element && w.element.style.display !== 'none';
            });
        }
        return [];
    }

    function showDesktop() {
        if (typeof WindowManager !== 'undefined' && WindowManager.minimizeAll) {
            WindowManager.minimizeAll();
        }
    }

    function toggleDesktopIcons() {
        var container = document.getElementById('desktop-icons');
        if (!container) return;
        var currentDisplay = container.style.display;
        if (currentDisplay === 'none') {
            container.style.display = '';
            showToast('已显示桌面图标');
        } else {
            container.style.display = 'none';
            showToast('已隐藏桌面图标');
        }
    }

    function showToast(message) {
        if (typeof FluentUI !== 'undefined' && FluentUI.Toast) {
            FluentUI.Toast({ message: message, type: 'info' });
        } else {
            console.log('[ContextMenu]', message);
        }
    }

    return {
        init: init,
        show: show,
        hide: hide,
        showDesktopMenu: showDesktopMenu,
        showFileMenu: showFileMenu,
        showTaskbarMenu: showTaskbarMenu,
        showWindowMenu: showWindowMenu,
        showFolderContentMenu: showFolderContentMenu,
        _createNewFolder: createNewFolder,
        _createNewFile: createNewFile
    };

})();

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        if (window.ContextMenuSystem && !window.ContextMenuSystem.__inited) {
            try {
                window.ContextMenuSystem.init();
                window.ContextMenuSystem.__inited = true;
            } catch (e) {
                console.warn('[ContextMenuSystem] 自动初始化失败:', e);
            }
        }
    }, 500);
});