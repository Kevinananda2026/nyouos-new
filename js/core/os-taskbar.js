/**
 * NyouOS 26.6 - 完整任务栏系统
 * Windows 风格任务栏，显示所有打开窗口、系统托盘、任务视图
 */

window.OSTaskbar = (function() {
    'use strict';

    var _container = null;
    var _appButtons = null;
    var _trayContainer = null;
    var _clockEl = null;
    var _dateEl = null;
    var _clockInterval = null;
    var _buttons = {};
    var _hoverPreviews = {};
    var _activeAppId = null;
    var _startBtn = null;

    var _APP_ICONS = {
        files: 'Theme/Icon/App_icon/files.png',
        settings: 'Theme/Icon/App_icon/settings.png',
        browser: 'Theme/Icon/App_icon/browser.png',
        terminal: 'Theme/Icon/App_icon/terminal.png',
        'process-manager': 'Theme/Icon/App_icon/Taskmgr.png',
        calculator: 'Theme/Icon/App_icon/calculator.png',
        notes: 'Theme/Icon/App_icon/notes.png',
        clock: 'Theme/Icon/App_icon/clock.png',
        weather: 'Theme/Icon/App_icon/weather.png',
        appshop: 'Theme/Icon/App_icon/app_gallery.png',
        camera: 'Theme/Icon/App_icon/camera.png',
        photos: 'Theme/Icon/App_icon/photos.png',
        media: 'Theme/Icon/App_icon/media.png',
        tips: 'Theme/Icon/App_icon/tips.png'
    };

    var _APP_NAMES = {
        files: '文件',
        settings: '设置',
        browser: '浏览器',
        terminal: '终端',
        'process-manager': '任务管理器',
        calculator: '计算器',
        notes: '记事本',
        clock: '时钟',
        weather: '天气',
        appshop: '应用商店',
        camera: '相机',
        photos: '照片',
        media: '媒体',
        tips: '提示'
    };

    function init(containerId) {
        _container = document.getElementById(containerId);
        if (!_container) {
            _container = document.getElementById('taskbar');
        }
        if (!_container) return;

        _container.classList.add('os-taskbar');
        _container.innerHTML =
            '<div class="os-taskbar-start">' +
                '<button class="os-taskbar-start-btn" title="开始">' +
                    '<svg viewBox="0 0 24 24" width="24" height="24">' +
                        '<path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z" fill="currentColor"/>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<div class="os-taskbar-search">' +
                '<div class="os-taskbar-search-box">' +
                    '<svg class="os-search-icon" viewBox="0 0 24 24" width="16" height="16">' +
                        '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' +
                        '<path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
                    '</svg>' +
                    '<input type="text" class="os-search-input" placeholder="搜索...">' +
                '</div>' +
            '</div>' +
            '<div class="os-taskbar-apps" id="os-taskbar-apps"></div>' +
            '<div class="os-taskbar-separator"></div>' +
            '<div class="os-taskbar-tray" id="os-taskbar-tray">' +
                '<div class="os-tray-buttons">' +
                    '<button class="os-tray-btn" data-tray="action-center" title="操作中心">' +
                        '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                    '</button>' +
                    '<button class="os-tray-btn" data-tray="task-view" title="任务视图">' +
                        '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="os-tray-status">' +
                    '<div class="os-tray-icon os-tray-network" title="网络">' +
                        '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="currentColor"/></svg>' +
                    '</div>' +
                    '<div class="os-tray-icon os-tray-volume" title="音量">' +
                        '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/></svg>' +
                    '</div>' +
                    '<div class="os-tray-icon os-tray-battery" title="电池">' +
                        '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="20.5" y="10" width="2" height="4" rx="1" fill="currentColor"/><rect x="3.5" y="8.5" width="12" height="7" rx="1" fill="currentColor" opacity="0.8"/></svg>' +
                    '</div>' +
                '</div>' +
                '<div class="os-tray-clock">' +
                    '<div class="os-tray-time">--:--</div>' +
                    '<div class="os-tray-date">--/--/----</div>' +
                '</div>' +
            '</div>';

        _appButtons = _container.querySelector('#os-taskbar-apps');
        _trayContainer = _container.querySelector('#os-taskbar-tray');
        _clockEl = _trayContainer.querySelector('.os-tray-time');
        _dateEl = _trayContainer.querySelector('.os-tray-date');
        _startBtn = _container.querySelector('.os-taskbar-start-btn');

        _bindTaskbarEvents();
        _startClock();
    }

    function _bindTaskbarEvents() {
        if (_startBtn) {
            _startBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleStartMenu();
            });
        }

        if (_container) {
            _container.querySelector('.os-taskbar-search-box').addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof OSStartMenu !== 'undefined' && OSStartMenu.focusSearch) {
                    OSStartMenu.focusSearch();
                }
            });
        }

        var trayBtns = _container.querySelectorAll('.os-tray-btn');
        for (var i = 0; i < trayBtns.length; i++) {
            trayBtns[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var type = this.dataset.tray;
                _handleTrayClick(type, this);
            });
        }

        var trayClock = _trayContainer.querySelector('.os-tray-clock');
        if (trayClock) {
            trayClock.addEventListener('click', function(e) {
                e.stopPropagation();
                _toggleCalendarPopup(trayClock);
            });
        }

        if (typeof OSWindowSystem !== 'undefined') {
            OSWindowSystem.setEventCallback(function(event, payload) {
                _onWindowEvent(event, payload);
            });
        }

        document.addEventListener('click', function(e) {
            if (!_container.contains(e.target)) {
                _hideStartMenu();
                _hideCalendarPopup();
            }
        });
    }

    function _handleTrayClick(type, btn) {
        switch (type) {
            case 'action-center':
                if (typeof OSActionCenter !== 'undefined') {
                    OSActionCenter.toggle();
                }
                break;
            case 'task-view':
                _toggleTaskView();
                break;
        }
    }

    function _toggleCalendarPopup(anchor) {
        var existing = document.getElementById('os-calendar-popup');
        if (existing) {
            existing.remove();
            return;
        }

        var popup = document.createElement('div');
        popup.id = 'os-calendar-popup';
        popup.className = 'os-calendar-popup';
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();

        var monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
        var dayNames = ['日','一','二','三','四','五','六'];

        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var today = now.getDate();

        var calendarHTML = '<div class="os-calendar-header">' +
            '<button class="os-calendar-nav" data-dir="-1">‹</button>' +
            '<span class="os-calendar-title">' + year + '年 ' + monthNames[month] + '</span>' +
            '<button class="os-calendar-nav" data-dir="1">›</button>' +
        '</div>';
        calendarHTML += '<div class="os-calendar-weekdays">';
        for (var i = 0; i < dayNames.length; i++) {
            calendarHTML += '<span class="os-calendar-weekday">' + dayNames[i] + '</span>';
        }
        calendarHTML += '</div><div class="os-calendar-days">';

        for (var i = 0; i < firstDay; i++) {
            calendarHTML += '<span class="os-calendar-day-placeholder"></span>';
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var isToday = (d === today);
            calendarHTML += '<span class="os-calendar-day' + (isToday ? ' os-calendar-today' : '') + '">' + d + '</span>';
        }
        calendarHTML += '</div>';
        calendarHTML += '<div class="os-calendar-time">' +
            '<div class="os-calendar-time-big">' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</div>' +
            '<div class="os-calendar-date-big">' + now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) + '</div>' +
        '</div>';

        popup.innerHTML = calendarHTML;

        var rect = anchor.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        popup.style.right = (window.innerWidth - rect.right) + 'px';

        document.body.appendChild(popup);
    }

    function _hideCalendarPopup() {
        var popup = document.getElementById('os-calendar-popup');
        if (popup) popup.remove();
    }

    function _toggleTaskView() {
        if (typeof OSTaskView !== 'undefined') {
            OSTaskView.toggle();
            return;
        }

        var existing = document.getElementById('os-taskview-overlay');
        if (existing) {
            existing.remove();
            return;
        }

        var windows = [];
        if (typeof OSWindowSystem !== 'undefined') {
            windows = OSWindowSystem.getWindows();
        }

        var overlay = document.createElement('div');
        overlay.id = 'os-taskview-overlay';
        overlay.className = 'os-taskview-overlay';

        var html = '<div class="os-taskview-bg"></div>';
        html += '<div class="os-taskview-panel">';
        html += '<div class="os-taskview-title">任务视图</div>';
        html += '<div class="os-taskview-grid">';

        if (windows.length === 0) {
            html += '<div class="os-taskview-empty">没有打开的窗口</div>';
        } else {
            for (var i = 0; i < windows.length; i++) {
                var w = windows[i];
                if (w.isMinimized) continue;
                var icon = _APP_ICONS[w.appId] || '';
                html += '<div class="os-taskview-item" data-window-id="' + w.id + '">' +
                    '<div class="os-taskview-thumb">' +
                        (icon ? '<img src="' + icon + '" alt="">' : '') +
                    '</div>' +
                    '<div class="os-taskview-label">' + w.title + '</div>' +
                '</div>';
            }
        }

        html += '</div></div>';
        overlay.innerHTML = html;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay || e.target.classList.contains('os-taskview-bg')) {
                overlay.remove();
                return;
            }
            var item = e.target.closest('.os-taskview-item');
            if (item) {
                var winId = item.dataset.windowId;
                if (typeof OSWindowSystem !== 'undefined') {
                    OSWindowSystem.restoreWindow(winId);
                }
                overlay.remove();
            }
        });

        window.addEventListener('keydown', function onKey(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                window.removeEventListener('keydown', onKey);
            }
        });
    }

    function toggleStartMenu() {
        if (typeof OSStartMenu !== 'undefined') {
            OSStartMenu.toggle();
            return;
        }

        var existing = document.getElementById('os-start-menu');
        if (existing) {
            existing.remove();
            return;
        }

        var menu = document.createElement('div');
        menu.id = 'os-start-menu';
        menu.className = 'os-start-menu';

        var appList = [
            { id: 'files', name: '文件资源管理器', icon: _APP_ICONS.files },
            { id: 'settings', name: '设置', icon: _APP_ICONS.settings },
            { id: 'browser', name: '浏览器', icon: _APP_ICONS.browser },
            { id: 'terminal', name: '终端', icon: _APP_ICONS.terminal },
            { id: 'process-manager', name: '任务管理器', icon: _APP_ICONS['process-manager'] },
            { id: 'calculator', name: '计算器', icon: _APP_ICONS.calculator },
            { id: 'notes', name: '记事本', icon: _APP_ICONS.notes },
            { id: 'clock', name: '时钟', icon: _APP_ICONS.clock },
            { id: 'weather', name: '天气', icon: _APP_ICONS.weather },
            { id: 'appshop', name: '应用商店', icon: _APP_ICONS.appshop }
        ];

        var html = '<div class="os-start-search">' +
            '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '<input type="text" placeholder="搜索应用和设置...">' +
        '</div>';

        html += '<div class="os-start-pinned"><div class="os-start-section-title">已固定</div><div class="os-start-grid">';
        for (var i = 0; i < appList.length; i++) {
            html += '<div class="os-start-app" data-app="' + appList[i].id + '">' +
                '<img src="' + appList[i].icon + '" alt="">' +
                '<span>' + appList[i].name + '</span>' +
            '</div>';
        }
        html += '</div></div>';

        html += '<div class="os-start-all"><div class="os-start-section-title">所有应用</div><div class="os-start-list">';
        for (var i = 0; i < appList.length; i++) {
            html += '<div class="os-start-all-app" data-app="' + appList[i].id + '">' +
                '<img src="' + appList[i].icon + '" alt="">' +
                '<span>' + appList[i].name + '</span>' +
                '<svg class="os-start-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>';
        }
        html += '</div></div>';

        html += '<div class="os-start-footer">' +
            '<div class="os-start-user">' +
                '<div class="os-start-user-avatar">K</div>' +
                '<span>KevinAnanda</span>' +
            '</div>' +
            '<div class="os-start-power">' +
                '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M18.36 6.64C19.5 7.78 20 9.34 20 11c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-1.66.5-3.22 1.36-4.36L7 7.5l1.41 1.41C7.55 9.77 7 10.84 7 12c0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.16-.55-2.23-1.41-3.09L17 7.5l1.36-.86z" fill="currentColor"/></svg>' +
            '</div>' +
        '</div>';

        menu.innerHTML = html;

        var rect = _startBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.left = rect.left + 'px';
        menu.style.bottom = (window.innerHeight - rect.bottom + 8) + 'px';

        document.body.appendChild(menu);

        var appEls = menu.querySelectorAll('[data-app]');
        for (var i = 0; i < appEls.length; i++) {
            appEls[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var appId = this.dataset.app;
                if (typeof OSWindowSystem !== 'undefined') {
                    OSWindowSystem.openApp(appId);
                } else if (typeof WindowManager !== 'undefined') {
                    WindowManager.openApp(appId);
                }
                _hideStartMenu();
            });
        }
    }

    function _hideStartMenu() {
        var menu = document.getElementById('os-start-menu');
        if (menu) menu.remove();
    }

    function _onWindowEvent(event, payload) {
        switch (event) {
            case 'created':
                addAppButton(payload.appId, payload);
                break;
            case 'close':
                removeAppButton(payload.appId);
                break;
            case 'minimize':
                updateAppButtonState(payload.appId, payload.id, 'minimized');
                break;
            case 'restore':
                updateAppButtonState(payload.appId, payload.id, 'normal');
                break;
            case 'maximize':
                updateAppButtonState(payload.appId, payload.id, 'maximized');
                break;
            case 'restore-max':
                updateAppButtonState(payload.appId, payload.id, 'normal');
                break;
            case 'focus':
                updateActiveState(payload);
                break;
            case 'snap':
                updateAppButtonState(payload.appId, payload.id, 'normal');
                break;
            case 'taskbar:update':
                refreshAppButtons();
                break;
        }
    }

    function addAppButton(appId, winData) {
        if (_buttons[appId]) return;

        var icon = _APP_ICONS[appId] || '';
        var name = _APP_NAMES[appId] || appId;

        var btn = document.createElement('button');
        btn.className = 'os-taskbar-app-btn';
        btn.dataset.appId = appId;
        btn.title = name;
        btn.innerHTML =
            '<div class="os-taskbar-app-icon">' +
                (icon ? '<img src="' + icon + '" alt="">' : '<span>' + name.charAt(0) + '</span>') +
            '</div>' +
            '<div class="os-taskbar-app-indicator"></div>';

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            _handleAppClick(appId);
        });

        btn.addEventListener('mouseenter', function(e) {
            _showHoverPreview(appId, btn);
        });

        btn.addEventListener('mouseleave', function(e) {
            _hideHoverPreview(appId);
        });

        _appButtons.appendChild(btn);
        _buttons[appId] = btn;

        if (!winData || !winData.isMinimized) {
            btn.classList.add('os-app-active');
        }
    }

    function removeAppButton(appId) {
        var btn = _buttons[appId];
        if (btn && btn.parentNode) {
            btn.parentNode.removeChild(btn);
        }
        delete _buttons[appId];
    }

    function updateAppButtonState(appId, winId, state) {
        var btn = _buttons[appId];
        if (!btn) return;

        btn.classList.remove('os-app-minimized', 'os-app-maximized');

        if (state === 'minimized') {
            btn.classList.add('os-app-minimized');
            btn.classList.remove('os-app-active');
        } else if (state === 'maximized') {
            btn.classList.add('os-app-maximized');
            btn.classList.add('os-app-active');
        } else {
            btn.classList.add('os-app-active');
        }
    }

    function updateActiveState(payload) {
        if (!payload || !payload.id) return;

        var windows = [];
        if (typeof OSWindowSystem !== 'undefined') {
            windows = OSWindowSystem.getWindows();
        }

        var appIdMap = {};
        for (var i = 0; i < windows.length; i++) {
            appIdMap[windows[i].id] = windows[i].appId;
        }

        for (var appId in _buttons) {
            _buttons[appId].classList.remove('os-app-active');
        }

        var appId = appIdMap[payload.id];
        if (appId && _buttons[appId]) {
            _buttons[appId].classList.add('os-app-active');
        }
    }

    function refreshAppButtons() {
        if (typeof OSWindowSystem === 'undefined') return;
        var windows = OSWindowSystem.getWindows();
        var activeIds = {};

        for (var i = 0; i < windows.length; i++) {
            activeIds[windows[i].appId] = true;
            if (!_buttons[windows[i].appId]) {
                addAppButton(windows[i].appId, windows[i]);
            }
        }

        for (var appId in _buttons) {
            if (!activeIds[appId]) {
                removeAppButton(appId);
            }
        }

        updateActiveState(OSWindowSystem.getActiveWindow());
    }

    function _handleAppClick(appId) {
        if (typeof OSWindowSystem === 'undefined') return;

        var win = OSWindowSystem.findWindowByApp(appId);
        if (!win) {
            OSWindowSystem.openApp(appId);
            return;
        }

        if (win.isMinimized) {
            OSWindowSystem.restoreWindow(win.id);
        } else if (OSWindowSystem.getActiveWindow() && OSWindowSystem.getActiveWindow().id === win.id) {
            if (win.isMaximized) {
                OSWindowSystem.restoreFromMaximize(win.id);
            } else {
                OSWindowSystem.minimizeWindow(win.id);
            }
        } else {
            OSWindowSystem._bringToFront(win.id);
            OSWindowSystem._setActiveWindow(win.id);
        }
    }

    function _showHoverPreview(appId, anchor) {
        if (_hoverPreviews[appId]) {
            _hoverPreviews[appId].remove();
        }

        var win = null;
        if (typeof OSWindowSystem !== 'undefined') {
            win = OSWindowSystem.findWindowByApp(appId);
        }
        if (!win) return;

        var preview = document.createElement('div');
        preview.className = 'os-taskbar-preview';
        preview.innerHTML =
            '<div class="os-preview-title">' + win.title + '</div>' +
            '<div class="os-preview-thumb">' +
                (win.icon ? '<img src="' + win.icon + '" alt="">' : '') +
            '</div>';

        var rect = anchor.getBoundingClientRect();
        preview.style.position = 'fixed';
        preview.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
        preview.style.left = Math.max(10, rect.left - 40) + 'px';

        document.body.appendChild(preview);
        _hoverPreviews[appId] = preview;
    }

    function _hideHoverPreview(appId) {
        if (_hoverPreviews[appId]) {
            _hoverPreviews[appId].remove();
            delete _hoverPreviews[appId];
        }
    }

    function _startClock() {
        _updateClock();
        _clockInterval = setInterval(_updateClock, 1000);
    }

    function _updateClock() {
        var now = new Date();
        if (_clockEl) {
            _clockEl.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        if (_dateEl) {
            _dateEl.textContent = now.toLocaleDateString('zh-CN', { month: '2-digit', day: '-digit' });
        }
    }

    return {
        init: init,
        toggleStartMenu: toggleStartMenu,
        _toggleTaskView: _toggleTaskView,
        _toggleCalendarPopup: _toggleCalendarPopup
    };
})();
