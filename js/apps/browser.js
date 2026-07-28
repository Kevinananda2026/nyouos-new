/**
 * Browser application
 */

const BrowserApp = {
    container: null,
    tabs: [],
    activeTabId: null,
    tabIdCounter: 0,
    SEARCH_PAGE_PREFIX: 'fluent-search://results/',
    HISTORY_KEY: 'nyouos_browser_history',
    FAVORITES_KEY: 'nyouos_browser_favorites',
    DOWNLOADS_KEY: 'nyouos_browser_downloads',
    downloads: [],

    init(windowId) {
        const contentContainer = document.querySelector(`#${windowId}-content`);
        if (!contentContainer) {
            console.error('[BrowserApp] content container not found', windowId);
            return;
        }

        this.container = contentContainer;
        this.tabs = [];
        this.activeTabId = null;
        this.tabIdCounter = 0;
        this.downloads = this.loadDownloads();

        this.render();
        this.createNewTab();

        if (!this._favoriteSitesChangeHandler) {
            this._favoriteSitesChangeHandler = () => {
                if (this.getActiveTab()?.url === 'about:blank') this.renderStartPageFavorites();
                this.updateBookmarkButton();
            };
            window.addEventListener('fluent-favorite-sites-change', this._favoriteSitesChangeHandler);
        }
    },

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    saveHistory(history) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    },

    addHistoryItem(url, title) {
        if (!url || url === 'about:blank' || this.isSearchResultsUrl(url)) return;
        const history = this.getHistory();
        const existingIndex = history.findIndex(item => item.url === url);
        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }
        history.unshift({
            url: url,
            title: title || url,
            timestamp: Date.now()
        });
        if (history.length > 200) {
            history.length = 200;
        }
        this.saveHistory(history);
    },

    removeHistoryItem(url) {
        const history = this.getHistory().filter(item => item.url !== url);
        this.saveHistory(history);
    },

    clearAllHistory() {
        this.saveHistory([]);
    },

    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    saveFavorites(favorites) {
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    },

    isFavorite(url) {
        if (!url || url === 'about:blank') return false;
        return this.getFavorites().some(fav => fav.url === url);
    },

    addFavorite(url, title) {
        if (!url || url === 'about:blank') return;
        if (this.isFavorite(url)) return;
        const favorites = this.getFavorites();
        favorites.unshift({
            url: url,
            title: title || url,
            timestamp: Date.now()
        });
        this.saveFavorites(favorites);
        window.dispatchEvent(new CustomEvent('browser-favorites-changed'));
    },

    removeFavorite(url) {
        const favorites = this.getFavorites().filter(fav => fav.url !== url);
        this.saveFavorites(favorites);
        window.dispatchEvent(new CustomEvent('browser-favorites-changed'));
    },

    toggleFavorite(url, title) {
        if (this.isFavorite(url)) {
            this.removeFavorite(url);
            return false;
        } else {
            this.addFavorite(url, title);
            return true;
        }
    },

    loadDownloads() {
        try {
            return JSON.parse(localStorage.getItem(this.DOWNLOADS_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    saveDownloads() {
        localStorage.setItem(this.DOWNLOADS_KEY, JSON.stringify(this.downloads));
    },

    addDownload(url, filename, status) {
        this.downloads.unshift({
            url: url,
            filename: filename,
            status: status || 'completed',
            timestamp: Date.now()
        });
        if (this.downloads.length > 50) {
            this.downloads.length = 50;
        }
        this.saveDownloads();
    },

    isExecutableFile(url) {
        const ext = url.split('.').pop().toLowerCase().split('?')[0];
        const executableExts = ['exe', 'bat', 'cmd', 'ps1', 'vbs', 'msi', 'reg', 'scr', 'com', 'pif'];
        return executableExts.includes(ext);
    },

    isDownloadableFile(url) {
        const ext = url.split('.').pop().toLowerCase().split('?')[0];
        const nonPageExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', '7z',
            'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico',
            'mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv', 'flv', 'wmv',
            'exe', 'bat', 'cmd', 'ps1', 'vbs', 'msi', 'reg', 'scr', 'com', 'pif',
            'csv', 'json', 'xml', 'css', 'js', 'html', 'htm'];
        return nonPageExts.includes(ext);
    },

    triggerDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || '';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.addDownload(url, filename || url.split('/').pop() || url);
    },

    handleDownloadLink(url, filename) {
        if (this.isExecutableFile(url)) {
            const confirmed = confirm('此文件可能会危害你的设备。是否仍要保存？\n\n' + (filename || url));
            if (confirmed) {
                this.triggerDownload(url, filename);
            }
        } else {
            this.triggerDownload(url, filename);
        }
    },

    render() {
        this.container.innerHTML = `
            <div class="browser-app">
                <div class="browser-header">
                    <div class="browser-navbar">
                        <div class="browser-nav-controls">
                            <button class="browser-nav-btn" id="browser-back" title="${t('browser.back')}" disabled>
                                <img src="Theme/Icon/Symbol_icon/stroke/Arrow Left.svg" alt="${t('browser.back')}">
                            </button>
                            <button class="browser-nav-btn" id="browser-forward" title="${t('browser.forward')}" disabled>
                                <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" alt="${t('browser.forward')}">
                            </button>
                            <button class="browser-nav-btn" id="browser-refresh" title="${t('browser.refresh')}">
                                <img src="Theme/Icon/Symbol_icon/stroke/Refresh.svg" alt="${t('browser.refresh')}">
                            </button>
                            <button class="browser-nav-btn" id="browser-home" title="${t('browser.home')}">
                                <img src="Theme/Icon/Symbol_icon/stroke/Home.svg" alt="${t('browser.home')}">
                            </button>
                        </div>

                        <div class="browser-address-bar-wrapper">
                            <button class="browser-address-bar-btn browser-page-info-btn" id="browser-page-info" title="页面信息">
                                <img src="Theme/Icon/Symbol_icon/stroke/Information Circle.svg" alt="页面信息">
                            </button>
                            <button class="browser-address-bar-btn browser-history-btn" id="browser-history-btn" title="历史记录">
                                <img src="Theme/Icon/Symbol_icon/stroke/Clock.svg" alt="历史记录">
                            </button>
                            <div class="browser-address-bar">
                                <input type="text" id="browser-address" placeholder="${t('browser.search.placeholder')}" spellcheck="false">
                            </div>
                            <button class="browser-address-bar-btn browser-bookmark-btn" id="browser-bookmark" title="${t('browser.bookmark')}" aria-pressed="false">
                                <img src="Theme/Icon/Symbol_icon/stroke/Star.svg" alt="${t('browser.bookmark')}">
                            </button>
                        </div>

                        <div class="browser-tools">
                            <button class="browser-tool-btn browser-downloads-btn" id="browser-downloads" title="下载">
                                <img src="Theme/Icon/Symbol_icon/stroke/Download.svg" alt="下载">
                            </button>
                        </div>
                    </div>

                    <div class="browser-history-panel browser-popup-panel" id="browser-history-panel" style="display:none;">
                        <div class="browser-popup-header">
                            <span class="browser-popup-title">历史记录</span>
                            <button class="browser-popup-close" id="browser-history-close" title="关闭">×</button>
                        </div>
                        <div class="browser-popup-content" id="browser-history-list">
                            <div class="browser-popup-empty">暂无历史记录</div>
                        </div>
                        <div class="browser-popup-footer">
                            <button class="browser-popup-clear-btn" id="browser-clear-history">清除全部历史记录</button>
                        </div>
                    </div>

                    <div class="browser-page-info-panel browser-popup-panel" id="browser-page-info-panel" style="display:none;">
                        <div class="browser-popup-header">
                            <span class="browser-popup-title">页面信息</span>
                            <button class="browser-popup-close" id="browser-page-info-close" title="关闭">×</button>
                        </div>
                        <div class="browser-popup-content browser-page-info-content">
                            <div class="browser-info-row">
                                <span class="browser-info-label">标题</span>
                                <span class="browser-info-value" id="browser-info-title">-</span>
                            </div>
                            <div class="browser-info-row">
                                <span class="browser-info-label">URL</span>
                                <div class="browser-info-value browser-info-url" id="browser-info-url">-</div>
                            </div>
                            <div class="browser-info-row">
                                <span class="browser-info-label">协议</span>
                                <span class="browser-info-value" id="browser-info-protocol">-</span>
                            </div>
                        </div>
                        <div class="browser-popup-footer">
                            <button class="browser-popup-action-btn" id="browser-copy-url">复制 URL</button>
                        </div>
                    </div>

                    <div class="browser-downloads-panel browser-popup-panel" id="browser-downloads-panel" style="display:none;">
                        <div class="browser-popup-header">
                            <span class="browser-popup-title">下载</span>
                            <button class="browser-popup-close" id="browser-downloads-close" title="关闭">×</button>
                        </div>
                        <div class="browser-popup-content" id="browser-downloads-list">
                            <div class="browser-popup-empty">暂无下载记录</div>
                        </div>
                    </div>
                </div>

                <div class="browser-content" id="browser-content"></div>
            </div>
        `;

        this.addStyles();
        this.bindEvents();
        this.renderTabs();
    },

    bindEvents() {
        const backBtn = this.container.querySelector('#browser-back');
        const forwardBtn = this.container.querySelector('#browser-forward');
        const refreshBtn = this.container.querySelector('#browser-refresh');
        const homeBtn = this.container.querySelector('#browser-home');
        const addressBar = this.container.querySelector('#browser-address');
        const bookmarkBtn = this.container.querySelector('#browser-bookmark');
        const historyBtn = this.container.querySelector('#browser-history-btn');
        const historyPanel = this.container.querySelector('#browser-history-panel');
        const historyClose = this.container.querySelector('#browser-history-close');
        const clearHistoryBtn = this.container.querySelector('#browser-clear-history');
        const pageInfoBtn = this.container.querySelector('#browser-page-info');
        const pageInfoPanel = this.container.querySelector('#browser-page-info-panel');
        const pageInfoClose = this.container.querySelector('#browser-page-info-close');
        const copyUrlBtn = this.container.querySelector('#browser-copy-url');
        const downloadsBtn = this.container.querySelector('#browser-downloads');
        const downloadsPanel = this.container.querySelector('#browser-downloads-panel');
        const downloadsClose = this.container.querySelector('#browser-downloads-close');

        backBtn?.addEventListener('click', () => this.goBack());
        forwardBtn?.addEventListener('click', () => this.goForward());
        refreshBtn?.addEventListener('click', () => this.refresh());
        homeBtn?.addEventListener('click', () => this.goHome());

        addressBar?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.navigate(addressBar.value);
            }
        });

        bookmarkBtn?.addEventListener('click', async () => {
            const tab = this.getActiveTab();
            if (!tab || !tab.url || tab.url === 'about:blank') {
                State.addNotification({
                    title: t('browser.title'),
                    message: '当前页面无法收藏',
                    type: 'info'
                });
                return;
            }

            try {
                const wasBookmarked = this.isFavorite(tab.url);
                this.toggleFavorite(tab.url, tab.title);

                if (typeof Widgets !== 'undefined' && Widgets.renderAll) Widgets.renderAll();
                const message = wasBookmarked
                    ? `已取消收藏 ${tab.title || tab.url}`
                    : `已收藏 ${tab.title || tab.url}`;
                if (window.FluentUI && FluentUI.Toast) {
                    FluentUI.Toast({
                        title: t('browser.title'),
                        message,
                        type: 'success'
                    });
                } else {
                    State.addNotification({
                        title: t('browser.title'),
                        message,
                        type: 'success'
                    });
                }
            } catch (error) {
                State.addNotification({
                    title: t('browser.title'),
                    message: '收藏失败，请稍后重试',
                    type: 'error'
                });
            } finally {
                this.updateBookmarkButton();
                if (tab.url === 'about:blank') {
                    this.renderStartPageFavorites();
                }
            }
        });

        historyBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHistoryPanel();
        });

        historyClose?.addEventListener('click', () => {
            this.hidePanel(historyPanel);
        });

        clearHistoryBtn?.addEventListener('click', () => {
            if (confirm('确定要清除所有历史记录吗？')) {
                this.clearAllHistory();
                this.renderHistoryList();
            }
        });

        pageInfoBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePageInfoPanel();
        });

        pageInfoClose?.addEventListener('click', () => {
            this.hidePanel(pageInfoPanel);
        });

        copyUrlBtn?.addEventListener('click', () => {
            const tab = this.getActiveTab();
            if (tab && tab.url && tab.url !== 'about:blank') {
                navigator.clipboard?.writeText(tab.url).then(() => {
                    if (window.FluentUI && FluentUI.Toast) {
                        FluentUI.Toast({
                            title: t('browser.title'),
                            message: 'URL 已复制到剪贴板',
                            type: 'success'
                        });
                    }
                }).catch(() => {});
            }
        });

        downloadsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDownloadsPanel();
        });

        downloadsClose?.addEventListener('click', () => {
            this.hidePanel(downloadsPanel);
        });

        document.addEventListener('click', (e) => {
            const historyPanel = this.container?.querySelector('#browser-history-panel');
            const historyBtn = this.container?.querySelector('#browser-history-btn');
            const pageInfoPanel = this.container?.querySelector('#browser-page-info-panel');
            const pageInfoBtn = this.container?.querySelector('#browser-page-info');
            const downloadsPanel = this.container?.querySelector('#browser-downloads-panel');
            const downloadsBtn = this.container?.querySelector('#browser-downloads');

            if (historyPanel && historyPanel.style.display !== 'none' && !historyPanel.contains(e.target) && !historyBtn?.contains(e.target)) {
                this.hidePanel(historyPanel);
            }
            if (pageInfoPanel && pageInfoPanel.style.display !== 'none' && !pageInfoPanel.contains(e.target) && !pageInfoBtn?.contains(e.target)) {
                this.hidePanel(pageInfoPanel);
            }
            if (downloadsPanel && downloadsPanel.style.display !== 'none' && !downloadsPanel.contains(e.target) && !downloadsBtn?.contains(e.target)) {
                this.hidePanel(downloadsPanel);
            }
        });

        if (window.SearchHistory && addressBar) {
            SearchHistory.bindPopover(addressBar, {
                anchor: addressBar.closest('.browser-address-bar-wrapper'),
                className: 'browser-search-history',
                minWidth: 360,
                onSelect: query => this.navigate(query)
            });
        }

        window.addEventListener('browser-favorites-changed', () => {
            this.updateBookmarkButton();
            if (this.getActiveTab()?.url === 'about:blank') {
                this.renderStartPageFavorites();
            }
        });
    },

    toggleHistoryPanel() {
        const panel = this.container.querySelector('#browser-history-panel');
        if (!panel) return;
        if (panel.style.display === 'none') {
            this.hideAllPanels();
            this.showPanel(panel);
            this.renderHistoryList();
        } else {
            this.hidePanel(panel);
        }
    },

    togglePageInfoPanel() {
        const panel = this.container.querySelector('#browser-page-info-panel');
        if (!panel) return;
        if (panel.style.display === 'none') {
            this.hideAllPanels();
            this.updatePageInfo();
            this.showPanel(panel);
        } else {
            this.hidePanel(panel);
        }
    },

    toggleDownloadsPanel() {
        const panel = this.container.querySelector('#browser-downloads-panel');
        if (!panel) return;
        if (panel.style.display === 'none') {
            this.hideAllPanels();
            this.renderDownloadsList();
            this.showPanel(panel);
        } else {
            this.hidePanel(panel);
        }
    },

    showPanel(panel) {
        panel.style.display = 'block';
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
        });
    },

    hidePanel(panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-8px)';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 150);
    },

    hideAllPanels() {
        this.container.querySelectorAll('.browser-popup-panel').forEach(panel => {
            if (panel.style.display !== 'none') {
                this.hidePanel(panel);
            }
        });
    },

    renderHistoryList() {
        const list = this.container.querySelector('#browser-history-list');
        if (!list) return;
        const history = this.getHistory();

        if (history.length === 0) {
            list.innerHTML = '<div class="browser-popup-empty">暂无历史记录</div>';
            return;
        }

        const grouped = {};
        history.forEach(item => {
            const date = new Date(item.timestamp);
            const dateKey = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(item);
        });

        let html = '';
        for (const [date, items] of Object.entries(grouped)) {
            html += `<div class="browser-history-date-group">
                <div class="browser-history-date">${date}</div>`;
            items.forEach(item => {
                html += `<div class="browser-history-item" data-url="${this.escapeHtml(item.url)}">
                    <span class="browser-history-item-title">${this.escapeHtml(item.title || item.url)}</span>
                    <span class="browser-history-item-url">${this.escapeHtml(item.url)}</span>
                    <button class="browser-history-item-delete" data-url="${this.escapeHtml(item.url)}" title="删除">
                        <img src="Theme/Icon/Symbol_icon/stroke/Cancel.svg" alt="删除">
                    </button>
                </div>`;
            });
            html += '</div>';
        }
        list.innerHTML = html;

        list.querySelectorAll('.browser-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.browser-history-item-delete')) {
                    const url = item.dataset.url;
                    this.navigate(url);
                    this.hidePanel(this.container.querySelector('#browser-history-panel'));
                }
            });
        });

        list.querySelectorAll('.browser-history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                this.removeHistoryItem(url);
                this.renderHistoryList();
            });
        });
    },

    updatePageInfo() {
        const tab = this.getActiveTab();
        const titleEl = this.container.querySelector('#browser-info-title');
        const urlEl = this.container.querySelector('#browser-info-url');
        const protocolEl = this.container.querySelector('#browser-info-protocol');

        if (!tab || !tab.url || tab.url === 'about:blank') {
            if (titleEl) titleEl.textContent = '-';
            if (urlEl) urlEl.textContent = '-';
            if (protocolEl) protocolEl.textContent = '-';
            return;
        }

        if (titleEl) titleEl.textContent = tab.title || tab.url;
        if (urlEl) urlEl.textContent = tab.url;
        if (protocolEl) {
            try {
                const urlObj = new URL(tab.url);
                protocolEl.textContent = urlObj.protocol.replace(':', '').toUpperCase();
            } catch (e) {
                protocolEl.textContent = '-';
            }
        }
    },

    renderDownloadsList() {
        const list = this.container.querySelector('#browser-downloads-list');
        if (!list) return;

        if (this.downloads.length === 0) {
            list.innerHTML = '<div class="browser-popup-empty">暂无下载记录</div>';
            return;
        }

        list.innerHTML = this.downloads.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleString('zh-CN');
            return `<div class="browser-download-item">
                <img src="Theme/Icon/Symbol_icon/stroke/Download.svg" alt="" class="browser-download-item-icon">
                <div class="browser-download-item-info">
                    <span class="browser-download-item-name">${this.escapeHtml(item.filename || item.url)}</span>
                    <span class="browser-download-item-time">${timeStr}</span>
                </div>
            </div>`;
        }).join('');
    },

    getWindowElement() {
        return this.container?.closest('.window') || null;
    },

    ensureTitlebarTabsHost() {
        const windowElement = this.getWindowElement();
        const titlebar = windowElement?.querySelector('.window-titlebar');
        const controls = titlebar?.querySelector('.window-controls');
        if (!titlebar || !controls) return null;

        let host = titlebar.querySelector('.browser-titlebar-tabs-host');
        if (!host) {
            host = document.createElement('div');
            host.className = 'browser-titlebar-tabs-host';
            titlebar.insertBefore(host, controls);
        }
        return host;
    },

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    },

    buildSearchResultsUrl(query) {
        return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    },

    isSearchResultsUrl(url) {
        return typeof url === 'string' && url.startsWith(this.SEARCH_PAGE_PREFIX);
    },

    getSearchQueryFromUrl(url) {
        if (!this.isSearchResultsUrl(url)) return '';
        return decodeURIComponent(url.slice(this.SEARCH_PAGE_PREFIX.length));
    },

    getSearchResultsTitle(query) {
        return `Search: ${query}`;
    },

    createNewTab(url = null) {
        const tabId = `tab-${this.tabIdCounter++}`;
        const tab = {
            id: tabId,
            title: t('browser.new-tab'),
            url: 'about:blank',
            history: [],
            historyIndex: -1
        };

        this.tabs.push(tab);
        this.switchTab(tabId);

        if (url) {
            this.navigate(url);
        } else {
            this.showStartPage();
        }
    },

    renderTabs() {
        const tabsContainer = this.ensureTitlebarTabsHost();
        if (!tabsContainer) return;

        tabsContainer.innerHTML = '';
        const tabBar = FluentUI.TabBar({
            tabs: this.tabs.map((tab) => ({
                id: tab.id,
                label: tab.title,
                icon: 'Globe',
                closable: true
            })),
            activeTab: this.activeTabId,
            onTabChange: (tabId) => this.switchTab(tabId),
            onTabClose: (tabId) => this.closeTab(tabId),
            showAddButton: true,
            onAddTab: () => this.createNewTab(),
            className: 'browser-titlebar-tabs'
        });
        tabsContainer.appendChild(tabBar);
        tabsContainer.querySelectorAll('.fluent-tab, .fluent-tab-close, .fluent-tabbar-add').forEach((node) => {
            node.dataset.noWindowDrag = 'true';
        });
    },

    switchTab(tabId) {
        this.activeTabId = tabId;
        this.renderTabs();
        this.renderContent();
        this.updateNavButtons();
        this.updateAddressBar();
    },

    closeTab(tabId) {
        const index = this.tabs.findIndex((tab) => tab.id === tabId);
        if (index === -1) return;

        this.tabs.splice(index, 1);

        if (tabId === this.activeTabId) {
            if (this.tabs.length > 0) {
                const newIndex = Math.max(0, index - 1);
                this.switchTab(this.tabs[newIndex].id);
            } else {
                this.createNewTab();
            }
        }

        this.renderTabs();
    },

    getActiveTab() {
        return this.tabs.find((tab) => tab.id === this.activeTabId) || null;
    },

    getFavoriteForUrl(url) {
        if (!window.FavoriteSites || !url || url === 'about:blank') return null;
        const urlKey = FavoriteSites.getUrlKey(url);
        if (!urlKey) return null;
        return FavoriteSites.getSites().find(site => FavoriteSites.getUrlKey(site.url) === urlKey) || null;
    },

    updateBookmarkButton() {
        const button = this.container?.querySelector('#browser-bookmark');
        const image = button?.querySelector('img');
        if (!button || !image) return;

        const tab = this.getActiveTab();
        const canBookmark = Boolean(tab?.url && tab.url !== 'about:blank');
        const isBookmarked = canBookmark && this.isFavorite(tab.url);
        const label = isBookmarked ? '取消收藏' : t('browser.bookmark');

        button.classList.toggle('bookmarked', isBookmarked);
        button.setAttribute('aria-pressed', String(isBookmarked));
        button.title = label;
        image.src = `Theme/Icon/Symbol_icon/${isBookmarked ? 'fill' : 'stroke'}/Star.svg`;
        image.alt = label;
    },

    navigate(input) {
        const tab = this.getActiveTab();
        if (!tab) return;

        let url = String(input || '').trim();
        if (!url) return;

        if (url === 'about:blank') {
            this.showStartPage();
            return;
        }

        const looksLikeUrl = url.includes('.') &&
            !url.includes(' ') &&
            (url.startsWith('http://') || url.startsWith('https://') || /^[\w-]+\./.test(url));

        if (looksLikeUrl) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `http://${url}`;
            }
        } else {
            if (window.SearchHistory) SearchHistory.add(url);
            url = this.buildSearchResultsUrl(url);
        }

        tab.historyIndex += 1;
        tab.history = tab.history.slice(0, tab.historyIndex);
        tab.history.push(url);
        tab.url = url;

        try {
            if (this.isSearchResultsUrl(url)) {
                tab.title = this.getSearchResultsTitle(this.getSearchQueryFromUrl(url));
            } else {
                const urlObj = new URL(url);
                tab.title = urlObj.hostname.replace('www.', '') || t('browser.new-tab');
            }
        } catch (error) {
            tab.title = t('browser.new-tab');
        }

        this.addHistoryItem(url, tab.title);

        this.renderTabs();
        this.renderContent();
        this.updateNavButtons();
        this.updateAddressBar();
    },

    showStartPage() {
        const tab = this.getActiveTab();
        if (!tab) return;

        tab.url = 'about:blank';
        tab.title = t('browser.new-tab');

        const contentContainer = this.container.querySelector('#browser-content');
        contentContainer.innerHTML = `
            <div class="browser-start-page">
                <time class="start-page-time" aria-label="当前时间"></time>

                <div class="start-page-search">
                    <img src="Theme/Icon/Symbol_icon/stroke/Search.svg" alt="" class="search-icon">
                    <input type="text" placeholder="${t('browser.search.placeholder')}" id="start-page-search" spellcheck="false">
                </div>

                <div class="start-page-favorites" aria-live="polite">
                    <div class="start-page-section-title">收藏网站</div>
                    <div class="start-page-shortcuts">
                        <div class="start-page-favorites-loading">正在加载收藏…</div>
                    </div>
                </div>
            </div>
        `;

        this.startStartPageClock();

        const startSearch = contentContainer.querySelector('#start-page-search');
        startSearch?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.navigate(startSearch.value);
            }
        });
        if (window.SearchHistory && startSearch) {
            SearchHistory.bindPopover(startSearch, {
                anchor: startSearch.closest('.start-page-search'),
                className: 'browser-search-history start-page-search-history',
                minWidth: 360,
                onSelect: query => this.navigate(query)
            });
        }
        this.renderStartPageFavorites();

        this.renderTabs();
        this.updateAddressBar();
    },

    startStartPageClock() {
        clearTimeout(this._startPageClockTimer);

        const update = () => {
            const clock = this.container?.querySelector('.start-page-time');
            if (!clock) {
                this._startPageClockTimer = null;
                return;
            }

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            clock.textContent = `${hours}:${minutes}`;
            clock.dateTime = `${hours}:${minutes}`;

            const delayToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
            this._startPageClockTimer = setTimeout(update, delayToNextMinute + 20);
        };

        update();
    },

    stopStartPageClock() {
        clearTimeout(this._startPageClockTimer);
        this._startPageClockTimer = null;
    },

    async renderStartPageFavorites() {
        const contentContainer = this.container?.querySelector('#browser-content');
        const grid = contentContainer?.querySelector('.start-page-shortcuts');
        if (!grid) return;

        const sites = this.getFavorites();

        if (sites.length === 0) {
            grid.innerHTML = `
                <div class="start-page-favorites-empty">还没有收藏，点击星标添加</div>
                <button class="shortcut-item add-favorite-site" type="button" title="添加收藏网站">
                    <span class="shortcut-icon"><img src="Theme/Icon/Symbol_icon/stroke/Add.svg" alt=""></span>
                    <span class="shortcut-name">添加收藏网站</span>
                </button>`;
            grid.querySelector('.add-favorite-site')?.addEventListener('click', () => {
                const url = prompt('请输入网址：');
                if (url) {
                    const title = prompt('请输入网站名称：') || url;
                    this.addFavorite(url, title);
                    this.renderStartPageFavorites();
                }
            });
            return;
        }

        grid.innerHTML = sites.map((site, index) => `
            <button class="shortcut-item" type="button" data-site-index="${index}" title="${this.escapeHtml(site.title || site.url)}">
                <span class="shortcut-icon">
                    <span class="shortcut-letter">${this.escapeHtml((site.title || site.url || '?').trim().slice(0, 1).toUpperCase())}</span>
                </span>
                <span class="shortcut-name">${this.escapeHtml(site.title || site.url)}</span>
            </button>
        `).join('') + `
            <button class="shortcut-item add-favorite-site" type="button" title="添加收藏网站">
                <span class="shortcut-icon"><img src="Theme/Icon/Symbol_icon/stroke/Add.svg" alt=""></span>
                <span class="shortcut-name">添加</span>
            </button>`;

        grid.querySelectorAll('.shortcut-item[data-site-index]').forEach(button => {
            const site = sites[Number(button.dataset.siteIndex)];
            button.addEventListener('click', () => site && this.navigate(site.url));
            button.addEventListener('contextmenu', event => {
                event.preventDefault();
                event.stopPropagation();
                if (site) this.showFavoriteContextMenu(site, event.clientX, event.clientY);
            });
        });
        grid.querySelector('.add-favorite-site')?.addEventListener('click', () => {
            const url = prompt('请输入网址：');
            if (url) {
                const title = prompt('请输入网站名称：') || url;
                this.addFavorite(url, title);
                this.renderStartPageFavorites();
            }
        });
    },

    showFavoriteContextMenu(site, x, y) {
        this._favoriteContextMenu?.remove();
        if (!window.FluentUI?.ContextMenu) return;
        const menu = FluentUI.ContextMenu({
            className: 'browser-favorite-context-menu',
            items: [{
                label: '删除收藏',
                icon: 'Trash',
                action: 'remove',
                onClick: () => {
                    this.removeFavorite(site.url);
                    menu.remove();
                    if (this._favoriteContextMenu === menu) this._favoriteContextMenu = null;
                    this.renderStartPageFavorites();
                }
            }]
        });
        document.body.appendChild(menu);
        menu.show(x, y);
        this._favoriteContextMenu = menu;
        const dismiss = event => {
            if (!menu.contains(event.target)) {
                menu.remove();
                if (this._favoriteContextMenu === menu) this._favoriteContextMenu = null;
            }
        };
        setTimeout(() => document.addEventListener('pointerdown', dismiss, { once: true }), 0);
    },

    renderSearchResultsPage(query) {
        const contentContainer = this.container.querySelector('#browser-content');
        const escapedQuery = this.escapeHtml(query);
        const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

        contentContainer.innerHTML = `
            <div class="browser-search-results-page">
                <div class="browser-search-results-hero">
                    <span class="browser-search-results-badge">Bing</span>
                    <h2>${escapedQuery}</h2>
                    <p>Search opens in Bing by default.</p>
                </div>
                <div class="browser-search-results-grid">
                    <a class="browser-search-card" href="${bingUrl}" data-open-in-tab="true" rel="noopener noreferrer">
                        <strong>Bing Search</strong>
                        <span>${escapedQuery}</span>
                    </a>
                </div>
            </div>
        `;

        contentContainer.querySelectorAll('[data-open-in-tab="true"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                this.createNewTab(link.href);
            });
        });
    },

    attachIframeLinkInterception(iframe) {
        let iframeDoc;
        let iframeWindow;

        try {
            iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeWindow = iframe.contentWindow;
        } catch (error) {
            return;
        }

        if (!iframeDoc || !iframeWindow || iframeDoc.__fluentBrowserLinksBound) return;
        iframeDoc.__fluentBrowserLinksBound = true;

        iframeDoc.querySelectorAll('a[href]').forEach((link) => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });

        iframeDoc.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link) return;

            const rawHref = link.getAttribute('href');
            if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;

            let nextUrl = rawHref;
            try {
                nextUrl = new URL(rawHref, iframeWindow.location.href).href;
            } catch (error) {}

            const hasDownload = link.hasAttribute('download');
            const downloadFilename = link.getAttribute('download');

            if (hasDownload || this.isDownloadableFile(nextUrl)) {
                event.preventDefault();
                event.stopPropagation();
                this.handleDownloadLink(nextUrl, downloadFilename || undefined);
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.createNewTab(nextUrl);
        }, true);

        try {
            iframeWindow.open = (url) => {
                if (!url) return null;
                let nextUrl = url;
                try {
                    nextUrl = new URL(url, iframeWindow.location.href).href;
                } catch (error) {}
                this.createNewTab(nextUrl);
                return null;
            };
        } catch (error) {}
    },

    renderContent() {
        const tab = this.getActiveTab();
        if (!tab) return;

        const contentContainer = this.container.querySelector('#browser-content');
        if (!contentContainer) return;

        if (tab.url === 'about:blank') {
            this.showStartPage();
            return;
        }

        this.stopStartPageClock();

        if (this.isSearchResultsUrl(tab.url)) {
            this.renderSearchResultsPage(this.getSearchQueryFromUrl(tab.url));
            return;
        }

        const currentUrl = tab.url;
        const isHttp = currentUrl.startsWith('http://');

        contentContainer.innerHTML = `
            <iframe
                src="${currentUrl}"
                class="browser-iframe"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            ></iframe>
        `;

        const iframe = contentContainer.querySelector('iframe');
        let hasLoaded = false;

        iframe?.addEventListener('load', () => {
            hasLoaded = true;
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc?.title) {
                    tab.title = iframeDoc.title;
                    this.addHistoryItem(tab.url, tab.title);
                    this.renderTabs();
                }
                this.attachIframeLinkInterception(iframe);
            } catch (error) {}
        });

        iframe?.addEventListener('error', () => {
            if (isHttp && !hasLoaded) {
                const httpsUrl = currentUrl.replace('http://', 'https://');
                tab.url = httpsUrl;
                tab.history[tab.historyIndex] = httpsUrl;
                this.updateAddressBar();
                iframe.src = httpsUrl;
            }
        });

        setTimeout(() => {
            if (!hasLoaded && isHttp) {
                const httpsUrl = currentUrl.replace('http://', 'https://');
                tab.url = httpsUrl;
                tab.history[tab.historyIndex] = httpsUrl;
                this.updateAddressBar();
                if (iframe && iframe.src === currentUrl) {
                    iframe.src = httpsUrl;
                }
            }
        }, 8000);
    },

    goBack() {
        const tab = this.getActiveTab();
        if (!tab || tab.historyIndex <= 0) return;

        tab.historyIndex -= 1;
        tab.url = tab.history[tab.historyIndex];
        if (this.isSearchResultsUrl(tab.url)) {
            tab.title = this.getSearchResultsTitle(this.getSearchQueryFromUrl(tab.url));
        }
        this.renderTabs();
        this.renderContent();
        this.updateNavButtons();
        this.updateAddressBar();
    },

    goForward() {
        const tab = this.getActiveTab();
        if (!tab || tab.historyIndex >= tab.history.length - 1) return;

        tab.historyIndex += 1;
        tab.url = tab.history[tab.historyIndex];
        if (this.isSearchResultsUrl(tab.url)) {
            tab.title = this.getSearchResultsTitle(this.getSearchQueryFromUrl(tab.url));
        }
        this.renderTabs();
        this.renderContent();
        this.updateNavButtons();
        this.updateAddressBar();
    },

    refresh() {
        const tab = this.getActiveTab();
        if (!tab) return;

        if (tab.url === 'about:blank') {
            this.showStartPage();
        } else {
            this.renderContent();
        }
    },

    goHome() {
        this.showStartPage();
    },

    updateNavButtons() {
        const tab = this.getActiveTab();
        const backBtn = this.container.querySelector('#browser-back');
        const forwardBtn = this.container.querySelector('#browser-forward');

        if (!backBtn || !forwardBtn) return;

        if (!tab) {
            backBtn.disabled = true;
            forwardBtn.disabled = true;
            return;
        }

        backBtn.disabled = tab.historyIndex <= 0;
        forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
    },

    updateAddressBar() {
        const tab = this.getActiveTab();
        const addressBar = this.container.querySelector('#browser-address');
        this.updateBookmarkButton();
        if (!addressBar) return;

        if (!tab || tab.url === 'about:blank') {
            addressBar.value = '';
            return;
        }

        if (this.isSearchResultsUrl(tab.url)) {
            addressBar.value = this.getSearchQueryFromUrl(tab.url);
            return;
        }

        addressBar.value = tab.url;
    },

    addStyles() {
        if (document.getElementById('browser-app-styles')) return;

        const style = document.createElement('style');
        style.id = 'browser-app-styles';
        style.textContent = `
            .browser-app {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-secondary);
            }

            .browser-header {
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
                position: relative;
            }

            .browser-navbar {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px 12px;
            }

            .browser-nav-controls {
                display: flex;
                gap: 4px;
            }

            .browser-nav-btn,
            .browser-tool-btn {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: transparent;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background var(--transition-fast);
            }

            .browser-nav-btn:hover:not(:disabled),
            .browser-tool-btn:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            .dark-mode .browser-nav-btn:hover:not(:disabled),
            .dark-mode .browser-tool-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .browser-nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }

            .browser-nav-btn img,
            .browser-tool-btn img {
                width: 18px;
                height: 18px;
            }

            .browser-address-bar-wrapper {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 4px;
                background: var(--bg-tertiary);
                border-radius: 20px;
                padding: 0 8px;
                height: 40px;
                min-width: 0;
            }

            .browser-address-bar-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: transparent;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: background var(--transition-fast);
            }

            .browser-address-bar-btn:hover {
                background: rgba(0, 0, 0, 0.06);
            }

            .dark-mode .browser-address-bar-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .browser-address-bar-btn img {
                width: 16px;
                height: 16px;
                opacity: 0.7;
            }

            .browser-bookmark-btn.bookmarked img {
                opacity: 1;
            }

            .browser-address-bar {
                flex: 1;
                display: flex;
                align-items: center;
                min-width: 0;
                background: transparent;
                padding: 0;
                height: auto;
                border-radius: 0;
            }

            .address-bar-icon {
                width: 16px;
                height: 16px;
                opacity: 0.5;
            }

            #browser-address {
                flex: 1;
                min-width: 0;
                background: transparent;
                border: none;
                outline: none;
                font-size: 14px;
                color: var(--text-primary);
                padding: 0;
            }

            #browser-address::placeholder {
                color: var(--text-secondary);
            }

            .browser-tools {
                display: flex;
                gap: 4px;
            }

            .browser-popup-panel {
                position: absolute;
                top: 100%;
                left: 12px;
                right: 12px;
                max-height: 400px;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                z-index: 100;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(-8px);
                transition: opacity 0.15s ease, transform 0.15s ease;
            }

            .browser-popup-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                border-bottom: 1px solid var(--border-color);
                flex-shrink: 0;
            }

            .browser-popup-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .browser-popup-close {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: transparent;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: var(--text-secondary);
                line-height: 1;
            }

            .browser-popup-close:hover {
                background: rgba(0, 0, 0, 0.06);
            }

            .dark-mode .browser-popup-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .browser-popup-content {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
            }

            .browser-popup-empty {
                padding: 32px 16px;
                text-align: center;
                color: var(--text-secondary);
                font-size: 13px;
            }

            .browser-popup-footer {
                padding: 12px 16px;
                border-top: 1px solid var(--border-color);
                flex-shrink: 0;
            }

            .browser-popup-clear-btn,
            .browser-popup-action-btn {
                width: 100%;
                padding: 8px 12px;
                border-radius: 8px;
                border: none;
                background: rgba(0, 0, 0, 0.05);
                color: var(--text-primary);
                font-size: 13px;
                cursor: pointer;
                transition: background var(--transition-fast);
            }

            .browser-popup-clear-btn:hover,
            .browser-popup-action-btn:hover {
                background: rgba(0, 0, 0, 0.08);
            }

            .dark-mode .browser-popup-clear-btn,
            .dark-mode .browser-popup-action-btn {
                background: rgba(255, 255, 255, 0.08);
            }

            .dark-mode .browser-popup-clear-btn:hover,
            .dark-mode .browser-popup-action-btn:hover {
                background: rgba(255, 255, 255, 0.12);
            }

            .browser-history-date-group {
                padding: 4px 0;
            }

            .browser-history-date {
                padding: 8px 16px 4px;
                font-size: 12px;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .browser-history-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 16px;
                cursor: pointer;
                transition: background var(--transition-fast);
            }

            .browser-history-item:hover {
                background: rgba(0, 0, 0, 0.04);
            }

            .dark-mode .browser-history-item:hover {
                background: rgba(255, 255, 255, 0.06);
            }

            .browser-history-item-title {
                flex: 1;
                font-size: 13px;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .browser-history-item-url {
                font-size: 12px;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
            }

            .browser-history-item-delete {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: transparent;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                opacity: 0;
                transition: opacity var(--transition-fast), background var(--transition-fast);
            }

            .browser-history-item:hover .browser-history-item-delete {
                opacity: 1;
            }

            .browser-history-item-delete:hover {
                background: rgba(0, 0, 0, 0.06);
            }

            .dark-mode .browser-history-item-delete:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .browser-history-item-delete img {
                width: 14px;
                height: 14px;
                opacity: 0.6;
            }

            .browser-page-info-content {
                padding: 12px 16px;
            }

            .browser-info-row {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 16px;
            }

            .browser-info-row:last-child {
                margin-bottom: 0;
            }

            .browser-info-label {
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
            }

            .browser-info-value {
                font-size: 13px;
                color: var(--text-primary);
                word-break: break-all;
            }

            .browser-info-url {
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                padding: 8px 10px;
                background: var(--bg-tertiary);
                border-radius: 6px;
            }

            .browser-download-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                transition: background var(--transition-fast);
            }

            .browser-download-item:hover {
                background: rgba(0, 0, 0, 0.04);
            }

            .dark-mode .browser-download-item:hover {
                background: rgba(255, 255, 255, 0.06);
            }

            .browser-download-item-icon {
                width: 24px;
                height: 24px;
                opacity: 0.6;
                flex-shrink: 0;
            }

            .browser-download-item-info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .browser-download-item-name {
                font-size: 13px;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .browser-download-item-time {
                font-size: 11px;
                color: var(--text-secondary);
            }

            .browser-content {
                flex: 1;
                background: var(--bg-primary);
                overflow: hidden;
                position: relative;
            }

            .browser-iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: #fff;
            }

            .window[data-app-id="browser"] .window-title-section {
                min-width: 0;
                flex: 0 0 auto;
            }

            .window[data-app-id="browser"] .window-title {
                white-space: nowrap;
            }

            .window[data-app-id="browser"] .browser-titlebar-tabs-host {
                flex: 1;
                min-width: 0;
                margin: 0 12px 0 18px;
                display: flex;
                align-items: center;
            }

            .window[data-app-id="browser"] .browser-titlebar-tabs {
                width: 100%;
                min-width: 0;
                gap: 6px;
                background: transparent;
                border: none;
                box-shadow: none;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
            }

            .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tabbar-tabs {
                min-width: 0;
            }

            .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab {
                min-width: 120px;
                max-width: 220px;
                border-radius: 10px;
                background: rgba(0, 0, 0, 0.04);
            }

            .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab.active {
                background: rgba(255, 255, 255, 0.72);
                box-shadow: 0 1px 0 rgba(255, 255, 255, 0.28) inset;
            }

            .dark-mode .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab {
                background: rgba(255, 255, 255, 0.06);
            }

            .dark-mode .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab.active {
                background: rgba(255, 255, 255, 0.12);
                box-shadow: none;
            }

            .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab-close,
            .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tabbar-add {
                opacity: 1;
            }

            body.fluent-v2 .window[data-app-id="browser"] .window-titlebar {
                margin: 0;
                padding: 12px 14px;
                border: 1px solid rgba(0, 0, 0, 0.06);
                border-bottom: none;
                border-radius: var(--browser-float-radius) var(--browser-float-radius) 0 0;
                background: rgba(249, 249, 249, 0.78) !important;
                backdrop-filter: blur(28px) saturate(180%);
                -webkit-backdrop-filter: blur(28px) saturate(180%);
                box-shadow: none;
            }

            body.fluent-v2.dark-mode .window[data-app-id="browser"] .window-titlebar {
                border-color: rgba(255, 255, 255, 0.08);
                background: rgba(34, 34, 34, 0.78) !important;
            }

            body.fluent-v2 .window[data-app-id="browser"] .window-content {
                background: transparent;
            }

            body.fluent-v2 .window[data-app-id="browser"] {
                --browser-float-radius: var(--radius-lg, 16px);
                border-radius: var(--browser-float-radius);
                overflow: hidden;
            }

            body.fluent-v2 .window[data-app-id="browser"].maximized,
            body.fluent-v2 .window[data-app-id="browser"].maximized .window-titlebar,
            body.fluent-v2 .window[data-app-id="browser"].maximized .browser-app,
            body.fluent-v2 .window[data-app-id="browser"].maximized .browser-content {
                border-radius: 0 !important;
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-app {
                border-radius: 0 0 var(--browser-float-radius) var(--browser-float-radius);
                overflow: hidden;
                background: rgba(249, 249, 249, 0.78);
            }

            body.fluent-v2.dark-mode .window[data-app-id="browser"] .browser-app {
                background: rgba(34, 34, 34, 0.78);
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-header {
                margin: 0;
                border: 1px solid rgba(0, 0, 0, 0.06);
                border-top: none;
                border-radius: 0;
                background: rgba(249, 249, 249, 0.78) !important;
                backdrop-filter: blur(28px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
                box-shadow: none;
            }

            body.fluent-v2.dark-mode .window[data-app-id="browser"] .browser-header {
                border-color: rgba(255, 255, 255, 0.08) !important;
                background: rgba(34, 34, 34, 0.78) !important;
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-titlebar-tabs-host {
                margin-left: 16px;
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.04);
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab:hover {
                background: rgba(255, 255, 255, 0.14);
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab.active {
                background: rgba(255, 255, 255, 0.16) !important;
                border-color: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tabbar-add,
            body.fluent-v2 .window[data-app-id="browser"] .browser-nav-btn,
            body.fluent-v2 .window[data-app-id="browser"] .browser-tool-btn {
                border-radius: 999px;
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-address-bar-wrapper {
                background: rgba(255, 255, 255, 0.08) !important;
                border: 1px solid rgba(255, 255, 255, 0.06) !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-address-bar {
                background: transparent !important;
                border: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }

            body.fluent-v2 .window[data-app-id="browser"] .browser-content {
                background: transparent;
                border-radius: 0 0 var(--browser-float-radius) var(--browser-float-radius);
                overflow: hidden;
            }

            .browser-search-results-page {
                height: 100%;
                padding: 32px;
                overflow-y: auto;
                background:
                    radial-gradient(circle at top left, rgba(0, 120, 212, 0.12), transparent 32%),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.76));
            }

            .dark-mode .browser-search-results-page {
                background:
                    radial-gradient(circle at top left, rgba(0, 120, 212, 0.2), transparent 32%),
                    linear-gradient(180deg, rgba(28, 28, 30, 0.96), rgba(28, 28, 30, 0.88));
            }

            .browser-search-results-hero {
                max-width: 760px;
                margin: 0 auto 28px;
            }

            .browser-search-results-badge {
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 600;
                background: rgba(0, 120, 212, 0.12);
                color: var(--accent);
            }

            .browser-search-results-hero h2 {
                margin: 16px 0 10px;
                font-size: 34px;
                line-height: 1.1;
                color: var(--text-primary);
            }

            .browser-search-results-hero p {
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-secondary);
            }

            .browser-search-results-grid {
                max-width: 760px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 14px;
            }

            .browser-search-card {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 18px;
                border-radius: 18px;
                text-decoration: none;
                color: inherit;
                background: rgba(255, 255, 255, 0.68);
                border: 1px solid rgba(255, 255, 255, 0.55);
                box-shadow: 0 18px 40px rgba(16, 24, 40, 0.08);
                transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
            }

            .browser-search-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 24px 48px rgba(16, 24, 40, 0.14);
                background: rgba(255, 255, 255, 0.82);
            }

            .dark-mode .browser-search-card {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(255, 255, 255, 0.08);
                box-shadow: none;
            }

            .dark-mode .browser-search-card:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .browser-search-card strong {
                font-size: 16px;
                color: var(--text-primary);
            }

            .browser-search-card span {
                font-size: 13px;
                color: var(--text-secondary);
                word-break: break-word;
            }

            .browser-start-page {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 80px 20px 20px;
                overflow-y: auto;
            }

            .start-page-time {
                display: block;
                margin-bottom: 40px;
                color: var(--text-primary);
                font-size: 48px;
                font-weight: 600;
                line-height: 1;
                letter-spacing: -1px;
                font-variant-numeric: tabular-nums;
            }

            .start-page-search {
                box-sizing: border-box;
                flex: 0 0 48px;
                width: 100%;
                max-width: 600px;
                min-height: 48px;
                max-height: 48px;
                display: flex;
                align-items: center;
                gap: 12px;
                background: var(--bg-tertiary);
                border-radius: 24px;
                padding: 0 24px;
                height: 48px;
                margin-bottom: 34px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .start-page-search .search-icon {
                width: 20px;
                height: 20px;
                opacity: 0.5;
            }

            #start-page-search {
                flex: 1;
                min-width: 0;
                height: 100%;
                padding: 0;
                background: transparent;
                border: none;
                outline: none;
                font-size: 16px;
                color: var(--text-primary);
            }

            #start-page-search::placeholder {
                color: var(--text-secondary);
            }

            .start-page-shortcuts {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
                gap: 14px;
                max-width: 800px;
                width: 100%;
            }

            .start-page-favorites {
                width: 100%;
                max-width: 800px;
            }

            .start-page-section-title {
                margin: 0 4px 12px;
                color: var(--text-secondary);
                font-size: 13px;
                font-weight: 600;
            }

            .start-page-favorites-loading,
            .start-page-favorites-empty {
                grid-column: 1 / -1;
                padding: 24px;
                color: var(--text-secondary);
                text-align: center;
                font-size: 13px;
            }

            .shortcut-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 12px 8px;
                border-radius: 12px;
                border: 0;
                background: transparent;
                transition: background var(--transition-fast);
            }

            .shortcut-item:hover {
                background: rgba(0, 0, 0, 0.03);
            }

            .add-favorite-site .shortcut-icon {
                border: 1px dashed rgba(var(--accent-rgb, 0, 120, 212), 0.46);
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.08);
            }

            .add-favorite-site .shortcut-icon img {
                width: 24px;
                height: 24px;
                opacity: 0.72;
            }

            .dark-mode .shortcut-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .shortcut-icon {
                position: relative;
                width: 60px;
                height: 60px;
                border-radius: 12px;
                background: var(--bg-tertiary);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .shortcut-icon img {
                position: relative;
                z-index: 1;
                width: 38px;
                height: 38px;
                object-fit: contain;
            }

            .shortcut-letter {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--accent);
                font-size: 22px;
                font-weight: 700;
            }

            .shortcut-name {
                width: 100%;
                font-size: 13px;
                color: var(--text-primary);
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .browser-app *::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }

            .browser-app *::-webkit-scrollbar-track {
                background: transparent;
            }

            .browser-app *::-webkit-scrollbar-thumb {
                background: var(--text-tertiary);
                border-radius: 3px;
            }

            .browser-app *::-webkit-scrollbar-thumb:hover {
                background: var(--text-secondary);
            }

            .browser-app * {
                scrollbar-width: thin;
                scrollbar-color: var(--text-tertiary) transparent;
            }

            @media (max-width: 900px) {
                .window[data-app-id="browser"] .window-titlebar {
                    align-items: flex-start;
                    gap: 10px;
                }

                .window[data-app-id="browser"] .browser-titlebar-tabs-host {
                    margin: 0 0 0 8px;
                }

                .window[data-app-id="browser"] .browser-titlebar-tabs .fluent-tab {
                    min-width: 96px;
                }

                .browser-navbar {
                    flex-wrap: wrap;
                }

                .browser-tools {
                    margin-left: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

if (typeof window !== 'undefined') {
    window.BrowserApp = BrowserApp;
}
