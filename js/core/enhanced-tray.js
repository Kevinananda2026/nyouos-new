/**
 * NyouOS 26.6 - 增强系统托盘
 * 完整的系统托盘：时钟、网络、音量、蓝牙、电量、通知中心
 */

window.EnhancedTray = (function() {

    var _container = null;
    var _clockInterval = null;
    var _batteryInterval = null;
    var _volumeLevel = 70;
    var _volumeMuted = false;
    var _bluetoothOn = false;
    var _batteryLevel = 85;
    var _isCharging = false;
    var _notifications = [];
    var _popup = null;
    var _popupType = null;
    var _calendarYear = 0;
    var _calendarMonth = 0;
    var _onlineStatus = true;
    var _supportedNetworks = [
        { name: 'NyouOS Virtual Network', status: 'active', strength: 5, ssid: 'NyouOS-5G' },
        { name: 'Wi-Fi Home 5G', status: 'available', strength: 4, ssid: 'HOME-5G' },
        { name: 'CoffeeShop Guest', status: 'available', strength: 2, ssid: 'CAFE-GUEST' },
        { name: 'Office-2.4G', status: 'available', strength: 3, ssid: 'OFFICE-2.4' }
    ];
    var _pairedDevices = [
        { name: 'iPhone 15 Pro', type: 'phone', icon: 'phone', connected: false },
        { name: 'AirPods Pro', type: 'headphone', icon: 'headphone', connected: false },
        { name: 'Magic Mouse 2', type: 'mouse', icon: 'mouse', connected: false },
        { name: 'Smart Watch', type: 'watch', icon: 'watch', connected: false }
    ];

    function init() {
        _container = document.getElementById('taskbar-tray');
        if (!_container) return;

        _buildTray();
        _startClock();
        _monitorNetwork();
        _startBatterySimulation();
        _bindGlobalEvents();
    }

    function _buildTray() {
        _container.innerHTML =
            '<div class="nyouos-tray-enhanced">' +
                '<div class="nyouos-tray-group">' +
                    '<button class="nyouos-tray-btn-e" data-tray="notifications" title="通知中心">' +
                        '<svg class="icon-bell" viewBox="0 0 24 24" fill="currentColor">' +
                            '<path d="M12 2a7 7 0 0 0-7 7v4.586l-1.707 1.707A1 1 0 0 0 4 17h16a1 1 0 0 0 .707-1.707L19 13.586V9a7 7 0 0 0-7-7zM10 20a2 2 0 0 0 4 0h-4z"/>' +
                        '</svg>' +
                        '<span class="nyouos-tray-badge" style="display:none;">0</span>' +
                    '</button>' +
                    '<button class="nyouos-tray-btn-e" data-tray="bluetooth" title="蓝牙">' +
                        '<svg class="icon-bluetooth" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>' +
                        '</svg>' +
                    '</button>' +
                    '<button class="nyouos-tray-btn-e" data-tray="network" title="网络">' +
                        '<svg class="icon-network" viewBox="0 0 24 24" fill="currentColor">' +
                            '<path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5.5 10.5a8.5 8.5 0 0 1 13 0l1.5-1.5a10.5 10.5 0 0 0-16 0l1.5 1.5zM2 7a14 14 0 0 1 20 0l1.5-1.5a16 16 0 0 0-23 0L2 7z"/>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
                '<div class="nyouos-tray-separator-e"></div>' +
                '<div class="nyouos-tray-group">' +
                    '<button class="nyouos-tray-btn-e" data-tray="volume" title="音量">' +
                        '<svg class="icon-volume" viewBox="0 0 24 24" fill="currentColor">' +
                            '<path d="M3 10v4a1 1 0 0 0 1 1h3l5 5V4L7 9H4a1 1 0 0 0-1 1z"/>' +
                            '<path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z"/>' +
                            '<path d="M14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/>' +
                        '</svg>' +
                    '</button>' +
                    '<button class="nyouos-tray-btn-e" data-tray="battery" title="电池">' +
                        '<svg class="icon-battery" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                            '<rect x="2" y="7" width="18" height="10" rx="2"/>' +
                            '<rect x="20.5" y="10" width="2" height="4" rx="1" fill="currentColor" stroke="none"/>' +
                            '<rect class="battery-fill" x="3.5" y="8.5" width="12" height="7" rx="1" fill="currentColor" stroke="none"/>' +
                        '</svg>' +
                        '<span class="nyouos-tray-battery-text">85%</span>' +
                    '</button>' +
                '</div>' +
                '<div class="nyouos-tray-separator-e"></div>' +
                '<button class="nyouos-tray-btn-e nyouos-tray-clock-btn" data-tray="clock" title="日期时间">' +
                    '<div class="nyouos-tray-clock-container">' +
                        '<div class="nyouos-tray-time">--:--</div>' +
                        '<div class="nyouos-tray-date">--/--/----</div>' +
                    '</div>' +
                '</button>' +
            '</div>' +
            '<div class="nyouos-tray-enhanced-popup" id="nyouos-tray-popup-e"></div>';

        _popup = _container.querySelector('#nyouos-tray-popup-e');

        _container.querySelectorAll('[data-tray]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var type = btn.dataset.tray;
                togglePopup(type);
            });
        });
    }

    function _startClock() {
        _updateClock();
        _clockInterval = setInterval(_updateClock, 1000);
    }

    function _updateClock() {
        var now = new Date();
        var h = _pad(now.getHours());
        var m = _pad(now.getMinutes());
        var mo = _pad(now.getMonth() + 1);
        var d = _pad(now.getDate());
        var y = now.getFullYear();
        var timeEl = _container.querySelector('.nyouos-tray-time');
        var dateEl = _container.querySelector('.nyouos-tray-date');
        if (timeEl) timeEl.textContent = h + ':' + m;
        if (dateEl) dateEl.textContent = mo + '/' + d;

        if (_popupType === 'clock' && _popup.style.display === 'block') {
            var bigTime = _popup.querySelector('.nyouos-popup-time-big');
            if (bigTime) {
                bigTime.textContent = h + ':' + m + ':' + _pad(now.getSeconds());
            }
        }
    }

    function _pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function _monitorNetwork() {
        var updateStatus = function() {
            _onlineStatus = navigator.onLine;
            var btn = _container.querySelector('[data-tray="network"]');
            if (btn) {
                btn.style.opacity = _onlineStatus ? '1' : '0.45';
                btn.title = _onlineStatus ? '已连接网络' : '网络已断开';
            }
        };
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    function _startBatterySimulation() {
        _updateBatteryIcon();
        _batteryInterval = setInterval(function() {
            if (_isCharging) {
                _batteryLevel = Math.min(100, _batteryLevel + 1);
                if (_batteryLevel >= 100) _isCharging = false;
            } else {
                _batteryLevel = Math.max(5, _batteryLevel - 1);
            }
            _updateBatteryIcon();
        }, 30000);
    }

    function _updateBatteryIcon() {
        var btn = _container.querySelector('[data-tray="battery"]');
        if (!btn) return;

        var color = _batteryLevel <= 20 ? '#e81123' : (_batteryLevel <= 50 ? '#ff8c00' : '#107c10');
        var fillWidth = Math.max(1, Math.round(_batteryLevel * 0.78));
        var chargingBolt = '';
        if (_isCharging) {
            chargingBolt = '<text x="12" y="14.5" text-anchor="middle" font-size="8" fill="#ffb900" font-weight="bold">⚡</text>';
        }

        btn.innerHTML =
            '<svg class="icon-battery" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<rect x="2" y="7" width="18" height="10" rx="2"/>' +
                '<rect x="20.5" y="10" width="2" height="4" rx="1" fill="currentColor" stroke="none"/>' +
                '<rect x="3.5" y="8.5" width="' + fillWidth + '" height="7" rx="1" fill="' + color + '" stroke="none"/>' +
                chargingBolt +
            '</svg>' +
            '<span class="nyouos-tray-battery-text">' + _batteryLevel + '%</span>';

        btn.title = '电量 ' + _batteryLevel + '%' + (_isCharging ? ' (充电中)' : '');
    }

    function togglePopup(type) {
        if (_popupType === type && _popup.style.display === 'block') {
            _hidePopup();
            return;
        }
        _showPopup(type);
    }

    function _showPopup(type) {
        _popupType = type;
        var content = '';

        switch (type) {
            case 'clock': content = _getCalendarHTML(); break;
            case 'volume': content = _getVolumeHTML(); break;
            case 'network': content = _getNetworkHTML(); break;
            case 'notifications': content = _getNotificationsHTML(); break;
            case 'bluetooth': content = _getBluetoothHTML(); break;
            case 'battery': content = _getBatteryHTML(); break;
            default: _hidePopup(); return;
        }

        _popup.innerHTML = content;
        _popup.style.display = 'block';

        var triggerBtn = _container.querySelector('[data-tray="' + type + '"]');
        if (triggerBtn) {
            var rect = triggerBtn.getBoundingClientRect();
            var left = rect.right - 300;
            var top = rect.bottom + 8;
            if (left < 8) left = 8;
            if (left + 300 > window.innerWidth - 8) left = window.innerWidth - 308;
            if (top + 400 > window.innerHeight - 8) {
                top = rect.top - 400 - 8;
                if (top < 8) top = 8;
            }
            _popup.style.left = left + 'px';
            _popup.style.top = top + 'px';
        }

        _popup.classList.remove('nyouos-popup-show');
        void _popup.offsetWidth;
        _popup.classList.add('nyouos-popup-show');

        _bindPopupEvents(type);
    }

    function _hidePopup() {
        _popup.style.display = 'none';
        _popup.classList.remove('nyouos-popup-show');
        _popupType = null;
    }

    function _bindGlobalEvents() {
        document.addEventListener('click', function(e) {
            if (!_container.contains(e.target)) {
                _hidePopup();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                _hidePopup();
            }
        });

        window.addEventListener('resize', function() {
            if (_popup.style.display === 'block' && _popupType) {
                _showPopup(_popupType);
            }
        });

        window.addEventListener('scroll', function() {
            if (_popup.style.display === 'block' && _popupType) {
                _showPopup(_popupType);
            }
        }, true);
    }

    function _getCalendarHTML() {
        var now = new Date();
        if (_calendarYear === 0) _calendarYear = now.getFullYear();
        if (_calendarMonth === 0) _calendarMonth = now.getMonth();

        var year = _calendarYear;
        var month = _calendarMonth;
        var today = now.getDate();
        var todayMonth = now.getMonth();
        var todayYear = now.getFullYear();
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var weekDays = ['日', '一', '二', '三', '四', '五', '六'];

        var h = _pad(now.getHours());
        var m = _pad(now.getMinutes());
        var s = _pad(now.getSeconds());

        var html =
            '<div class="nyouos-popup-header">' +
                '<button class="nyouos-popup-nav" id="cal-prev" title="上一月">‹</button>' +
                '<div class="nyouos-popup-title">' + year + '年 ' + (month + 1) + '月</div>' +
                '<button class="nyouos-popup-nav" id="cal-next" title="下一月">›</button>' +
            '</div>' +
            '<div class="nyouos-calendar">' +
                '<div class="nyouos-calendar-weekday">' +
                    weekDays.map(function(d) { return '<div>' + d + '</div>'; }).join('') +
                '</div>' +
                '<div class="nyouos-calendar-day">';

        for (var i = 0; i < firstDay; i++) {
            html += '<div class="nyouos-calendar-empty"></div>';
        }
        for (var day = 1; day <= daysInMonth; day++) {
            var isToday = (day === today && month === todayMonth && year === todayYear);
            html += '<div class="' + (isToday ? 'today' : '') + '">' + day + '</div>';
        }
        html += '</div></div>';

        html += '<div class="nyouos-popup-time-big">' + h + ':' + m + ':' + s + '</div>';

        html +=
            '<div style="padding: 0 16px 12px;">' +
                '<button id="cal-set-time" class="nyouos-popup-action" style="width:100%;padding:8px 12px;border-radius:6px;background:rgba(0,120,212,0.1);color:#0078d4;font-weight:500;">' +
                    '设置时间' +
                '</button>' +
            '</div>';

        return html;
    }

    function _getVolumeHTML() {
        var vol = _volumeMuted ? 0 : _volumeLevel;
        var iconPath = _getVolumeIconPath(vol);
        return
            '<div class="nyouos-popup-header">' +
                '<div class="nyouos-popup-title">音量控制</div>' +
                '<button id="vol-mute" class="nyouos-popup-action" style="color:' + (_volumeMuted ? '#e81123' : ''); + '">' + (_volumeMuted ? '取消静音' : '静音') + '</button>' +
            '</div>' +
            '<div class="nyouos-popup-control">' +
                '<div class="nyouos-popup-row">' +
                    '<span class="nyouos-popup-icon" id="vol-icon">' +
                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' + iconPath + '</svg>' +
                    '</span>' +
                    '<input type="range" id="vol-slider" class="nyouos-slider" min="0" max="100" value="' + vol + '">' +
                    '<span class="nyouos-popup-value" id="vol-val">' + vol + '</span>' +
                '</div>' +
            '</div>';
    }

    function _getVolumeIconPath(level) {
        if (_volumeMuted || level === 0) {
            return '<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else if (level < 33) {
            return '<path d="M7 9v6h4l5 5V4l-5 5H7z"/>';
        } else if (level < 66) {
            return '<path d="M7 9v6h4l5 5V4l-5 5H7zm9 3a5 5 0 0 0-2-4v8a5 5 0 0 0 2-4z"/>';
        } else {
            return '<path d="M3 9v6h4l5 5V4l-5 5H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z"/>';
        }
    }

    function _getNetworkHTML() {
        var online = _onlineStatus;
        var html =
            '<div class="nyouos-popup-header">' +
                '<div class="nyouos-popup-title">网络状态</div>' +
            '</div>' +
            '<div class="nyouos-popup-status ' + (online ? 'online' : 'offline') + '">' +
                '<div class="nyouos-status-indicator"></div>' +
                '<span>' + (online ? '已连接网络' : '网络已断开') + '</span>' +
            '</div>' +
            '<div class="nyouos-popup-list">';

        _supportedNetworks.forEach(function(net, idx) {
            var isActive = net.status === 'active';
            var strengthDots = '';
            for (var s = 0; s < 5; s++) {
                strengthDots += '<span style="display:inline-block;width:4px;height:4px;border-radius:50%;margin-right:1px;background:' + (s < net.strength ? '#0078d4' : 'rgba(0,0,0,0.15)') + ';"></span>';
            }
            html +=
                '<div class="nyouos-popup-item" data-net="' + idx + '">' +
                    '<span class="nyouos-popup-icon">📶</span>' +
                    '<span>' + net.name + '</span>' +
                    '<span class="nyouos-popup-badge">' + (isActive ? '活动' : '可用') + '</span>' +
                '</div>' +
                '<div style="padding:0 16px 8px 42px;font-size:11px;color:var(--text-tertiary,#999);display:flex;align-items:center;gap:4px;">' +
                    strengthDots +
                    '<span>' + net.ssid + '</span>' +
                '</div>';
        });

        html += '</div>';
        return html;
    }

    function _getNotificationsHTML() {
        var notifs = _notifications.length > 0 ? _notifications : null;
        var html =
            '<div class="nyouos-popup-header">' +
                '<div class="nyouos-popup-title">通知中心</div>' +
                '<button class="nyouos-popup-action" id="clear-notifs">全部清除</button>' +
            '</div>' +
            '<div class="nyouos-popup-notifications">';

        if (notifs) {
            notifs.forEach(function(n) {
                html +=
                    '<div class="nyouos-notif-item">' +
                        '<div class="nyouos-notif-icon">' + (n.icon || '📢') + '</div>' +
                        '<div class="nyouos-notif-content">' +
                            '<div class="nyouos-notif-title">' + n.title + '</div>' +
                            '<div class="nyouos-notif-msg">' + n.message + '</div>' +
                            '<div class="nyouos-notif-time">' + n.time + '</div>' +
                        '</div>' +
                    '</div>';
            });
        } else {
            html +=
                '<div class="nyouos-popup-empty">' +
                    '<div class="nyouos-empty-icon">🔔</div>' +
                    '<div>暂无新通知</div>' +
                '</div>';
        }

        html += '</div>';
        return html;
    }

    function _getBluetoothHTML() {
        var html =
            '<div class="nyouos-popup-header">' +
                '<div class="nyouos-popup-title">蓝牙</div>' +
                '<button class="nyouos-popup-toggle ' + (_bluetoothOn ? 'on' : '') + '" id="bt-toggle">' +
                    '<span></span>' +
                '</button>' +
            '</div>' +
            '<div style="padding:8px 16px;font-size:12px;color:var(--text-secondary,#666);' + (_bluetoothOn ? '' : 'opacity:0.5;') + '">' +
                (_bluetoothOn ? '蓝牙已开启，可被附近设备发现' : '蓝牙已关闭') +
            '</div>' +
            '<div class="nyouos-popup-list">';

        _pairedDevices.forEach(function(dev, idx) {
            var iconSvg = _getDeviceIcon(dev.icon);
            html +=
                '<div class="nyouos-popup-item" data-device="' + idx + '"' + (_bluetoothOn ? '' : ' style="opacity:0.5;pointer-events:none;"') + '>' +
                    '<span class="nyouos-popup-icon">' + iconSvg + '</span>' +
                    '<span>' + dev.name + '</span>' +
                    '<span class="nyouos-popup-badge">' + (dev.connected ? '已连接' : '未连接') + '</span>' +
                '</div>';
        });

        html += '</div>';
        return html;
    }

    function _getDeviceIcon(type) {
        var size = '18';
        var vb = '0 0 24 24';
        var fill = 'currentColor';
        switch (type) {
            case 'phone':
                return '<svg width="' + size + '" height="' + size + '" viewBox="' + vb + '" fill="' + fill + '"><path d="M17.5 5.5c0 1.5-1.2 2.7-2.7 2.7S12 7 12 5.5s1.2-2.7 2.7-2.7 2.8 1.2 2.8 2.7zM4.5 18c0 1.7 1.3 3 3 3h9c1.7 0 3-1.3 3-3v-8c0-1.7-1.3-3-3-3h-9c-1.7 0-3 1.3-3 3v8z"/></svg>';
            case 'headphone':
                return '<svg width="' + size + '" height="' + size + '" viewBox="' + vb + '" fill="' + fill + '"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/></svg>';
            case 'mouse':
                return '<svg width="' + size + '" height="' + size + '" viewBox="' + vb + '" fill="' + fill + '"><path d="M12 2a7 7 0 0 0-7 7v6a7 7 0 0 0 14 0V9a7 7 0 0 0-7-7zm-1 2.07A5 5 0 0 1 16.93 8H12V4.07zm2 1.93h4.93c.4 0 .76.06 1.12.17.12.44.18.9.18 1.37v1H13V6zm-2-1.93V8H5.07A5 5 0 0 1 11 4.07zM4 12v-1c0-.47.06-.93.18-1.37.36-.11.72-.17 1.12-.17H11v3H4z"/></svg>';
            case 'watch':
                return '<svg width="' + size + '" height="' + size + '" viewBox="' + vb + '" fill="' + fill + '"><path d="M12 2a7 7 0 0 0-7 7v6a7 7 0 0 0 14 0V9a7 7 0 0 0-7-7zm-1 4h2v5h-2V6zm-3.5-4l.5 2h6l.5-2h-7zm0 16l.5-2h6l.5 2h-7z"/></svg>';
            default:
                return '📱';
        }
    }

    function _getBatteryHTML() {
        var hours = Math.floor(_batteryLevel * 0.25);
        var mins = Math.floor((_batteryLevel * 0.25 - hours) * 60);
        var color = _batteryLevel <= 20 ? '#e81123' : '#107c10';

        return
            '<div class="nyouos-popup-header">' +
                '<div class="nyouos-popup-title">电源</div>' +
            '</div>' +
            '<div class="nyouos-battery-display">' +
                '<div class="nyouos-battery-large' + (_batteryLevel <= 20 ? ' low' : '') + '">' +
                    _batteryLevel + '%' +
                '</div>' +
                '<div class="nyouos-battery-status">' +
                    (_isCharging ? '⚡ 正在充电中' : '🔋 使用电池供电') +
                '</div>' +
                '<div class="nyouos-battery-bar">' +
                    '<div class="nyouos-battery-fill" style="width:' + _batteryLevel + '%;background:linear-gradient(90deg,' + color + ',rgba(0,120,212,1));"></div>' +
                '</div>' +
                '<div style="margin-top:16px;font-size:13px;color:var(--text-secondary,#666);">' +
                    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
                        '<span>预计剩余时间</span>' +
                        '<span style="font-weight:500;">' + hours + '小时 ' + mins + '分钟</span>' +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
                        '<span>充电状态</span>' +
                        '<span style="font-weight:500;color:' + (_isCharging ? '#107c10' : '#666') + ';">' + (_isCharging ? '充电中' : '未充电') + '</span>' +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:6px 0;">' +
                        '<span>电源模式</span>' +
                        '<span style="font-weight:500;">' + (_batteryLevel <= 20 ? '节能' : '平衡') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function _bindPopupEvents(type) {
        if (type === 'clock') {
            _calendarYear = _calendarYear || new Date().getFullYear();
            _calendarMonth = _calendarMonth || new Date().getMonth();

            var prevBtn = _popup.querySelector('#cal-prev');
            var nextBtn = _popup.querySelector('#cal-next');
            if (prevBtn) {
                prevBtn.addEventListener('click', function() {
                    _calendarMonth--;
                    if (_calendarMonth < 0) { _calendarMonth = 11; _calendarYear--; }
                    _showPopup('clock');
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', function() {
                    _calendarMonth++;
                    if (_calendarMonth > 11) { _calendarMonth = 0; _calendarYear++; }
                    _showPopup('clock');
                });
            }
            var setTimeBtn = _popup.querySelector('#cal-set-time');
            if (setTimeBtn) {
                setTimeBtn.addEventListener('click', function() {
                    _hidePopup();
                    if (window.NyouOS && window.NyouOS.showToast) {
                        window.NyouOS.showToast('请在"设置 > 时间和语言"中调整时间');
                    }
                });
            }
        }

        if (type === 'volume') {
            var volSlider = _popup.querySelector('#vol-slider');
            var volVal = _popup.querySelector('#vol-val');
            var volIcon = _popup.querySelector('#vol-icon');
            var muteBtn = _popup.querySelector('#vol-mute');

            if (volSlider) {
                volSlider.style.setProperty('--slider-fill', (_volumeMuted ? 0 : _volumeLevel) + '%');
                volSlider.addEventListener('input', function(e) {
                    var val = parseInt(e.target.value);
                    _volumeLevel = val;
                    if (_volumeMuted && val > 0) _volumeMuted = false;
                    if (!_volumeMuted && val === 0) _volumeMuted = true;
                    if (volVal) volVal.textContent = val;
                    if (volIcon) volIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' + _getVolumeIconPath(val) + '</svg>';
                    if (muteBtn) muteBtn.textContent = _volumeMuted ? '取消静音' : '静音';
                    e.target.style.setProperty('--slider-fill', val + '%');
                    _updateTrayVolumeIcon();
                });
            }
            if (muteBtn) {
                muteBtn.addEventListener('click', function() {
                    _volumeMuted = !_volumeMuted;
                    if (_volumeMuted) {
                        _volumeLevel = _volumeLevel || 50;
                        if (volSlider) {
                            volSlider.value = 0;
                            volSlider.style.setProperty('--slider-fill', '0%');
                        }
                        if (volVal) volVal.textContent = '0';
                    } else {
                        if (volSlider) {
                            volSlider.value = _volumeLevel;
                            volSlider.style.setProperty('--slider-fill', _volumeLevel + '%');
                        }
                        if (volVal) volVal.textContent = _volumeLevel;
                    }
                    muteBtn.textContent = _volumeMuted ? '取消静音' : '静音';
                    if (volIcon) {
                        var showLevel = _volumeMuted ? 0 : _volumeLevel;
                        volIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' + _getVolumeIconPath(showLevel) + '</svg>';
                    }
                    _updateTrayVolumeIcon();
                });
            }
        }

        if (type === 'notifications') {
            var clearBtn = _popup.querySelector('#clear-notifs');
            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
                    _notifications = [];
                    _updateNotificationBadge();
                    _hidePopup();
                });
            }
        }

        if (type === 'bluetooth') {
            var toggle = _popup.querySelector('#bt-toggle');
            if (toggle) {
                toggle.addEventListener('click', function() {
                    _bluetoothOn = !_bluetoothOn;
                    _updateTrayBluetoothIcon();
                    _showPopup('bluetooth');
                });
            }
            _popup.querySelectorAll('[data-device]').forEach(function(item) {
                item.addEventListener('click', function() {
                    var idx = parseInt(item.dataset.device);
                    if (!_bluetoothOn) return;
                    _pairedDevices[idx].connected = !_pairedDevices[idx].connected;
                    _showPopup('bluetooth');
                });
            });
        }

        if (type === 'network') {
            _popup.querySelectorAll('[data-net]').forEach(function(item) {
                item.addEventListener('click', function() {
                    var idx = parseInt(item.dataset.net);
                    _supportedNetworks.forEach(function(net) {
                        net.status = 'available';
                    });
                    _supportedNetworks[idx].status = 'active';
                    _showPopup('network');
                });
            });
        }
    }

    function _updateTrayVolumeIcon() {
        var btn = _container.querySelector('[data-tray="volume"]');
        if (!btn) return;
        var level = _volumeMuted ? 0 : _volumeLevel;
        btn.innerHTML =
            '<svg class="icon-volume" viewBox="0 0 24 24" fill="currentColor">' + _getVolumeIconPath(level) + '</svg>';
    }

    function _updateTrayBluetoothIcon() {
        var btn = _container.querySelector('[data-tray="bluetooth"]');
        if (!btn) return;
        var color = _bluetoothOn ? '#0078d4' : '';
        btn.style.color = color;
    }

    function setVolume(level) {
        level = Math.max(0, Math.min(100, parseInt(level) || 0));
        _volumeLevel = level;
        if (level === 0) _volumeMuted = true;
        else _volumeMuted = false;
        _updateTrayVolumeIcon();
    }

    function getVolume() {
        return _volumeMuted ? 0 : _volumeLevel;
    }

    function addNotification(title, message, icon) {
        icon = icon || '📢';
        var now = new Date();
        var time = _pad(now.getHours()) + ':' + _pad(now.getMinutes());
        _notifications.unshift({ title: title, message: message, icon: icon, time: time });
        if (_notifications.length > 30) {
            _notifications.pop();
        }
        _updateNotificationBadge();
    }

    function _updateNotificationBadge() {
        var badge = _container.querySelector('.nyouos-tray-badge');
        if (badge) {
            var count = _notifications.length;
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    return {
        init: init,
        togglePopup: togglePopup,
        setVolume: setVolume,
        getVolume: getVolume,
        addNotification: addNotification
    };

})();