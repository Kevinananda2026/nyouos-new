/**
 * NyouOS 26.6 - 操作中心
 * Windows 11 风格快速设置面板和通知中心
 * @version 26.6.2
 */

window.OSActionCenter = (function() {
    'use strict';

    var _panel = null;
    var _isOpen = false;
    var _notifications = [];
    var _volume = 70;
    var _brightness = 80;
    var _wifiOn = true;
    var _bluetoothOn = false;
    var _airplaneMode = false;
    var _focusAssist = false;

    function init() {
        _loadState();
    }

    function _loadState() {
        try {
            var saved = localStorage.getItem('osActionCenter');
            if (saved) {
                var state = JSON.parse(saved);
                _volume = state.volume || 70;
                _brightness = state.brightness || 80;
                _wifiOn = state.wifiOn !== undefined ? state.wifiOn : true;
                _bluetoothOn = state.bluetoothOn || false;
                _airplaneMode = state.airplaneMode || false;
                _focusAssist = state.focusAssist || false;
            }
        } catch (e) {}
    }

    function _saveState() {
        try {
            localStorage.setItem('osActionCenter', JSON.stringify({
                volume: _volume,
                brightness: _brightness,
                wifiOn: _wifiOn,
                bluetoothOn: _bluetoothOn,
                airplaneMode: _airplaneMode,
                focusAssist: _focusAssist
            }));
        } catch (e) {}
    }

    function toggle() {
        if (_isOpen) {
            close();
        } else {
            open();
        }
    }

    function open() {
        if (_isOpen && _panel) return;
        _isOpen = true;

        _panel = document.createElement('div');
        _panel.className = 'os-action-center';
        _panel.innerHTML = _renderPanel();

        document.body.appendChild(_panel);

        _bindPanelEvents();
        _updateSliderDisplay();

        requestAnimationFrame(function() {
            _panel.classList.add('os-action-visible');
        });
    }

    function close() {
        if (!_panel) {
            _isOpen = false;
            return;
        }

        _panel.classList.remove('os-action-visible');
        var panel = _panel;
        setTimeout(function() {
            if (panel.parentNode) {
                panel.parentNode.removeChild(panel);
            }
        }, 200);

        _panel = null;
        _isOpen = false;
    }

    function _renderPanel() {
        var wifiClass = 'os-actile' + (_wifiOn ? ' os-actile-on' : '');
        var btClass = 'os-actile' + (_bluetoothOn ? ' os-actile-on' : '');
        var airplaneClass = 'os-actile' + (_airplaneMode ? ' os-actile-on' : '');
        var focusClass = 'os-actile' + (_focusAssist ? ' os-actile-on' : '');

        return '<div class="os-action-bg"></div>' +
            '<div class="os-action-panel">' +
                '<div class="os-action-quick">' +
                    '<div class="os-action-title">快速设置</div>' +
                    '<div class="os-action-toggles">' +
                        '<button class="' + wifiClass + '" data-toggle="wifi">' +
                            '<div class="os-actile-icon">' +
                                '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="currentColor"/></svg>' +
                            '</div>' +
                            '<div class="os-actile-label">Wi-Fi</div>' +
                        '</button>' +
                        '<button class="' + btClass + '" data-toggle="bluetooth">' +
                            '<div class="os-actile-icon">' +
                                '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z" fill="currentColor"/></svg>' +
                            '</div>' +
                            '<div class="os-actile-label">蓝牙</div>' +
                        '</button>' +
                        '<button class="' + airplaneClass + '" data-toggle="airplane">' +
                            '<div class="os-actile-icon">' +
                                '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/></svg>' +
                            '</div>' +
                            '<div class="os-actile-label">飞行模式</div>' +
                        '</button>' +
                        '<button class="' + focusClass + '" data-toggle="focus">' +
                            '<div class="os-actile-icon">' +
                                '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>' +
                            '</div>' +
                            '<div class="os-actile-label">专注</div>' +
                        '</button>' +
                    '</div>' +
                    '<div class="os-action-sliders">' +
                        '<div class="os-action-slider-row">' +
                            '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/></svg>' +
                            '<input type="range" class="os-action-slider os-volume-slider" min="0" max="100" value="' + _volume + '">' +
                            '<span class="os-slider-value os-volume-value">' + _volume + '%</span>' +
                        '</div>' +
                        '<div class="os-action-slider-row">' +
                            '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" fill="currentColor"/></svg>' +
                            '<input type="range" class="os-action-slider os-brightness-slider" min="0" max="100" value="' + _brightness + '">' +
                            '<span class="os-slider-value os-brightness-value">' + _brightness + '%</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="os-action-notifications">' +
                    '<div class="os-action-title">' +
                        '通知' +
                        (_notifications.length > 0 ? '<span class="os-notif-count">' + _notifications.length + '</span>' : '') +
                    '</div>' +
                    '<div class="os-action-notif-list" id="os-action-notif-list">' +
                        _renderNotifications() +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function _renderNotifications() {
        if (_notifications.length === 0) {
            return '<div class="os-notif-empty">暂无新通知</div>';
        }

        var html = '';
        for (var i = 0; i < _notifications.length; i++) {
            var n = _notifications[i];
            html += '<div class="os-notif-item">' +
                '<div class="os-notif-icon">' + (n.icon || '📢') + '</div>' +
                '<div class="os-notif-content">' +
                    '<div class="os-notif-title">' + n.title + '</div>' +
                    '<div class="os-notif-body">' + n.message + '</div>' +
                    '<div class="os-notif-time">' + n.time + '</div>' +
                '</div>' +
                '<button class="os-notif-close" data-id="' + n.id + '">×</button>' +
            '</div>';
        }
        return html;
    }

    function _bindPanelEvents() {
        var toggles = _panel.querySelectorAll('[data-toggle]');
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var type = this.dataset.toggle;
                _toggleFeature(type, this);
            });
        }

        var bg = _panel.querySelector('.os-action-bg');
        if (bg) {
            bg.addEventListener('click', function() {
                close();
            });
        }

        var volumeSlider = _panel.querySelector('.os-volume-slider');
        var volumeValue = _panel.querySelector('.os-volume-value');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function() {
                _volume = parseInt(this.value, 10);
                if (volumeValue) volumeValue.textContent = _volume + '%';
                _saveState();
            });
        }

        var brightnessSlider = _panel.querySelector('.os-brightness-slider');
        var brightnessValue = _panel.querySelector('.os-brightness-value');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', function() {
                _brightness = parseInt(this.value, 10);
                if (brightnessValue) brightnessValue.textContent = _brightness + '%';
                _saveState();
                _applyBrightness();
            });
        }

        var notifCloseBtns = _panel.querySelectorAll('.os-notif-close');
        for (var i = 0; i < notifCloseBtns.length; i++) {
            notifCloseBtns[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.dataset.id;
                _removeNotification(id);
            });
        }
    }

    function _toggleFeature(type, btn) {
        switch (type) {
            case 'wifi':
                _wifiOn = !_wifiOn;
                break;
            case 'bluetooth':
                _bluetoothOn = !_bluetoothOn;
                break;
            case 'airplane':
                _airplaneMode = !_airplaneMode;
                break;
            case 'focus':
                _focusAssist = !_focusAssist;
                break;
        }

        btn.classList.toggle('os-actile-on');
        _saveState();
    }

    function _updateSliderDisplay() {
        var volumeSlider = _panel.querySelector('.os-volume-slider');
        var volumeValue = _panel.querySelector('.os-volume-value');
        if (volumeSlider) volumeSlider.value = _volume;
        if (volumeValue) volumeValue.textContent = _volume + '%';

        var brightnessSlider = _panel.querySelector('.os-brightness-slider');
        var brightnessValue = _panel.querySelector('.os-brightness-value');
        if (brightnessSlider) brightnessSlider.value = _brightness;
        if (brightnessValue) brightnessValue.textContent = _brightness + '%';
    }

    function _applyBrightness() {
        try {
            var overlay = document.getElementById('os-brightness-overlay');
            if (overlay) {
                overlay.remove();
            }
            overlay = document.createElement('div');
            overlay.id = 'os-brightness-overlay';
            overlay.style.cssText =
                'position:fixed;top:0;left:0;width:100%;height:100%;' +
                'background:rgba(0,0,0,' + ((100 - _brightness) / 200) + ');' +
                'pointer-events:none;z-index:99999;transition:background 0.3s;';
            document.body.appendChild(overlay);
        } catch (e) {}
    }

    function addNotification(title, message, icon) {
        var n = {
            id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            title: title,
            message: message,
            icon: icon || '📢',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        _notifications.unshift(n);
        if (_notifications.length > 20) {
            _notifications = _notifications.slice(0, 20);
        }

        _updateNotificationList();
        _showToastNotification(n);

        return n;
    }

    function _removeNotification(id) {
        var idx = -1;
        for (var i = 0; i < _notifications.length; i++) {
            if (_notifications[i].id === id) {
                idx = i;
                break;
            }
        }
        if (idx !== -1) {
            _notifications.splice(idx, 1);
            _updateNotificationList();
        }
    }

    function _updateNotificationList() {
        var list = document.getElementById('os-action-notif-list');
        if (list) {
            list.innerHTML = _renderNotifications();
        }
    }

    function _showToastNotification(notif) {
        var toast = document.createElement('div');
        toast.className = 'os-toast-notification';
        toast.innerHTML =
            '<div class="os-toast-icon">' + (notif.icon || '📢') + '</div>' +
            '<div class="os-toast-content">' +
                '<div class="os-toast-title">' + notif.title + '</div>' +
                '<div class="os-toast-body">' + notif.message + '</div>' +
            '</div>';

        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('os-toast-visible');
        });

        setTimeout(function() {
            toast.classList.remove('os-toast-visible');
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }

    function show(title, message, icon) {
        return addNotification(title, message, icon);
    }

    function clearNotifications() {
        _notifications = [];
        _updateNotificationList();
    }

    return {
        init: init,
        open: open,
        close: close,
        toggle: toggle,
        show: show,
        addNotification: addNotification,
        clearNotifications: clearNotifications
    };
})();
