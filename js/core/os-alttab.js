/**
 * NyouOS 26.6 - 完整 Alt+Tab 切换器
 * 类 Windows 风格的窗口切换体验，支持键盘和鼠标操作
 */

window.OSAltTab = (function() {
    'use strict';

    var _overlay = null;
    var _panel = null;
    var _listEl = null;
    var _titleEl = null;
    var _isActive = false;
    var _altDown = false;
    var _tabDown = false;
    var _items = [];
    var _currentIndex = 0;
    var _sortByRecent = true;

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

    function init() {
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                if (_altDown) {
                    _cycleNext(e.shiftKey);
                } else {
                    _altDown = true;
                    _show();
                }
            }
            if (e.key === 'Alt' && !e.altKey && _isActive) {
                _hideAndSwitch();
            }
        });

        document.addEventListener('keyup', function(e) {
            if (!e.altKey && _isActive) {
                _hideAndSwitch();
            }
            if (!e.altKey) {
                _altDown = false;
            }
            if (_isActive && e.key === 'Escape') {
                _hide();
            }
        });
    }

    function _show() {
        if (_isActive) return;
        _isActive = true;

        _items = _getOpenWindows();
        if (_items.length === 0) return;

        _currentIndex = 0;

        _createOverlay();
        _render();
    }

    function _hide() {
        if (!_isActive) return;
        _isActive = false;
        _altDown = false;

        if (_overlay && _overlay.parentNode) {
            _overlay.parentNode.removeChild(_overlay);
        }
        _overlay = null;
        _panel = null;
        _listEl = null;
        _titleEl = null;
        _items = [];
        _currentIndex = 0;
    }

    function _hideAndSwitch() {
        if (!_isActive) return;

        var selected = _items[_currentIndex];
        _hide();

        if (selected && typeof OSWindowSystem !== 'undefined') {
            if (selected.isMinimized) {
                OSWindowSystem.restoreWindow(selected.id);
            } else {
                OSWindowSystem._bringToFront(selected.id);
                OSWindowSystem._setActiveWindow(selected.id);
            }
        }
    }

    function _cycleNext(shiftKey) {
        if (!_isActive || _items.length === 0) return;

        if (shiftKey) {
            _currentIndex = (_currentIndex - 1 + _items.length) % _items.length;
        } else {
            _currentIndex = (_currentIndex + 1) % _items.length;
        }
        _render();
    }

    function _getOpenWindows() {
        if (typeof OSWindowSystem === 'undefined') return [];
        var wins = OSWindowSystem.getWindows();
        if (!_sortByRecent) return wins;

        var activeId = OSWindowSystem.getActiveWindow() ? OSWindowSystem.getActiveWindow().id : null;
        if (!activeId) return wins;

        var result = wins.slice();
        result.sort(function(a, b) {
            if (a.id === activeId) return 1;
            if (b.id === activeId) return -1;
            return 0;
        });
        return result;
    }

    function _createOverlay() {
        _overlay = document.createElement('div');
        _overlay.className = 'os-alttab-overlay';
        _overlay.innerHTML =
            '<div class="os-alttab-bg"></div>' +
            '<div class="os-alttab-panel">' +
                '<div class="os-alttab-title">' +
                    '<span class="os-alttab-app-name">选择应用</span>' +
                '</div>' +
                '<div class="os-alttab-list"></div>' +
                '<div class="os-alttab-footer">按住 Alt+Tab 切换</div>' +
            '</div>';

        document.body.appendChild(_overlay);
        _listEl = _overlay.querySelector('.os-alttab-list');
        _titleEl = _overlay.querySelector('.os-alttab-app-name');

        _overlay.addEventListener('mousemove', function(e) {
            var items = _listEl.querySelectorAll('.os-alttab-item');
            for (var i = 0; i < items.length; i++) {
                var rect = items[i].getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    _currentIndex = i;
                    _updateSelection();
                    break;
                }
            }
        });

        _overlay.addEventListener('click', function(e) {
            var item = e.target.closest('.os-alttab-item');
            if (item) {
                _currentIndex = parseInt(item.dataset.index, 10);
                _hideAndSwitch();
            }
        });

        _overlay.addEventListener('mouseleave', function() {
            _currentIndex = -1;
            _updateSelection();
        });
    }

    function _render() {
        if (!_listEl) return;
        _listEl.innerHTML = '';

        for (var i = 0; i < _items.length; i++) {
            var win = _items[i];
            var icon = _APP_ICONS[win.appId] || win.icon || '';
            var isSelected = i === _currentIndex;

            var item = document.createElement('div');
            item.className = 'os-alttab-item' + (isSelected ? ' os-alttab-selected' : '');
            item.dataset.index = String(i);

            var imgHTML = '';
            if (icon) {
                imgHTML = '<img src="' + icon + '" alt="">';
            }

            item.innerHTML =
                '<div class="os-alttab-thumb">' +
                    '<div class="os-alttab-thumb-bg">' + imgHTML + '</div>' +
                '</div>' +
                '<div class="os-alttab-label">' + win.title + '</div>';

            _listEl.appendChild(item);
        }

        _updateTitle();
    }

    function _updateSelection() {
        if (!_listEl) return;
        var items = _listEl.querySelectorAll('.os-alttab-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('os-alttab-selected', i === _currentIndex);
        }
        _updateTitle();
    }

    function _updateTitle() {
        if (!_titleEl) return;
        var selected = _items[_currentIndex];
        if (selected) {
            _titleEl.textContent = selected.title;
        } else {
            _titleEl.textContent = '选择应用';
        }
    }

    function show() {
        _show();
    }

    function hide() {
        _hide();
    }

    function switchTo(index) {
        if (!_isActive) {
            _show();
        }
        _currentIndex = index;
        _render();
    }

    return {
        init: init,
        show: show,
        hide: hide,
        switchTo: switchTo
    };
})();
