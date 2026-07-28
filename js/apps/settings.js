/**
 * 设置应用 - 使用 FluentUI 组件库
 */
const SettingsApp = {
    handlesInitialOpenData: true,
    windowId: null,
    container: null,
    frame: null,
    currentPage: 'overview',
    _aboutDevTapCount: 0,
    _developerModeVisible: false,
    // 与当前仓库 git log 同步；同一天的提交共同组成一个日期版本。
    aboutChangelog: [
        { date: '2026-07-27', version: '26.4', commits: [
            { hash: 'v26.4', title: 'NyouOS 26.4 发布' },
            { hash: 'u1', title: '新增 NyouOS 更新功能（设置内一键升级）' },
            { hash: 'u2', title: '浏览器全面增强：历史记录、收藏、下载、恶意文件提示' },
            { hash: 'u3', title: '新增 Scratch 编辑器（Turbowarp）' },
            { hash: 'u4', title: '新增彩蛋：移动端 SIM 卡提示、账号页版权连点彩蛋' }
        ] },
        { date: '2026-07-26', version: '26.3', commits: [
            { hash: 'v26.3', title: 'NyouOS 26.3 发布' },
            { hash: 't1', title: 'OOBE 新增强制登录/注册步骤（Supabase）' },
            { hash: 't2', title: '新增隐私设置、设备名称步骤' },
            { hash: 't3', title: '邮箱脱敏显示、头像本地保存' },
            { hash: 't4', title: '官网版权更新为 2025-2026' }
        ] },
        { date: '2026-07-25', version: '26.2', commits: [
            { hash: 'a1b2c3d', title: 'NyouOS 26.2 正式版发布' },
            { hash: 'e4f5g6h', title: '新增锁屏5个可爱小柱子角色' },
            { hash: 'i7j8k9l', title: 'SurfAI 新增跑马灯思考动画' },
            { hash: 'm0n1o2p', title: '新增系统截图功能 (Ctrl+Shift+S)' },
            { hash: 'q3r4s5t', title: '优化系统性能和稳定性' }
        ] },
        { date: '2026-07-16', version: '26.0', commits: [
            { hash: '45428a5', title: '完成开发' },
            { hash: 'fd9d197', title: '基本完成模糊程度+云母材质效果切换' },
            { hash: '544ea15', title: '更换图标并优化UI界面' }
        ] },
        { date: '2026-06-06', version: '2.0.260606', baseline: true, commits: [] }
    ],

    _isMounted() {
        return !!(this.container && this.container.isConnected);
    },

    maskEmail(email) {
        if (!email || typeof email !== 'string') return email;
        const atIndex = email.indexOf('@');
        if (atIndex <= 0) return email;
        const local = email.slice(0, atIndex);
        const domain = email.slice(atIndex);
        if (local.length <= 4) return local[0] + '*'.repeat(Math.max(0, local.length - 2)) + local.slice(-1) + domain;
        return local.slice(0, 2) + '*'.repeat(local.length - 4) + local.slice(-2) + domain;
    },

    getPages() {
        const pages = [
            { id: 'overview', label: 'settings.overview', icon: 'Home', desc: t('settings.overview-desc') },
            { id: 'user', label: 'settings.user', icon: 'User Circle', desc: t('settings.user-desc') },
            { id: 'network', label: 'settings.network', icon: 'Globe', desc: t('settings.network-desc') },
            { id: 'personalization', label: 'settings.personalization', icon: 'Color Picker', desc: t('settings.personalization-desc') },
            { id: 'applications', label: 'settings.applications', icon: 'Inbox Download', desc: t('settings.applications-desc') },
            { id: 'multitask', label: 'settings.multitask', icon: 'Dashboard Check', desc: t('settings.multitask-desc') },
            { id: 'time-language', label: 'settings.time-language', icon: 'Clock', desc: t('settings.time-language-desc') },
            { id: 'privacy', label: 'settings.privacy', icon: 'Lock', desc: t('settings.privacy-desc') },
            { id: 'Surf', label: 'settings.Surf', icon: 'Robot Happy', desc: t('settings.Surf-desc') },
            { id: 'update', label: 'settings.update', icon: 'Update Restore', desc: t('settings.update-desc') },
            { id: 'lab', label: 'settings.lab', icon: 'Tube', desc: t('settings.lab-desc') },
            { id: 'about', label: 'settings.about', icon: 'Information Circle', desc: t('settings.about-desc') }
        ];
        if (this._developerModeVisible === true) {
            pages.push({
                id: 'developer',
                label: 'settings.developer',
                icon: 'Tube',
                desc: t('settings.developer-desc')
            });
        }
        return pages;
    },
    
    // 正在修复中的应用
    repairingApps: [],
    _SurfModeAnimating: false,
    _pendingSurfCustomEnter: false,
    _SurfCustomRiskAcknowledgedForCsp: false,
    _avatarThumbCache: null,
    _avatarThumbBuildPromise: null,
    _avatarThumbStorageKey: 'fluentos.avatarThumbs.v1',
    _avatarPlaceholderSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    
    // 获取应用包大小（字节）。静态文件数据由构建期清单提供。
    getAppSize(appId, isPWA = false) {
        const app = typeof Desktop !== 'undefined' ? Desktop.apps.find(item => item.id === appId) : null;
        if (!app || !globalThis.FluentOSStorage) return 0;
        return FluentOSStorage.getAppSize({ ...app, isPWA: isPWA === true || app.isPWA === true });
    },

    init(windowId, initialData = null) {
        this.windowId = windowId || `window-${Date.now()}`;
        this.container = document.getElementById(`${this.windowId}-content`);
        // 默认打开概览页
        this.currentPage = 'overview';
        this.currentAppDetail = null;
        this._aboutDevTapCount = 0;
        this._developerModeVisible = false;

        // 首次创建窗口时先消费目标页，再进行首帧渲染，避免先显示概览页后
        // 异步导航与 FluentWindow 的初始化渲染互相覆盖。
        let initialDataHandled = false;
        if (initialData && initialData.page === 'app-detail' && initialData.appId) {
            const app = this.getAppDetailData(initialData.appId);
            if (app) {
                this.currentAppDetail = app;
                this.currentPage = 'app-detail';
                initialDataHandled = true;
            }
        } else if (initialData && initialData.page) {
            const page = initialData.page;
            const hasPage = this.getPages().some(item => item.id === page);
            if (hasPage || page === 'personalization-advanced' || page === 'about-changelog') {
                this.currentPage = page;
                initialDataHandled = true;
            }
        }
        this.render();
        
        State.on('languageChange', () => {
            if (this._isMounted()) this.render();
        }, { key: 'SettingsApp.languageChange' });

        State.on('settingsChange', () => {
            if (this._isMounted() && this.currentPage === 'applications') {
                this.render();
            }
        }, { key: 'SettingsApp.settingsChange' });

        State.on('appUsageChange', () => {
            if (this._isMounted() && this.currentPage === 'applications') {
                this.render();
            }
        }, { key: 'SettingsApp.appUsageChange' });

        if (this._storageChangeHandler) window.removeEventListener('fluentos-storage-change', this._storageChangeHandler);
        this._storageChangeHandler = () => {
            if (!this._isMounted()) return;
            if (this.currentPage === 'applications' || this.currentPage === 'app-detail') this.refreshCurrentPage();
        };
        window.addEventListener('fluentos-storage-change', this._storageChangeHandler);

        State.on('SurfApiKeyReady', () => {
            if (this._isMounted() && this.currentPage === 'Surf') {
                this.render();
            }
        }, { key: 'SettingsApp.SurfApiKeyReady' });

        return initialDataHandled;
    },

    openData(data) {
        if (!data || !data.page) return;
        if (data.page !== 'app-detail') {
            const hasPage = this.getPages().some(page => page.id === data.page);
            if (hasPage || data.page === 'personalization-advanced' || data.page === 'about-changelog') {
                this.currentAppDetail = null;
                this.navigateToPage(data.page);
            }
            return;
        }
        if (!data.appId) return;
        const app = this.getAppDetailData(data.appId);
        if (!app) return;
        this.currentAppDetail = app;
        this.navigateToPage('app-detail');
    },

    navigateToPage(pageId, options = {}) {
        if (!pageId) return;
        const previousPage = this.currentPage;
        this.currentPage = pageId;
        if (this.frame && typeof this.frame.navigate === 'function' && previousPage !== pageId) {
            this.frame.navigate(pageId);
        } else {
            this.render();
        }
        if (typeof options.after === 'function') {
            setTimeout(options.after, options.delay || 180);
        }
    },

    refreshCurrentPage(options = {}) {
        if (!this.frame || typeof this.frame.refresh !== 'function') {
            this.render();
            return;
        }

        const preserveScroll = options.preserveScroll !== false;
        const card = this.frame.cardEl;
        const scrollTop = preserveScroll && card ? card.scrollTop : 0;
        this.frame.refresh();

        if (!preserveScroll || !card) return;
        const restore = () => {
            if (!card.isConnected) return;
            const maxScroll = Math.max(0, card.scrollHeight - card.clientHeight);
            card.scrollTop = Math.min(scrollTop, maxScroll);
        };
        requestAnimationFrame(() => {
            restore();
            requestAnimationFrame(restore);
        });
        setTimeout(restore, 180);
    },

    getAppDetailData(appId) {
        const desktopApp = typeof Desktop !== 'undefined'
            ? Desktop.apps.find(app => app.id === appId)
            : null;
        if (!desktopApp) return null;
        const isPWA = desktopApp.isPWA === true;
        return {
            id: desktopApp.id,
            name: Desktop.getAppName(desktopApp),
            icon: desktopApp.icon,
            isPWA,
            sizeBytes: this.getAppSize(desktopApp.id, isPWA),
            desc: isPWA
                ? ((typeof PWALoader !== 'undefined' && PWALoader.apps[desktopApp.id]?.description) || t('settings.app-desc-default'))
                : this.getAppDescription(desktopApp.id)
        };
    },

    beforeClose() {
        if (this._storageChangeHandler) {
            window.removeEventListener('fluentos-storage-change', this._storageChangeHandler);
            this._storageChangeHandler = null;
        }
        if (this.frame && typeof this.frame.destroy === 'function') {
            this.frame.destroy();
            this.frame = null;
        }
        this.container = null;
        this.windowId = null;
        return true;
    },

    render() {
        if (!this.container) return;
        this.container.style.overflow = 'hidden';
        this.container.innerHTML = '';
        if (this.currentPage !== 'developer' && this._developerModeVisible) {
            this._developerModeVisible = false;
            this._aboutDevTapCount = 0;
        }

        if (this.frame && typeof this.frame.destroy === 'function') {
            this.frame.destroy();
            this.frame = null;
        }

        if (typeof FluentWindow === 'undefined' || typeof FluentWindow.mount !== 'function') {
            console.error('[SettingsApp] FluentWindow framework is not loaded');
            return;
        }

        this.frame = FluentWindow.mount({
            container: this.container,
            items: this.getPages().map(p => ({ id: p.id, label: t(p.label), icon: p.icon })),
            activeId: this.currentPage,
            preserveScrollPositions: true,
            getScrollKey: (pageId) => {
                if (pageId === 'app-detail') {
                    const appId = this.currentAppDetail && this.currentAppDetail.id;
                    return `app-detail:${appId || 'unknown'}`;
                }
                return pageId || 'overview';
            },
            onNavigate: (pageId, pageEl) => {
                // FluentWindow reuses the same page element. Clear secondary-page
                // exit states before rendering so their fill-mode cannot keep the
                // next page transparent.
                pageEl.classList.remove(
                    'settings-material-page',
                    'settings-about-changelog',
                    'slide-out'
                );
                if (this.currentPage === 'developer' && pageId !== 'developer') {
                    this._developerModeVisible = false;
                    this._aboutDevTapCount = 0;
                }
                this.currentPage = pageId;
                pageEl.classList.add('settings-content', 'settings-fw-content');
                pageEl.id = 'settings-content';
                pageEl.dataset.pageId = this.currentPage;
                if (this.currentPage === 'app-detail' && this.currentAppDetail && this.currentAppDetail.id) {
                    pageEl.dataset.detailAppId = this.currentAppDetail.id;
                } else {
                    delete pageEl.dataset.detailAppId;
                }

                this.renderPage(pageEl);
                pageEl.classList.add('fw-page', 'settings-content', 'settings-fw-content');
                this.addStyles();
            }
        });
    },

    addStyles() {
        if (document.getElementById('settings-app-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'settings-app-styles';
        style.textContent = `
            .settings-app { display: flex; height: 100%; min-height: 0; overflow: hidden; }
            .settings-content { flex: 1; overflow-y: auto; padding: 32px; min-height: 100%; box-sizing: border-box; }
            .settings-section { margin-bottom: 32px; }
            .settings-section-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
            .settings-appearance-section > .fluent-setting-item,
            .settings-appearance-section > .settings-accent-panel {
                margin: 0 0 10px 0;
            }
            .settings-appearance-section > .fluent-setting-item:last-child,
            .settings-appearance-section > .settings-accent-panel:last-child {
                margin-bottom: 0;
            }
            .settings-appearance-section > .fluent-setting-item,
            .settings-appearance-section .settings-accent-entry {
                min-height: 80px;
                padding: 16px 20px;
                box-sizing: border-box;
            }
            .wallpaper-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 200px)); gap: 12px; justify-content: start; transition: all 0.3s ease; }
            .wallpaper-item { width: 200px; height: 112px; border-radius: var(--radius-md); overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all 0.3s ease; position: relative; }
            .wallpaper-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
            .wallpaper-item:hover img { transform: scale(1.05); }
            .wallpaper-item.selected { border-color: var(--accent); }
            .wallpaper-item.selected::after { content: '✓'; position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }

            .settings-accent-panel {
                display: flex;
                flex-direction: column;
                margin: 12px 0 18px;
            }
            .settings-accent-entry {
                margin-bottom: 0;
            }
            .settings-accent-entry.is-expanded {
                border-bottom-left-radius: 0 !important;
                border-bottom-right-radius: 0 !important;
            }
            .settings-accent-entry-swatch {
                width: 30px;
                height: 30px;
                border-radius: 9px;
                border: 2px solid rgba(255, 255, 255, 0.72);
                background: var(--accent);
                background-color: var(--accent);
                box-shadow:
                    0 0 0 1px rgba(0, 0, 0, 0.1),
                    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
            }
            .dark-mode .settings-accent-entry-swatch {
                border-color: rgba(255, 255, 255, 0.32);
                box-shadow:
                    0 0 0 1px rgba(0, 0, 0, 0.32),
                    inset 0 0 0 1px rgba(255, 255, 255, 0.18);
            }
            .settings-accent-entry .expand-arrow {
                transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease;
            }
            .settings-accent-entry.is-expanded .expand-arrow {
                transform: rotate(90deg);
            }
            .settings-accent-expand-panel {
                overflow: hidden;
                padding: 18px 20px 22px 20px;
                transform-origin: top center;
                animation: settingsAccentExpand 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .settings-accent-panel.is-collapsing .settings-accent-expand-panel {
                animation: settingsAccentCollapse 260ms cubic-bezier(0.4, 0, 0.2, 1) both;
                pointer-events: none;
            }
            @keyframes settingsAccentExpand {
                0% { opacity: 0; max-height: 0; transform: translateY(-12px) scaleY(0.96); filter: blur(2px); }
                55% { opacity: 1; filter: blur(0); }
                100% { opacity: 1; max-height: 720px; transform: translateY(0) scaleY(1); filter: blur(0); }
            }
            @keyframes settingsAccentCollapse {
                0% { opacity: 1; max-height: 720px; transform: translateY(0) scaleY(1); filter: blur(0); }
                100% { opacity: 0; max-height: 0; transform: translateY(-10px) scaleY(0.96); filter: blur(2px); }
            }
            .settings-accent-auto-row {
                gap: 16px;
            }
            .settings-accent-group {
                margin-top: 20px;
            }
            .settings-accent-group-title {
                margin-bottom: 10px;
                font-size: 14px;
                color: var(--text-primary);
            }
            .settings-accent-row,
            .settings-accent-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                max-width: 500px;
            }
            .settings-accent-swatch {
                width: 54px;
                height: 54px;
                position: relative;
                padding: 0;
                appearance: none;
                -webkit-appearance: none;
                box-sizing: border-box;
                border: 3px solid transparent;
                border-radius: 8px;
                background: var(--swatch-color) !important;
                background-color: var(--swatch-color) !important;
                background-image: none !important;
                cursor: pointer;
                transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease, border-color 180ms ease;
            }
            .settings-accent-swatch:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
            }
            .settings-accent-swatch.selected {
                border-color: var(--accent);
                box-shadow:
                    0 0 0 1px rgba(var(--accent-rgb, 0, 120, 212), 0.2),
                    inset 0 0 0 1px rgba(255, 255, 255, 0.72);
            }
            .settings-accent-swatch.selected::after {
                content: '✓';
                position: absolute;
                top: 6px;
                right: 6px;
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: var(--accent);
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22);
                text-shadow: none;
            }
            .settings-accent-custom {
                width: 54px;
                height: 54px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                box-sizing: border-box;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-tertiary);
                cursor: pointer;
                transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease, border-color 0.16s ease, background 0.16s ease;
            }
            .settings-accent-custom:hover {
                transform: translateY(-1px);
                border-color: var(--accent);
                background: var(--accent-soft);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
            }
            .settings-accent-custom img {
                width: 24px;
                height: 24px;
                display: block;
            }
            @media (prefers-reduced-motion: reduce) {
                .settings-accent-expand-panel,
                .settings-accent-panel.is-collapsing .settings-accent-expand-panel {
                    animation: none;
                }
                .settings-accent-entry .expand-arrow,
                .settings-accent-swatch {
                    transition: none;
                }
            }
            
            /* 概览页面样式 */
            .settings-overview { padding: 24px 32px; }
            .settings-overview-header { margin-bottom: 32px; }
            .settings-overview-device { display: flex; align-items: center; gap: 20px; }
            .settings-overview-wallpaper { width: 120px; height: 80px; border-radius: var(--radius-md); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .settings-overview-wallpaper img { width: 100%; height: 100%; object-fit: cover; }
            .settings-overview-device-info h2 { margin: 0 0 4px 0; font-size: 24px; font-weight: 600; }
            .settings-overview-device-info p { margin: 0 0 8px 0; font-size: 13px; color: var(--text-secondary); }
            .settings-overview-rename { font-size: 13px; color: var(--accent); cursor: pointer; }
            .settings-overview-rename:hover { text-decoration: underline; }
            
            /* 推荐设置 */
            .settings-recommend-list { display: flex; flex-direction: column; gap: 8px; }
            .settings-recommend-item { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-tertiary); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; }
            .settings-recommend-item:hover { background: var(--bg-hover); }
            .settings-recommend-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.08); border-radius: var(--radius-sm); flex-shrink: 0; }
            .dark-mode .settings-recommend-icon { background: rgba(255,255,255,0.12); }
            .settings-recommend-icon img { width: 22px; height: 22px; filter: brightness(0); }
            .dark-mode .settings-recommend-icon img { filter: brightness(0) invert(1); }
            .settings-recommend-text { flex: 1; }
            .settings-recommend-text h4 { margin: 0 0 2px 0; font-size: 14px; font-weight: 600; }
            .settings-recommend-text p { margin: 0; font-size: 12px; color: var(--text-secondary); }
            .settings-recommend-arrow { width: 16px; height: 16px; opacity: 0.5; }
            
            /* 最近设置 */
            .settings-recent-list { display: flex; flex-direction: column; gap: 4px; }
            .settings-recent-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--bg-tertiary); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease; }
            .settings-recent-item:hover { background: var(--bg-hover); }
            .settings-recent-info { display: flex; gap: 12px; align-items: center; }
            .settings-recent-label { font-size: 13px; font-weight: 500; }
            .settings-recent-value { font-size: 13px; color: var(--text-secondary); }
            .settings-recent-time { font-size: 12px; color: var(--text-tertiary); }
            
            /* 设置项高亮动画 */
            .fluent-setting-item.highlight { background: rgba(var(--accent-rgb, 0, 120, 212), 0.15) !important; transition: background 0.3s ease; }
            .fluent-setting-item.highlight-fade { background: transparent !important; transition: background 0.5s ease; }
            .fluent-setting-item.highlight-soft-blue { background: rgba(var(--accent-rgb, 0, 120, 212), 0.24) !important; transition: background 0.2s ease; }
            .fluent-setting-item.highlight-soft-blue-fade { background: transparent !important; transition: background 0.3s ease; }
            body.fluent-v2 .fluent-setting-item.highlight-soft-blue {
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.32) !important;
                border-color: rgba(var(--accent-rgb, 0, 120, 212), 0.62) !important;
                box-shadow: 0 0 0 1px rgba(var(--accent-rgb, 0, 120, 212), 0.32), 0 8px 22px rgba(var(--accent-rgb, 0, 120, 212), 0.2) !important;
                transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            }
            body.fluent-v2.dark-mode .fluent-setting-item.highlight-soft-blue {
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.28) !important;
                border-color: rgba(var(--accent-rgb, 0, 120, 212), 0.68) !important;
                box-shadow: 0 0 0 1px rgba(var(--accent-rgb, 0, 120, 212), 0.42), 0 10px 24px rgba(var(--accent-rgb, 0, 120, 212), 0.28) !important;
            }
            body.fluent-v2 .fluent-setting-item.highlight-soft-blue-fade {
                transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            }

            .settings-Surf-custom-options {
                overflow: hidden;
                transform-origin: top center;
            }
            .settings-Surf-custom-options .fluent-setting-item {
                --Surf-stagger-index: 0;
            }
            .settings-Surf-custom-options.anim-in {
                animation: SurfCustomSlideIn 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .settings-Surf-custom-options.anim-out {
                animation: SurfCustomSlideOut 420ms cubic-bezier(0.4, 0, 0.2, 1) both;
                pointer-events: none;
            }
            .settings-Surf-custom-options.anim-in .fluent-setting-item {
                animation: SurfCustomItemIn 520ms cubic-bezier(0.2, 0.9, 0.25, 1) both;
                animation-delay: calc(var(--Surf-stagger-index) * 58ms);
            }
            .settings-Surf-custom-options.anim-out .fluent-setting-item {
                animation: SurfCustomItemOut 280ms cubic-bezier(0.4, 0, 1, 1) both;
                animation-delay: calc((2 - var(--Surf-stagger-index)) * 36ms);
            }

            @keyframes SurfCustomSlideIn {
                0% { opacity: 0; transform: translateY(-20px) scaleY(0.9); filter: blur(3px); }
                55% { opacity: 1; filter: blur(0); }
                100% { opacity: 1; transform: translateY(0) scaleY(1); filter: blur(0); }
            }
            @keyframes SurfCustomSlideOut {
                0% { opacity: 1; transform: translateY(0) scaleY(1); filter: blur(0); }
                100% { opacity: 0; transform: translateY(-14px) scaleY(0.88); filter: blur(2px); }
            }
            @keyframes SurfCustomItemIn {
                0% { opacity: 0; transform: translateX(-12px) translateY(14px) scale(0.975); }
                100% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
            }
            @keyframes SurfCustomItemOut {
                0% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
                100% { opacity: 0; transform: translateX(14px) translateY(-8px) scale(0.98); }
            }
            
            /* ========== 旧版外观统一卡片样式 ========== */
            .fluent-setting-item {
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: 16px 20px;
                margin-bottom: 10px;
            }
            
            .dark-mode .fluent-setting-item {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }
            
            .settings-recommend-item {
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
            }
            
            .dark-mode .settings-recommend-item {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }
            
            /* 统一所有列表卡片间距为 10px */
            .settings-recommend-list {
                display: flex;
                flex-direction: column;
                gap: 10px !important;
            }
            
            .settings-recent-list {
                display: flex;
                flex-direction: column;
                gap: 10px !important;
            }
            
            .network-options {
                display: flex;
                flex-direction: column;
                gap: 10px !important;
            }
            
            .network-hero-card,
            .network-option-item {
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
            }
            
            .dark-mode .network-hero-card,
            .dark-mode .network-option-item {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }
            
            /* ========== V2 统一所有设置卡片样式 ========== */
            /* 浅色模式 - 所有卡片统一透明度 */
            body.fluent-v2 .settings-recommend-item,
            body.fluent-v2 .settings-recent-item,
            body.fluent-v2 .network-hero-card,
            body.fluent-v2 .network-option-item,
            body.fluent-v2 .network-expand-panel,
            body.fluent-v2 .app-list-item,
            body.fluent-v2 .wallpaper-item,
            body.fluent-v2 .settings-overview-wallpaper,
            body.fluent-v2 .fluent-setting-item {
                background: var(--fluent-card-bg-light, rgba(255, 255, 255, 0.55)) !important;
                backdrop-filter: blur(var(--fluent-material-blur-light, 20px)) saturate(150%) !important;
                -webkit-backdrop-filter: blur(var(--fluent-material-blur-light, 20px)) saturate(150%) !important;
                border: 1px solid var(--fluent-card-border-light, rgba(255, 255, 255, 0.3)) !important;
                border-radius: 16px !important;
            }
            
            body.fluent-v2 .settings-recommend-item:hover,
            body.fluent-v2 .settings-recent-item:hover,
            body.fluent-v2 .network-option-item:hover,
            body.fluent-v2 .app-list-item:hover,
            body.fluent-v2 .fluent-setting-item:hover {
                background: var(--fluent-card-bg-light-hover, rgba(255, 255, 255, 0.62)) !important;
            }

            body.fluent-v2 .settings-content .settings-recommend-item,
            body.fluent-v2 .settings-content .settings-recent-item,
            body.fluent-v2 .settings-content .network-hero-card,
            body.fluent-v2 .settings-content .network-option-item,
            body.fluent-v2 .settings-content .network-expand-panel,
            body.fluent-v2 .settings-content .app-list-item,
            body.fluent-v2 .settings-content .wallpaper-item,
            body.fluent-v2 .settings-content .settings-overview-wallpaper,
            body.fluent-v2 .settings-content .fluent-setting-item {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                background-color: var(--fluent-card-bg-light, rgba(255, 255, 255, 0.55)) !important;
                background-image: none !important;
            }

            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .settings-recommend-item:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .settings-recent-item:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .network-option-item:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .network-expand-panel:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .app-list-item:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .wallpaper-item:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .settings-overview-wallpaper:hover,
            body.fluent-v2 .settings-content.fluent-scroll-hover-locked .fluent-setting-item:hover {
                background-color: var(--fluent-card-bg-light, rgba(255, 255, 255, 0.55)) !important;
            }
            
            /* 深色模式 - 所有卡片统一透明度 */
            body.fluent-v2.dark-mode .settings-recommend-item,
            body.fluent-v2.dark-mode .settings-recent-item,
            body.fluent-v2.dark-mode .network-hero-card,
            body.fluent-v2.dark-mode .network-option-item,
            body.fluent-v2.dark-mode .network-expand-panel,
            body.fluent-v2.dark-mode .app-list-item,
            body.fluent-v2.dark-mode .wallpaper-item,
            body.fluent-v2.dark-mode .settings-overview-wallpaper,
            body.fluent-v2.dark-mode .fluent-setting-item {
                background: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
                border-color: var(--fluent-card-border-dark, rgba(255, 255, 255, 0.1)) !important;
            }
            
            body.fluent-v2.dark-mode .settings-recommend-item:hover,
            body.fluent-v2.dark-mode .settings-recent-item:hover,
            body.fluent-v2.dark-mode .network-option-item:hover,
            body.fluent-v2.dark-mode .app-list-item:hover,
            body.fluent-v2.dark-mode .fluent-setting-item:hover {
                background: var(--fluent-card-bg-dark-hover, rgba(34, 40, 52, 0.58)) !important;
            }

            body.fluent-v2.dark-mode .settings-content .settings-recommend-item,
            body.fluent-v2.dark-mode .settings-content .settings-recent-item,
            body.fluent-v2.dark-mode .settings-content .network-hero-card,
            body.fluent-v2.dark-mode .settings-content .network-option-item,
            body.fluent-v2.dark-mode .settings-content .network-expand-panel,
            body.fluent-v2.dark-mode .settings-content .app-list-item,
            body.fluent-v2.dark-mode .settings-content .wallpaper-item,
            body.fluent-v2.dark-mode .settings-content .settings-overview-wallpaper,
            body.fluent-v2.dark-mode .settings-content .fluent-setting-item {
                background-color: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
                background-image: none !important;
            }

            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .settings-recommend-item:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .settings-recent-item:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .network-option-item:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .network-expand-panel:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .app-list-item:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .wallpaper-item:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .settings-overview-wallpaper:hover,
            body.fluent-v2.dark-mode .settings-content.fluent-scroll-hover-locked .fluent-setting-item:hover {
                background-color: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
            }

            body.fluent-v2.window-blur-disabled .settings-app,
            body.fluent-v2.window-blur-disabled .settings-content {
                background: var(--bg-primary) !important;
                background-color: var(--bg-primary) !important;
            }

            body.fluent-v2.window-blur-disabled .settings-section,
            body.fluent-v2.window-blur-disabled .settings-content > div:not(.fluent-setting-item):not(.settings-recommend-item):not(.settings-recent-item):not(.network-hero-card):not(.network-option-item):not(.network-expand-panel):not(.wallpaper-item):not(.settings-overview-wallpaper),
            body.fluent-v2.window-blur-disabled .wallpaper-grid {
                background: transparent !important;
                background-color: transparent !important;
            }

            body.fluent-v2.window-blur-disabled .settings-recommend-item,
            body.fluent-v2.window-blur-disabled .settings-recent-item,
            body.fluent-v2.window-blur-disabled .network-hero-card,
            body.fluent-v2.window-blur-disabled .network-option-item,
            body.fluent-v2.window-blur-disabled .network-expand-panel,
            body.fluent-v2.window-blur-disabled .fluent-setting-item {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                background: var(--bg-secondary) !important;
                border-color: var(--border-color) !important;
            }

            body.fluent-v2.window-blur-disabled .settings-recommend-item:hover,
            body.fluent-v2.window-blur-disabled .settings-recent-item:hover,
            body.fluent-v2.window-blur-disabled .network-option-item:hover,
            body.fluent-v2.window-blur-disabled .network-expand-panel:hover,
            body.fluent-v2.window-blur-disabled .fluent-setting-item:hover {
                background: var(--bg-hover) !important;
            }
            
            /* V2模式下统一卡片间距 */
            body.fluent-v2 .settings-recommend-list { gap: 8px; }
            body.fluent-v2 .settings-recent-list { gap: 8px; }
            body.fluent-v2 .network-options-list { gap: 8px; }
            
            /* 网络页面样式 */
            .settings-network { padding: 24px 32px; }
            .network-hero-card { display: flex; align-items: center; gap: 20px; padding: 24px 32px; background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: 16px; }
            .network-hero-icon { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; background: transparent; border-radius: var(--radius-md); }
            .network-hero-icon img { width: 52px; height: 52px; opacity: 0.8; }
            .dark-mode .network-hero-icon img { filter: brightness(0) invert(1); }
            .network-hero-info { flex: 1; }
            .network-hero-info h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 600; }
            .network-hero-status { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
            .network-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #9e9e9e; }
            .network-status-dot.connected { background: #00c853; }
            .network-hero-actions { display: flex; gap: 16px; }
            .network-hero-link { font-size: 13px; color: var(--accent); cursor: pointer; }
            .network-hero-link:hover { text-decoration: underline; }
            
            .network-options-list { display: flex; flex-direction: column; gap: 8px; }
            .network-option-item { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-tertiary); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; }
            .network-option-item:hover { background: var(--bg-hover); }
            .network-option-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
            .network-option-icon img { width: 24px; height: 24px; opacity: 0.8; transition: all 0.3s ease; }
            .network-option-icon.bluetooth-icon.disabled img { opacity: 0.4; }
            .network-option-info { flex: 1; }
            .network-option-info h4 { margin: 0 0 2px 0; font-size: 14px; font-weight: 500; }
            .network-option-info p { margin: 0; font-size: 12px; color: var(--text-secondary); }
            .network-option-arrow { width: 16px; height: 16px; opacity: 0.5; transition: transform 0.3s ease; }
            .network-option-expandable .expand-arrow { }
            
            .network-expand-panel { padding: 16px 20px 16px 76px; background: var(--bg-tertiary); border-radius: 0 0 var(--radius-md) var(--radius-md); margin-top: -2px; animation: expandDown 0.2s ease; }
            @keyframes expandDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            .network-expand-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
            .network-expand-row:last-child { border-bottom: none; }
            .network-expand-row span { font-size: 14px; }
            
            .network-device-list { margin-top: 16px; }
            .network-device-empty { text-align: center; padding: 32px 16px; }
            .network-device-empty img { width: 48px; height: 48px; opacity: 0.3; margin-bottom: 12px; }
            .network-device-empty p { margin: 0 0 4px 0; font-size: 14px; color: var(--text-secondary); }
            .network-device-empty span { font-size: 12px; color: var(--text-tertiary); }
            
            /* V2网络展开面板 */
            body.fluent-v2 .network-expand-panel {
                background: var(--fluent-card-bg-light, rgba(255, 255, 255, 0.55)) !important;
                border: 1px solid var(--fluent-card-border-light, rgba(255, 255, 255, 0.3)) !important;
                border-radius: 0 0 16px 16px !important;
            }
            body.fluent-v2.dark-mode .network-expand-panel {
                background: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
                border-color: var(--fluent-card-border-dark, rgba(255, 255, 255, 0.1)) !important;
            }
            
            /* 应用程序页面样式 */
            .storage-card-content {
                width: 100%;
            }
            
            .storage-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .storage-title {
                font-size: 16px;
                font-weight: 600;
            }
            
            .storage-usage {
                font-size: 14px;
                color: var(--text-secondary);
            }
            
            .storage-bar-wrapper {
                height: 10px;
                background: #d3d3d3;
                border-radius: 5px;
                overflow: hidden;
                display: flex;
                margin-bottom: 14px;
            }
            
            .dark-mode .storage-bar-wrapper {
                background: #5a5a5a;
            }
            
            .storage-bar-fill.apps {
                background: linear-gradient(90deg, #ff6b6b, #ff8787) !important;
                height: 100%;
            }
            
            .storage-bar-fill.core { background: #68768a !important; height: 100%; }
            .storage-bar-fill.resources { background: #5b8def !important; height: 100%; }
            .storage-bar-fill.other { background: #f2b134 !important; height: 100%; }
            .storage-bar-fill.overhead { background: #9b6bd3 !important; height: 100%; }
            
            body.fluent-v2 .storage-bar-wrapper {
                background: #d3d3d3 !important;
            }
            
            body.fluent-v2.dark-mode .storage-bar-wrapper {
                background: #5a5a5a !important;
            }
            
            .storage-legend {
                display: flex;
                gap: 10px 18px;
                flex-wrap: wrap;
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .storage-legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .storage-legend-item strong {
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .legend-dot {
                width: 10px;
                height: 10px;
                min-width: 10px;
                min-height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
                display: inline-block;
            }
            
            .legend-dot-apps { background-color: #ff6b6b !important; }
            .legend-dot-core { background-color: #68768a !important; }
            .legend-dot-resources { background-color: #5b8def !important; }
            .legend-dot-other { background-color: #f2b134 !important; }
            .legend-dot-overhead { background-color: #9b6bd3 !important; }
            .legend-dot-available {
                background-color: #d3d3d3 !important;
                border: 1px solid var(--border-color);
            }
            
            .dark-mode .legend-dot-available {
                background-color: #5a5a5a !important;
            }
            
            .apps-list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 24px 0 12px;
                padding: 0 4px;
            }
            
            .apps-list-title {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-secondary);
            }
            
            .apps-sort-btn {
                font-size: 13px;
                color: var(--accent);
                cursor: pointer;
                user-select: none;
                padding: 6px 12px;
                border-radius: 6px;
                background: transparent;
                transition: background 0.15s ease;
            }
            
            .apps-sort-btn:hover {
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.1);
            }
            
            .apps-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .app-list-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 14px 16px;
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                border: 1px solid var(--border-color);
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .app-list-item:hover {
                background: var(--bg-hover);
            }
            
            .dark-mode .app-list-item {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }
            
            .app-icon {
                width: 44px;
                height: 44px;
                border-radius: 10px;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .app-icon img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .app-info {
                flex: 1;
                min-width: 0;
            }
            
            .app-name {
                font-size: 15px;
                font-weight: 500;
                margin-bottom: 2px;
            }
            
            .app-meta {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .app-size {
                font-size: 14px;
                color: var(--text-secondary);
                margin-right: 8px;
            }
            
            .app-arrow {
                width: 16px;
                height: 16px;
                opacity: 0.4;
            }
            
            .app-arrow img {
                width: 100%;
                height: 100%;
            }
            
            .dark-mode .app-arrow img {
                filter: brightness(0) invert(1);
            }
            
            /* 应用详情样式 */
            .app-detail-content {
                min-width: 320px;
            }
            
            .app-detail-header {
                display: flex;
                gap: 16px;
                margin-bottom: 20px;
            }
            
            .app-detail-icon {
                width: 64px;
                height: 64px;
                border-radius: 14px;
                object-fit: cover;
            }
            
            .app-detail-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            
            .app-detail-name {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .app-detail-type {
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 2px;
            }
            
            .app-detail-size {
                font-size: 13px;
                color: var(--text-tertiary);
            }
            
            .app-detail-desc {
                margin-bottom: 20px;
            }
            
            .app-detail-desc-title {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }
            
            .app-detail-desc p {
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-primary);
            }
            
            .app-detail-actions {
                display: flex;
                gap: 12px;
            }
            
            .app-detail-actions .fluent-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                font-size: 14px;
            }
            
            .app-detail-actions .fluent-button img {
                width: 16px;
                height: 16px;
            }
            
            .fluent-button-danger {
                background: #dc3545 !important;
                border-color: #dc3545 !important;
                color: white !important;
            }
            
            .fluent-button-danger:hover {
                background: #c82333 !important;
            }
            
            .fluent-button-disabled {
                background: var(--bg-tertiary) !important;
                border-color: var(--border-color) !important;
                color: var(--text-tertiary) !important;
                cursor: not-allowed !important;
                opacity: 0.6;
            }
            
            .fluent-button-disabled img {
                opacity: 0.5;
            }
            
            /* V2 应用列表样式 */
            body.fluent-v2 .app-list-item {
                background: rgba(255, 255, 255, 0.55) !important;
                backdrop-filter: blur(var(--fluent-material-blur-light, 20px)) saturate(150%) !important;
                -webkit-backdrop-filter: blur(var(--fluent-material-blur-light, 20px)) saturate(150%) !important;
                border: 1px solid rgba(255, 255, 255, 0.3) !important;
                border-radius: 16px !important;
            }
            
            body.fluent-v2 .app-list-item:hover {
                background: var(--fluent-card-bg-light-hover, rgba(255, 255, 255, 0.62)) !important;
            }
            
            body.fluent-v2.dark-mode .app-list-item {
                background: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
                border-color: var(--fluent-card-border-dark, rgba(255, 255, 255, 0.1)) !important;
            }
            
            body.fluent-v2.dark-mode .app-list-item:hover {
                background: var(--fluent-card-bg-dark-hover, rgba(34, 40, 52, 0.58)) !important;
            }
            
            body.fluent-v2 .apps-list {
                gap: 10px;
            }
            
            /* V2 模式统一卡片间距 */
            body.fluent-v2 .settings-recommend-list,
            body.fluent-v2 .settings-recent-list,
            body.fluent-v2 .network-options {
                gap: 10px !important;
            }
            
            /* 应用详情页样式 */
            .app-detail-page {
                max-width: 100%;
            }
            
            .app-detail-page .fluent-setting-item {
                margin-bottom: 10px;
            }
            
            .dark-mode .app-detail-page .fluent-setting-item {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }
            
            /* 存储卡片内容 */
            .storage-card-content {
                width: 100%;
            }
            
            /* V2 模式下应用详情页卡片样式 */
            body.fluent-v2 .app-detail-page .fluent-setting-item {
                background: var(--fluent-card-bg-light, rgba(255, 255, 255, 0.55)) !important;
                backdrop-filter: blur(var(--fluent-material-blur-light, 20px)) saturate(150%) !important;
                -webkit-backdrop-filter: blur(var(--fluent-material-blur-light, 20px)) saturate(150%) !important;
                border: 1px solid var(--fluent-card-border-light, rgba(255, 255, 255, 0.3)) !important;
                border-radius: 16px !important;
            }
            
            body.fluent-v2.dark-mode .app-detail-page .fluent-setting-item {
                background: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
                border-color: var(--fluent-card-border-dark, rgba(255, 255, 255, 0.1)) !important;
            }
            
            .app-detail-back {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px 8px 12px;
                margin-bottom: 20px;
                cursor: pointer;
                color: var(--accent);
                font-size: 13px;
                font-weight: 500;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                transition: all 0.15s ease;
                border: 1px solid rgba(255, 255, 255, 0.5);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }
            
            .app-detail-back:hover {
                background: rgba(255, 255, 255, 0.9);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }
            
            .app-detail-back:active {
                transform: scale(0.98);
            }
            
            .app-detail-back img {
                width: 14px;
                height: 14px;
            }
            
            .dark-mode .app-detail-back {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.2);
                color: var(--accent);
            }
            
            .dark-mode .app-detail-back:hover {
                background: rgba(255, 255, 255, 0.25);
            }
            
            .dark-mode .app-detail-back img {
                filter: brightness(0) invert(1);
            }
            
            /* 页面切换动画 */
            @keyframes slideInFromRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutToRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .app-detail-page {
                animation: aboutChangelogEnter 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            
            .app-detail-page.slide-out {
                animation: aboutChangelogExit 260ms cubic-bezier(0.4, 0, 1, 1) both;
                pointer-events: none;
            }
            
            .app-detail-info-card {
                display: flex;
                gap: 16px;
                width: 100%;
            }
            
            .app-detail-icon {
                width: 64px;
                height: 64px;
                border-radius: 14px;
                object-fit: cover;
                flex-shrink: 0;
            }
            
            .app-detail-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            
            .app-detail-name {
                font-size: 17px;
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .app-detail-version {
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 2px;
            }
            
            .app-detail-developer {
                font-size: 13px;
                color: var(--text-tertiary);
            }
            
            .app-storage-info {
                width: 100%;
            }
            
            .app-storage-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                font-size: 14px;
            }
            
            .app-storage-row span:last-child {
                color: var(--text-secondary);
            }
            
            .app-storage-divider {
                height: 1px;
                background: var(--border-color);
            }
            
            .app-desc-card {
                width: 100%;
            }
            
            .app-desc-title {
                font-size: 12px;
                font-weight: 500;
                color: var(--text-tertiary);
                margin-bottom: 6px;
                text-transform: uppercase;
            }
            
            .app-desc-text {
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-primary);
            }
            
            .settings-static-card,
            .settings-static-card:hover,
            body.fluent-v2 .settings-static-card:hover,
            body.fluent-v2.dark-mode .settings-static-card:hover {
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
                color: var(--text-primary) !important;
            }

            body.fluent-v2 .settings-content .settings-static-card:hover {
                background-color: var(--fluent-card-bg-light, rgba(255, 255, 255, 0.55)) !important;
                background-image: none !important;
            }

            body.fluent-v2.dark-mode .settings-content .settings-static-card:hover {
                background-color: var(--fluent-card-bg-dark, rgba(24, 28, 36, 0.48)) !important;
            }

            .app-action-host {
                width: 100%;
            }

            .app-detail-action {
                width: 100%;
                min-height: 52px;
                justify-content: center;
                border-radius: var(--radius-md, 12px);
            }

            .app-storage-total {
                font-weight: 600;
            }
            
            .app-action-desc {
                margin: 8px 16px 16px;
                font-size: 12px;
                color: var(--text-tertiary);
                line-height: 1.5;
            }
            
            .app-action-desc-danger {
                color: #dc3545;
            }

            .settings-user-profile-card {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                flex-wrap: wrap;
                gap: 18px;
            }

            .settings-user-avatar-preview {
                width: 84px;
                height: 84px;
                border-radius: 50%;
                overflow: hidden;
                box-shadow: var(--shadow-md);
                border: 2px solid var(--border-color);
                flex-shrink: 0;
                background: var(--bg-secondary);
            }

            .settings-user-avatar-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .settings-user-profile-text {
                min-width: 0;
                flex: 1;
                text-align: left;
            }

            .settings-user-profile-name {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .settings-user-profile-email {
                font-size: 13px;
                color: var(--text-secondary);
                word-break: break-all;
            }

            .settings-about-hero-card {
                min-height: 146px;
                display: flex;
                align-items: center;
                gap: 28px;
                overflow: hidden;
                position: relative;
                padding: 24px 28px;
                box-sizing: border-box;
                isolation: isolate;
                animation: aboutCardEnter 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            /* The hero participates in the system-wide pointer glow API. */
            body.button-glow-enabled .settings-about-hero-card.button-glow-target > .button-edge-glow {
                width: 280px;
                height: 280px;
                z-index: 10;
                filter: blur(12px);
            }

            body.button-glow-enabled .settings-about-hero-card.button-glow-target > .button-glow-ripple {
                z-index: 9;
            }

            .settings-about-landscape {
                position: absolute;
                inset: -1px;
                z-index: 0;
                overflow: hidden;
                border-radius: inherit;
                background: #d5d9dc;
                pointer-events: none;
            }

            .settings-about-landscape::after {
                content: '';
                position: absolute;
                inset: 0;
                z-index: 9;
                background:
                    linear-gradient(90deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.18) 44%, rgba(255, 255, 255, 0.02)),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 64%);
            }

            .dark-mode .settings-about-landscape {
                background: #1f2630;
            }

            .dark-mode .settings-about-landscape::after {
                background:
                    linear-gradient(90deg, rgba(12, 16, 24, 0.36), rgba(12, 16, 24, 0.24) 46%, rgba(12, 16, 24, 0.08)),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01) 64%);
            }

            .settings-about-landscape-layer {
                position: absolute;
                left: 0;
                display: block;
                pointer-events: none;
                user-select: none;
                object-fit: fill;
                transform-origin: center bottom;
            }

            .settings-about-landscape-sky {
                z-index: 1;
                inset: -1px;
                width: calc(100% + 2px);
                height: calc(100% + 2px);
                animation: aboutLandscapeSkyEnter 920ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-landscape-water-base {
                z-index: 2;
                left: -1px;
                bottom: -1px;
                width: calc(100% + 2px);
                height: 30%;
                animation: aboutLandscapeWaterEnter 760ms 110ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-landscape-reflection {
                z-index: 3;
                left: -1px;
                bottom: -1px;
                width: 100%;
                height: 30%;
                transform-origin: left center;
                animation: aboutLandscapeReflectionEnter 820ms 190ms cubic-bezier(0.2, 0.82, 0.22, 1) both;
            }

            .settings-about-landscape-mountain-middle {
                z-index: 4;
                left: -1px;
                bottom: 29.4%;
                width: 98.5%;
                height: 32.21%;
                animation: aboutLandscapeMiddleEnter 880ms 230ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-landscape-mountain-dark {
                z-index: 5;
                left: 4.5%;
                bottom: 29.4%;
                width: 102%;
                height: 32.21%;
                animation: aboutLandscapePeaksEnter 920ms 310ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-landscape-land {
                z-index: 6;
                left: 5%;
                bottom: -1px;
                width: 100%;
                height: 30%;
                animation: aboutLandscapeLandEnter 820ms 390ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-landscape-trees {
                z-index: 7;
                left: 23.56%;
                bottom: 28.64%;
                width: 76.44%;
                height: 11.76%;
                animation: aboutLandscapeTreesEnter 760ms 470ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-brand {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                gap: 28px;
                min-width: 0;
                color: #1d1d1f;
            }

            .dark-mode .settings-about-brand {
                color: rgba(255, 255, 255, 0.94);
            }

            .settings-about-brand-logo {
                width: clamp(96px, 11.5vw, 118px);
                height: clamp(96px, 11.5vw, 118px);
                flex: 0 0 auto;
                display: grid;
                place-items: center;
                background: transparent;
                box-shadow: none;
                animation: aboutBrandLogoEnter 760ms 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-brand-logo img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: contain;
                filter: drop-shadow(0 10px 22px rgba(17, 31, 52, 0.18));
            }

            .settings-about-logo-dark { display: none !important; }
            .dark-mode .settings-about-logo-light { display: none !important; }
            .dark-mode .settings-about-logo-dark { display: block !important; }

            .settings-about-brand-name {
                font-size: clamp(38px, 6vw, 54px);
                font-weight: 760;
                line-height: 1;
                letter-spacing: -0.045em;
                text-shadow: 0 10px 28px rgba(255, 255, 255, 0.4);
                animation: aboutBrandNameEnter 760ms 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .dark-mode .settings-about-brand-name {
                text-shadow: 0 12px 28px rgba(0, 0, 0, 0.42);
            }

            .settings-about-card-codename {
                position: absolute;
                right: 24px;
                bottom: 18px;
                z-index: 2;
                max-width: min(320px, calc(100% - 48px));
                overflow: hidden;
                color: rgba(255, 255, 255, 0.88);
                font-size: 13px;
                font-weight: 650;
                text-align: right;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.36);
                animation: aboutCodenameEnter 620ms 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-hero-text {
                min-width: 0;
                text-align: left;
                animation: aboutTextEnter 640ms 160ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-hero-kicker {
                color: var(--accent);
                font-size: 12px;
                font-weight: 760;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .settings-about-hero-name {
                font-size: 40px;
                font-weight: 750;
                line-height: 1;
                margin: 0;
            }

            .settings-about-hero-meta {
                color: var(--text-secondary);
                font-size: 14px;
            }

            .settings-about-version-pill {
                justify-self: start;
                margin-top: 6px;
                padding: 6px 11px;
                border-radius: 999px;
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.1);
                color: var(--accent);
                font-size: 12px;
                font-weight: 650;
                font-variant-numeric: tabular-nums;
            }

            .settings-about-meta-card {
                display: flex;
                flex-direction: column;
                gap: 12px;
                animation: aboutCardEnter 560ms 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-meta-row {
                display: flex;
                align-items: baseline;
                gap: 10px;
                flex-wrap: wrap;
            }

            .settings-about-meta-label {
                font-size: 13px;
                color: var(--text-secondary);
                min-width: 84px;
            }

            .settings-about-meta-value {
                font-size: 14px;
                color: var(--text-primary);
            }

            .settings-about-meta-link {
                font-size: 14px;
                color: var(--accent);
                text-decoration: none;
                word-break: break-all;
            }

            .settings-about-meta-link:hover {
                text-decoration: underline;
            }

            .settings-about-list {
                animation: aboutCardEnter 560ms 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-about-list .fluent-list-item[data-id="changelog"] {
                cursor: pointer;
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.075);
            }

            .settings-about-list .fluent-list-item[data-id="changelog"]:hover {
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.14);
            }

            .settings-about-list .fluent-list-item-extra {
                font-size: 20px;
                color: var(--accent);
            }

            .settings-changelog-page {
                animation: aboutChangelogEnter 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-material-page {
                animation: aboutChangelogEnter 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .settings-material-page.slide-out {
                animation: aboutChangelogExit 260ms cubic-bezier(0.4, 0, 1, 1) both;
                pointer-events: none;
            }

            .settings-changelog-page.slide-out {
                animation: aboutChangelogExit 260ms cubic-bezier(0.4, 0, 1, 1) both;
                pointer-events: none;
            }

            .settings-changelog-header {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 18px;
                margin-bottom: 18px;
            }

            .settings-changelog-title {
                margin: 0;
                font-size: 28px;
                line-height: 1.15;
            }

            .settings-changelog-subtitle {
                margin: 6px 0 0;
                color: var(--text-secondary);
                font-size: 13px;
            }

            .settings-changelog-count {
                flex-shrink: 0;
                padding: 6px 11px;
                border-radius: 999px;
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.1);
                color: var(--accent);
                font-size: 12px;
            }

            .settings-changelog-timeline {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding-left: 18px;
            }

            .settings-changelog-timeline::before {
                content: '';
                position: absolute;
                left: 5px;
                top: 18px;
                bottom: 18px;
                width: 2px;
                border-radius: 2px;
                background: linear-gradient(180deg, var(--accent), rgba(var(--accent-rgb, 0, 120, 212), 0.12));
            }

            .settings-changelog-entry {
                position: relative;
                margin-bottom: 0;
                animation: aboutLogItemEnter 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-delay: min(calc(var(--log-index) * 42ms), 420ms);
            }

            .settings-changelog-entry::before {
                content: '';
                position: absolute;
                left: -20px;
                top: 23px;
                width: 10px;
                height: 10px;
                box-sizing: border-box;
                border-radius: 50%;
                background: var(--bg-primary);
                border: 3px solid var(--accent);
                z-index: 2;
            }

            .settings-changelog-entry.is-baseline::before {
                border-color: var(--text-tertiary);
            }

            .settings-changelog-entry-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 11px;
            }

            .settings-changelog-version {
                font-size: 16px;
                font-weight: 650;
                font-variant-numeric: tabular-nums;
            }

            .settings-changelog-date {
                color: var(--text-secondary);
                font-size: 12px;
                font-variant-numeric: tabular-nums;
            }

            .settings-changelog-commits {
                display: flex;
                flex-direction: column;
                gap: 9px;
            }

            .settings-changelog-commit {
                display: grid;
                grid-template-columns: 58px minmax(0, 1fr);
                align-items: start;
                gap: 10px;
                font-size: 13px;
                line-height: 1.55;
            }

            .settings-changelog-hash {
                margin-top: 1px;
                padding: 2px 5px;
                border-radius: 5px;
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.09);
                color: var(--accent);
                font: 11px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace;
                text-align: center;
            }

            .settings-changelog-baseline {
                color: var(--text-secondary);
                font-size: 13px;
                line-height: 1.55;
            }

            @keyframes aboutCardEnter {
                from { opacity: 0; transform: translateY(18px) scale(0.985); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes aboutTextEnter {
                from { opacity: 0; transform: translateX(22px); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes aboutLandscapeSkyEnter {
                from { opacity: 0; transform: scale(1.035); filter: saturate(0.82); }
                to { opacity: 1; transform: scale(1); filter: saturate(1); }
            }

            @keyframes aboutLandscapeWaterEnter {
                from { opacity: 0; transform: translateY(22px) scaleY(0.78); }
                to { opacity: 1; transform: translateY(0) scaleY(1); }
            }

            @keyframes aboutLandscapeReflectionEnter {
                from { opacity: 0; transform: translateY(16px) scaleX(0.88); }
                to { opacity: 1; transform: translateY(0) scaleX(1); }
            }

            @keyframes aboutLandscapeMiddleEnter {
                from { opacity: 0; transform: translateY(30px) scaleY(0.76); }
                to { opacity: 1; transform: translateY(0) scaleY(1); }
            }

            @keyframes aboutLandscapePeaksEnter {
                from { opacity: 0; transform: translateY(34px) scaleY(0.72); }
                to { opacity: 1; transform: translateY(0) scaleY(1); }
            }

            @keyframes aboutLandscapeLandEnter {
                from { opacity: 0; transform: translateY(24px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes aboutLandscapeTreesEnter {
                from { opacity: 0; transform: translateY(16px) scaleY(0.45); }
                to { opacity: 1; transform: translateY(0) scaleY(1); }
            }

            @keyframes aboutBrandLogoEnter {
                from { opacity: 0; transform: translateX(-22px) scale(0.86); filter: blur(4px); }
                70% { opacity: 1; transform: translateX(2px) scale(1.035); filter: blur(0); }
                to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
            }

            @keyframes aboutBrandNameEnter {
                from { opacity: 0; transform: translateX(28px); filter: blur(5px); }
                to { opacity: 1; transform: translateX(0); filter: blur(0); }
            }

            @keyframes aboutCodenameEnter {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes aboutChangelogEnter {
                from { opacity: 0; transform: translateX(34px); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes aboutChangelogExit {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(34px); }
            }

            @keyframes aboutLogItemEnter {
                from { opacity: 0; transform: translateY(14px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @media (max-width: 900px) {
                .settings-about-hero-card {
                    min-height: 140px;
                    padding: 22px 24px;
                }

                .settings-about-brand {
                    gap: 24px;
                }
            }

            @media (max-width: 620px) {
                .settings-about-hero-card {
                    min-height: 128px;
                    padding: 20px;
                }

                .settings-about-brand {
                    gap: 16px;
                }

                .settings-about-brand-logo {
                    width: 78px;
                    height: 78px;
                }

                .settings-about-brand-name {
                    font-size: 34px;
                }

                .settings-about-card-codename {
                    right: 18px;
                    bottom: 14px;
                    font-size: 12px;
                }

                .settings-changelog-header {
                    align-items: flex-start;
                    flex-direction: column;
                }

                .settings-changelog-commit {
                    grid-template-columns: 1fr;
                    gap: 5px;
                }

                .settings-changelog-hash {
                    width: max-content;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .settings-about-hero-card,
                .settings-about-meta-card,
                .settings-about-list,
                .settings-about-hero-text,
                .settings-about-landscape-layer,
                .settings-about-brand-logo,
                .settings-about-brand-name,
                .settings-about-card-codename,
                .settings-changelog-page,
                .settings-material-page,
                .app-detail-page,
                .settings-changelog-entry {
                    animation: none !important;
                }
            }

            .settings-user-avatar-grid {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 12px;
                padding-left: 20px;
                margin-top: 14px;
            }

            .settings-user-avatar-actions {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin-left: auto;
            }

            .settings-user-avatar-item {
                position: relative;
                flex: 0 0 68px;
                width: 68px;
                height: 68px;
                border-radius: 50%;
                overflow: hidden;
                background: var(--bg-secondary);
                border: 2px solid transparent;
                box-shadow: var(--shadow-sm);
                cursor: pointer;
                padding: 0;
                transition: transform 0.18s ease, border-color 0.18s ease;
            }

            .settings-user-avatar-item:hover {
                transform: translateY(-2px);
            }

            .settings-user-avatar-item.selected {
                border-color: var(--accent);
            }

            .settings-user-avatar-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .settings-user-save-row {
                display: flex;
                justify-content: flex-end;
                margin-top: 8px;
                padding: 0;
                background: transparent;
                border: 0;
                box-shadow: none;
            }

            .settings-user-danger-content {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 12px;
            }

            .settings-user-danger-content .fluent-btn {
                align-self: flex-end;
            }

            .settings-user-danger-text {
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.6;
                width: 100%;
                text-align: left;
            }

            body:not(.fluent-v2) .settings-user-danger-content .fluent-btn-danger {
                color: #fff !important;
            }

            body:not(.fluent-v2) .settings-user-danger-content .fluent-btn-danger .fluent-btn-text {
                color: #fff !important;
            }

            .settings-reset-warning {
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.7;
            }

            .settings-page-back {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                height: 36px;
                padding: 0 12px;
                margin: 0 0 18px 0;
                border: 1px solid var(--border-color);
                border-radius: 10px;
                background: var(--bg-tertiary);
                color: var(--text-primary);
                cursor: pointer;
                font: inherit;
                transition: background var(--transition-fast), transform var(--transition-fast);
            }

            .settings-page-back:hover {
                background: var(--bg-hover);
                transform: translateY(-1px);
            }

            .settings-page-back img {
                width: 16px;
                height: 16px;
            }

            .settings-advanced-entry .fluent-setting-item-control {
                min-width: auto;
                display: flex;
                align-items: center;
            }

            .settings-entry-arrow {
                width: 18px;
                height: 18px;
                opacity: 0.62;
                transition: opacity var(--transition-fast), transform var(--transition-fast);
            }

            .dark-mode .settings-entry-arrow {
                filter: brightness(0) invert(1);
            }

            .settings-advanced-entry:hover .settings-entry-arrow {
                opacity: 1;
                transform: translateX(2px);
            }

            .settings-beta-badge {
                display: inline-flex;
                align-items: center;
                height: 18px;
                margin-left: 8px;
                padding: 0 7px;
                border-radius: 999px;
                background: rgba(var(--accent-rgb, 0, 120, 212), 0.14);
                color: var(--accent);
                font-size: 11px;
                font-weight: 600;
                vertical-align: middle;
            }

            .settings-slider-control {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 260px;
            }

            .settings-slider-control .fluent-slider-wrapper {
                flex: 1;
            }

            .settings-blur-strength-item {
                max-height: 96px;
                transition:
                    max-height 220ms ease,
                    margin-bottom 220ms ease,
                    padding 220ms ease,
                    opacity 160ms ease,
                    transform 220ms ease,
                    background 180ms ease;
            }

            .settings-mica-hidden {
                max-height: 0;
                margin-bottom: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                opacity: 0;
                overflow: hidden;
                pointer-events: none;
                background: transparent !important;
                border-color: transparent !important;
                transform: translateY(-6px);
                transition:
                    max-height 220ms ease,
                    margin-bottom 220ms ease,
                    padding 220ms ease,
                    opacity 160ms ease,
                    transform 220ms ease,
                    background 180ms ease;
            }

            .settings-inline-value {
                min-width: 56px;
                color: var(--text-secondary);
                font-size: 13px;
                text-align: right;
            }

            .material-preview {
                position: relative;
                height: 168px;
                margin-bottom: 16px;
                overflow: hidden;
                border-radius: 18px;
                border: 1px solid var(--border-color);
                background: linear-gradient(135deg, #d7ebff, #f8fbff 44%, #dbeafe);
                box-shadow: var(--shadow-md);
            }

            .dark-mode .material-preview {
                background: linear-gradient(135deg, #151923, #252b36 46%, #111827);
            }

            .material-preview-wallpaper {
                position: absolute;
                inset: 0;
                background:
                    radial-gradient(circle at 20% 25%, rgba(var(--accent-rgb, 0, 120, 212), 0.44), transparent 28%),
                    radial-gradient(circle at 78% 22%, rgba(255, 145, 77, 0.38), transparent 30%),
                    radial-gradient(circle at 52% 86%, rgba(105, 92, 255, 0.34), transparent 34%),
                    var(--fluent-wallpaper-url, linear-gradient(135deg, #d7ebff, #f8fbff));
                background-size: cover;
                background-position: center;
            }

            .material-preview-panel {
                position: absolute;
                left: 50%;
                top: 50%;
                width: min(320px, calc(100% - 56px));
                padding: 24px 28px;
                transform: translate(-50%, -50%);
                overflow: hidden;
                border-radius: 22px;
                border: 1px solid rgba(255, 255, 255, 0.58);
                background: rgba(255, 255, 255, 0.42);
                backdrop-filter: blur(var(--fluent-material-blur, 40px)) saturate(170%);
                -webkit-backdrop-filter: blur(var(--fluent-material-blur, 40px)) saturate(170%);
                box-shadow:
                    0 18px 42px rgba(24, 68, 120, 0.18),
                    inset 0 1px 0 rgba(255,255,255,0.74);
            }

            .material-preview-mica .material-preview-panel {
                background: rgba(238, 244, 255, 0.42);
                backdrop-filter: blur(var(--fluent-mica-blur, 75px)) saturate(135%) brightness(1.04);
                -webkit-backdrop-filter: blur(var(--fluent-mica-blur, 75px)) saturate(135%) brightness(1.04);
            }

            .material-preview-mica .material-preview-panel::before {
                content: '';
                position: absolute;
                inset: -42px;
                z-index: 0;
                background:
                    radial-gradient(circle at 18% 24%, rgba(var(--accent-rgb, 0, 120, 212), 0.36), transparent 30%),
                    radial-gradient(circle at 76% 26%, rgba(255, 145, 77, 0.28), transparent 32%),
                    radial-gradient(circle at 54% 84%, rgba(105, 92, 255, 0.28), transparent 36%),
                    var(--fluent-wallpaper-url, linear-gradient(135deg, #d7ebff, #f8fbff));
                background-size: cover;
                background-position: center;
                filter: blur(28px) saturate(145%);
                transform: scale(1.08);
            }

            .material-preview-mica .material-preview-panel::after {
                content: '';
                position: absolute;
                inset: 0;
                z-index: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.64), rgba(255,255,255,0.34));
                pointer-events: none;
            }

            .dark-mode .material-preview-panel {
                border-color: rgba(255, 255, 255, 0.16);
                background: rgba(28, 31, 38, 0.58);
                box-shadow:
                    0 22px 48px rgba(0, 0, 0, 0.48),
                    inset 0 1px 0 rgba(255,255,255,0.16);
            }

            .dark-mode .material-preview-mica .material-preview-panel {
                background: rgba(18, 22, 30, 0.54);
            }

            .dark-mode .material-preview-mica .material-preview-panel::before {
                filter: blur(28px) saturate(125%) brightness(0.72);
            }

            .dark-mode .material-preview-mica .material-preview-panel::after {
                background: linear-gradient(135deg, rgba(30,34,42,0.72), rgba(10,12,18,0.48));
            }

            .material-preview-title {
                position: relative;
                z-index: 1;
                font-size: 24px;
                font-weight: 700;
            }

            .material-preview-subtitle {
                position: relative;
                z-index: 1;
                margin-top: 4px;
                color: var(--text-secondary);
                font-size: 13px;
            }

            .settings-reset-countdown {
                margin-top: 10px;
                color: #d13438;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    },

    renderPage(container) {
        switch (this.currentPage) {
            case 'overview':
                this.renderOverview(container);
                break;
            case 'user':
                this.renderUser(container);
                break;
            case 'network':
                this.renderNetwork(container);
                break;
            case 'personalization':
                this.renderPersonalization(container);
                break;
            case 'personalization-advanced':
                this.renderPersonalizationAdvanced(container);
                break;
            case 'applications':
                this.renderApplications(container);
                break;
            case 'multitask':
                this.renderMultitask(container);
                break;
            case 'app-detail':
                this.renderAppDetailPage(container);
                break;
            case 'time-language':
                this.renderTimeLanguage(container);
                break;
            case 'privacy':
                this.renderPrivacy(container);
                break;
            case 'Surf':
                this.renderSurf(container);
                break;
            case 'update':
                this.renderNyouOSUpdate(container);
                break;
            case 'lab':
                this.renderLab(container);
                break;
            case 'about':
                this.renderAbout(container);
                break;
            case 'about-changelog':
                this.renderAboutChangelog(container);
                break;
            case 'developer':
                this.renderDeveloper(container);
                break;
            default:
                this.renderOverview(container);
                break;
        }
    },
    
    // 最近设置记录
    recentSettings: [],
    
    // 添加最近设置记录
    addRecentSetting(label, value, pageId, settingId = null) {
        const record = {
            label,
            value,
            pageId,
            settingId: settingId || label.replace(/\s/g, '-').toLowerCase(),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        this.recentSettings.unshift(record);
        if (this.recentSettings.length > 5) {
            this.recentSettings.pop();
        }
    },
    
    // 高亮指定设置项
    highlightSetting(settingId) {
        setTimeout(() => {
            const content = this.container.querySelector('.settings-content');
            if (!content) return;
            
            // 查找匹配的设置项
            const items = content.querySelectorAll('.fluent-setting-item');
            items.forEach(item => {
                const label = item.querySelector('.fluent-setting-item-label');
                if (label && label.textContent.includes(settingId)) {
                    // 滚动到视图
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 添加高亮
                    item.classList.add('highlight');
                    // 1.5秒后渐隐
                    setTimeout(() => {
                        item.classList.remove('highlight');
                        item.classList.add('highlight-fade');
                        setTimeout(() => {
                            item.classList.remove('highlight-fade');
                        }, 500);
                    }, 1500);
                }
            });
        }, 100);
    },

    highlightSettingByDataId(settingDataId, holdMs = 1000) {
        setTimeout(() => {
            const content = this.container?.querySelector('.settings-content');
            if (!content) return;
            const item = content.querySelector(`.fluent-setting-item[data-setting-id="${settingDataId}"]`);
            if (!item) return;

            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.classList.add('highlight-soft-blue');
            setTimeout(() => {
                item.classList.remove('highlight-soft-blue');
                item.classList.add('highlight-soft-blue-fade');
                setTimeout(() => item.classList.remove('highlight-soft-blue-fade'), 300);
            }, holdMs);
        }, 80);
    },
    
    // 概览页面
    getDeviceName() {
        const fallbackName = 'NyouOS';
        const raw = String(State?.settings?.deviceName || '').trim();
        return raw || fallbackName;
    },

    _normalizeDeviceName(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    _promptRenameDevice() {
        const currentName = this.getDeviceName();
        FluentUI.InputDialog({
            title: t('rename'),
            placeholder: t('settings.user.name-placeholder'),
            defaultValue: currentName,
            maxLength: 32,
            validateFn: (value) => {
                const nextName = this._normalizeDeviceName(value);
                if (!nextName) return t('files.rename-empty');
                return true;
            },
            confirmText: t('ok'),
            cancelText: t('cancel'),
            onConfirm: (value) => {
                const nextName = this._normalizeDeviceName(value);
                if (!nextName) return;
                State.updateSettings({ deviceName: nextName });
                this.addRecentSetting(t('rename'), nextName, 'overview');
                FluentUI.Toast({
                    title: t('settings.title'),
                    message: `${t('rename')}: ${nextName}`,
                    type: 'success'
                });
                this.render();
            }
        });
    },
    renderOverview(container) {
        container.className = 'settings-content settings-overview';
        const deviceName = this.getDeviceName();
        
        // 设备信息头部（显示壁纸和电脑名称）
        const header = document.createElement('div');
        header.className = 'settings-overview-header';
        const wallpaper = typeof State.getResolvedWallpaper === 'function'
            ? State.getResolvedWallpaper('desktop')
            : (State.settings.wallpaperDesktop || 'Theme/Picture/Fluent-2.png');
        header.innerHTML = `
            <div class="settings-overview-device">
                <div class="settings-overview-wallpaper">
                    <img src="${wallpaper}" alt="壁纸">
                </div>
                <div class="settings-overview-device-info">
                    <h2>${deviceName}</h2>
                    <p>${t('settings.vm-device')}</p>
                    <span class="settings-overview-rename">${t('rename')}</span>
                </div>
            </div>
        `;
        container.appendChild(header);
        const renameBtn = header.querySelector('.settings-overview-rename');
        if (renameBtn) {
            renameBtn.addEventListener('click', () => this._promptRenameDevice());
        }

        // 推荐设置
        const recommendSection = document.createElement('div');
        recommendSection.className = 'settings-section';
        recommendSection.innerHTML = `<div class="settings-section-title">${t('settings.recommend')}</div>`;
        
        const recommendList = document.createElement('div');
        recommendList.className = 'settings-recommend-list';
        
        const recommendations = [
            { icon: 'Color Picker', label: t('settings.recommend-personalize'), desc: t('settings.recommend-personalize-desc'), pageId: 'personalization' },
            { icon: 'Lock', label: t('settings.recommend-security'), desc: t('settings.recommend-security-desc'), pageId: 'privacy' },
            { icon: 'Globe', label: t('settings.recommend-network'), desc: t('settings.recommend-network-desc'), pageId: 'network' }
        ];
        
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'settings-recommend-item';
            item.innerHTML = `
                <div class="settings-recommend-icon">
                    <img src="Theme/Icon/Symbol_icon/stroke/${rec.icon}.svg" alt="">
                </div>
                <div class="settings-recommend-text">
                    <h4>${rec.label}</h4>
                    <p>${rec.desc}</p>
                </div>
                <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" class="settings-recommend-arrow" alt="">
            `;
            item.addEventListener('click', () => {
                this.navigateToPage(rec.pageId);
            });
            recommendList.appendChild(item);
        });
        recommendSection.appendChild(recommendList);
        container.appendChild(recommendSection);
        
        // 最近设置
        if (this.recentSettings.length > 0) {
            const recentSection = document.createElement('div');
            recentSection.className = 'settings-section';
            recentSection.innerHTML = `<div class="settings-section-title">${t('settings.recent')}</div>`;
            
            const recentList = document.createElement('div');
            recentList.className = 'settings-recent-list';
            
            this.recentSettings.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'settings-recent-item';
                item.innerHTML = `
                    <div class="settings-recent-info">
                        <span class="settings-recent-label">${rec.label}</span>
                        <span class="settings-recent-value">${rec.value}</span>
                    </div>
                    <span class="settings-recent-time">${rec.time}</span>
                `;
                item.addEventListener('click', () => {
                    this.navigateToPage(rec.pageId, {
                        after: () => this.highlightSetting(rec.label),
                        delay: 220
                    });
                });
                recentList.appendChild(item);
            });
            recentSection.appendChild(recentList);
            container.appendChild(recentSection);
        }
    },
    
    getUserAvatarOptions() {
        return [
            'Theme/Profile_img/UserAva.jpg',
            ...Array.from({ length: 10 }, (_, i) => `Theme/Profile_img/${i + 1}.jpg`)
        ];
    },

    getAvatarThumbCache() {
        if (this._avatarThumbCache) return this._avatarThumbCache;
        const parsed = Storage.get(this._avatarThumbStorageKey, {});
        this._avatarThumbCache = parsed && typeof parsed === 'object' ? parsed : {};
        return this._avatarThumbCache;
    },

    saveAvatarThumbCache() {
        Storage.set(this._avatarThumbStorageKey, this._avatarThumbCache || {});
    },

    getAvatarThumbSrc(src, fallback = '') {
        const cache = this.getAvatarThumbCache();
        return cache[src] || fallback || this._avatarPlaceholderSrc;
    },

    async buildAvatarThumb(src, size = 80) {
        return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                try {
                    const width = Number(img.naturalWidth) || size;
                    const height = Number(img.naturalHeight) || size;
                    const cropSize = Math.min(width, height);
                    const sx = Math.max(0, (width - cropSize) / 2);
                    const sy = Math.max(0, (height - cropSize) / 2);

                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(src);
                        return;
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
                    resolve(canvas.toDataURL('image/jpeg', 0.76));
                } catch (_) {
                    resolve(src);
                }
            };
            img.onerror = () => resolve(src);
            img.src = src;
        });
    },

    async ensureAvatarThumbs(sources = []) {
        if (!Array.isArray(sources) || sources.length === 0) return;
        if (this._avatarThumbBuildPromise) return this._avatarThumbBuildPromise;

        this._avatarThumbBuildPromise = (async () => {
            const cache = this.getAvatarThumbCache();
            let changed = false;

            for (const src of sources) {
                if (!src || cache[src] || /^data:image\//i.test(src)) continue;

                await new Promise((resolve) => {
                    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
                        window.requestIdleCallback(() => resolve(), { timeout: 120 });
                    } else {
                        setTimeout(resolve, 16);
                    }
                });

                const thumb = await this.buildAvatarThumb(src, 80);
                if (!thumb || thumb === src) continue;

                cache[src] = thumb;
                changed = true;

                if (this.currentPage === 'user' && this.container) {
                    const key = encodeURIComponent(src);
                    const imgs = this.container.querySelectorAll(`img[data-avatar-key="${key}"]`);
                    imgs.forEach((img) => {
                        img.src = thumb;
                    });

                    const selectedAvatar = String(State?.settings?.userAvatar || '').trim();
                    const preview = this.container.querySelector('.settings-user-avatar-preview img[data-avatar-preview="1"]');
                    if (preview && selectedAvatar === src) preview.src = thumb;
                }
            }

            if (changed) {
                this._avatarThumbCache = cache;
                this.saveAvatarThumbCache();
            }
        })().finally(() => {
            this._avatarThumbBuildPromise = null;
        });

        return this._avatarThumbBuildPromise;
    },

    async resizeImageFileToDataUrl(file, size = 192, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('read-failed'));
            reader.onload = () => {
                const src = String(reader.result || '');
                if (!/^data:image\//i.test(src)) {
                    reject(new Error('invalid-image'));
                    return;
                }

                const img = new Image();
                img.decoding = 'async';
                img.onerror = () => reject(new Error('decode-failed'));
                img.onload = () => {
                    try {
                        const width = Number(img.naturalWidth) || size;
                        const height = Number(img.naturalHeight) || size;
                        const cropSize = Math.min(width, height);
                        const sx = Math.max(0, (width - cropSize) / 2);
                        const sy = Math.max(0, (height - cropSize) / 2);

                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            resolve(src);
                            return;
                        }

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } catch (error) {
                        reject(error);
                    }
                };
                img.src = src;
            };
            reader.readAsDataURL(file);
        });
    },

    _openEasterEgg() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:var(--bg,#f3f3f3);display:flex;flex-direction:column;align-items:center;justify-content:center;';

        const backBtn = document.createElement('button');
        backBtn.style.cssText = 'position:absolute;top:24px;left:24px;width:40px;height:40px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;';
        backBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
        backBtn.title = '返回';
        backBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s';
            setTimeout(() => overlay.remove(), 200);
        });
        overlay.appendChild(backBtn);

        const logo = document.createElement('div');
        logo.style.cssText = 'width:200px;height:200px;border-radius:50%;background:linear-gradient(135deg,#0078d4,#00bcf2,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:700;color:white;box-shadow:0 8px 32px rgba(0,120,212,0.4);cursor:pointer;transition:transform 0.3s;user-select:none;';
        logo.textContent = 'N';
        let logoTaps = 0;
        let logoTimer = null;
        let animState = 0;
        logo.addEventListener('click', () => {
            logoTaps++;
            if (logoTimer) clearTimeout(logoTimer);
            logoTimer = setTimeout(() => { logoTaps = 0; }, 1000);
            if (logoTaps >= 5) {
                logoTaps = 0;
                animState++;
                if (animState === 1) {
                    logo.style.transform = 'scale(1.1) rotate(5deg)';
                    setTimeout(() => { logo.style.transform = 'scale(1) rotate(0deg)'; }, 300);
                    FluentUI.Toast({ title: 'NyouOS', message: '版本 26.4', type: 'info' });
                } else if (animState === 2) {
                    logo.style.background = 'linear-gradient(135deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3)';
                    FluentUI.Toast({ title: '彩蛋', message: '你发现了什么？', type: 'success' });
                } else {
                    logo.style.transform = 'scale(1.2) rotate(360deg)';
                    setTimeout(() => { logo.style.transform = 'scale(1) rotate(0deg)'; }, 600);
                    FluentUI.Toast({ title: '🎉', message: 'KevinAnanda © 2025-2026', type: 'success' });
                    animState = 0;
                }
            }
        });
        overlay.appendChild(logo);

        const versionText = document.createElement('div');
        versionText.style.cssText = 'margin-top:24px;font-size:18px;font-weight:600;color:var(--text-primary,#000);';
        versionText.textContent = 'NyouOS 26.4';
        overlay.appendChild(versionText);

        const subtitle = document.createElement('div');
        subtitle.style.cssText = 'margin-top:8px;font-size:14px;color:var(--text-secondary,#666);';
        subtitle.textContent = '© KevinAnanda 2025-2026';
        overlay.appendChild(subtitle);

        overlay.style.opacity = '0';
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '1';
        });
    },

    _showAccountDialog() {
        if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') return;
        const profile = this.getUserProfile();
        const previewAvatarSrc = this.getAvatarThumbSrc(profile.avatar, profile.avatar);
        const maskedEmail = this.maskEmail(profile.email);
        const isLoggedIn = !!(State?.session?.isLoggedIn || State?.auth?.isLoggedIn);

        const content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        content.style.gap = '16px';
        content.style.padding = '12px 0';

        const avatarEl = document.createElement('div');
        avatarEl.style.width = '72px';
        avatarEl.style.height = '72px';
        avatarEl.style.borderRadius = '50%';
        avatarEl.style.overflow = 'hidden';
        avatarEl.style.flexShrink = '0';
        avatarEl.innerHTML = `<img src="${previewAvatarSrc}" alt="avatar" style="width:100%;height:100%;object-fit:cover;" loading="lazy" decoding="async">`;
        content.appendChild(avatarEl);

        const nameEl = document.createElement('div');
        nameEl.style.fontSize = '18px';
        nameEl.style.fontWeight = '600';
        nameEl.textContent = profile.name;
        content.appendChild(nameEl);

        const emailEl = document.createElement('div');
        emailEl.style.fontSize = '13px';
        emailEl.style.color = 'var(--text-secondary, #666)';
        emailEl.textContent = maskedEmail;
        content.appendChild(emailEl);

        const divider = document.createElement('div');
        divider.style.width = '100%';
        divider.style.height = '1px';
        divider.style.background = 'var(--divider-color, #e5e5e5)';
        divider.style.margin = '4px 0';
        content.appendChild(divider);

        const logoutBtn = FluentUI.Button({
            text: isLoggedIn ? t('start.power.logout') : (t('login.title') || '登录'),
            variant: 'secondary',
            fullWidth: true,
            onClick: () => {
                if (isLoggedIn) {
                    State.logout();
                } else if (typeof window.OOBE !== 'undefined' && typeof window.OOBE.showAuth === 'function') {
                    window.OOBE.showAuth();
                }
                FluentUI.Toast({
                    title: isLoggedIn ? (t('start.power.logout') || '注销') : (t('login.title') || '登录'),
                    message: isLoggedIn ? (t('power.logout.status') || '正在注销...') : '',
                    type: 'info'
                });
            }
        });
        content.appendChild(logoutBtn);

        const copyrightEl = document.createElement('div');
        copyrightEl.style.fontSize = '12px';
        copyrightEl.style.color = 'var(--text-secondary, #999)';
        copyrightEl.style.marginTop = '8px';
        copyrightEl.style.textAlign = 'center';
        copyrightEl.style.cursor = 'pointer';
        copyrightEl.style.userSelect = 'none';
        copyrightEl.innerHTML = `© KevinAnanda 2025-2026<br>${t('settings.about.system-version') || 'System Version'}: ${State?.settings?.osVersion || '26.4'}`;
        let copyrightTapCount = 0;
        let copyrightTapTimer = null;
        copyrightEl.addEventListener('click', () => {
            copyrightTapCount++;
            if (copyrightTapTimer) clearTimeout(copyrightTapTimer);
            copyrightTapTimer = setTimeout(() => { copyrightTapCount = 0; }, 1500);
            if (copyrightTapCount >= 3) {
                copyrightTapCount = 0;
                this._openEasterEgg();
            }
        });
        content.appendChild(copyrightEl);

        FluentUI.Dialog({
            title: t('settings.user') || '账户',
            content: content,
            closeButtonText: t('settings.close') || '关闭',
            defaultButton: 'close'
        });
    },

    getUserProfile() {
        const fallbackName = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.username')
            : 'Owner';
        const fallbackEmail = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.email')
            : 'owner@sample.com';
        const avatars = this.getUserAvatarOptions();
        const rawAvatar = String(State.settings.userAvatar || '').trim();
        const isCustomAvatar = /^data:image\//i.test(rawAvatar);
        const avatar = (avatars.includes(rawAvatar) || isCustomAvatar) ? rawAvatar : avatars[0];
        const name = String(State.settings.userName || '').trim() || fallbackName;
        // 登录状态下优先使用 Supabase 登录邮箱
        const sessionEmail = State?.session?.userEmail || '';
        const email = sessionEmail || String(State.settings.userEmail || '').trim() || fallbackEmail;
        return { name, email, avatar };
    },

    renderUser(container) {
        container.className = 'settings-content settings-user';

        const profile = this.getUserProfile();
        const avatars = this.getUserAvatarOptions();
        const previewAvatarSrc = this.getAvatarThumbSrc(profile.avatar, profile.avatar);

        const profileSection = this.createSection(t('settings.user'));
        const profileCard = document.createElement('div');
        profileCard.className = 'fluent-setting-item settings-user-profile-card';
        profileCard.style.cursor = 'pointer';
        profileCard.innerHTML = `
            <div class="settings-user-avatar-preview">
                <img src="${previewAvatarSrc}" data-avatar-preview="1" alt="avatar" loading="lazy" decoding="async">
            </div>
            <div class="settings-user-profile-text">
                <div class="settings-user-profile-name">${profile.name}</div>
                <div class="settings-user-profile-email">${this.maskEmail(profile.email)}</div>
            </div>
        `;
        profileCard.addEventListener('click', () => this._showAccountDialog());
        profileSection.appendChild(profileCard);

        const avatarGrid = document.createElement('div');
        avatarGrid.className = 'settings-user-avatar-grid';
        avatars.forEach((avatarPath, index) => {
            const avatarBtn = document.createElement('button');
            avatarBtn.className = `settings-user-avatar-item ${avatarPath === profile.avatar ? 'selected' : ''}`;
            const thumbSrc = this.getAvatarThumbSrc(avatarPath, avatarPath);
            const avatarKey = encodeURIComponent(avatarPath);
            avatarBtn.innerHTML = `<img src="${thumbSrc}" data-avatar-key="${avatarKey}" alt="avatar-${index + 1}" loading="lazy" decoding="async">`;
            avatarBtn.addEventListener('click', () => {
                State.updateSettings({ userAvatar: avatarPath });
                this.addRecentSetting(
                    t('settings.user.recent-avatar'),
                    t('settings.user.recent-avatar-index', { index: index + 1 }),
                    'user'
                );
                State.addNotification({
                    title: t('settings.user'),
                    message: t('settings.user.avatar-updated'),
                    type: 'success'
                });
                this.render();
            });
            avatarGrid.appendChild(avatarBtn);
        });
        profileSection.appendChild(avatarGrid);

        const thumbSources = profile.avatar && !avatars.includes(profile.avatar)
            ? [...avatars, profile.avatar]
            : avatars.slice();
        requestAnimationFrame(() => {
            this.ensureAvatarThumbs(thumbSources);
        });

        const avatarUploadInput = document.createElement('input');
        avatarUploadInput.type = 'file';
        avatarUploadInput.accept = 'image/*';
        avatarUploadInput.style.display = 'none';
        avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type || !file.type.startsWith('image/')) {
                FluentUI.Toast({
                    title: t('settings.user'),
                    message: t('settings.user.avatar-file-invalid'),
                    type: 'error'
                });
                avatarUploadInput.value = '';
                return;
            }

            this.resizeImageFileToDataUrl(file, 192, 0.8)
                .then((dataUrl) => {
                    State.updateSettings({ userAvatar: dataUrl });
                    this.addRecentSetting(
                        t('settings.user.recent-avatar'),
                        t('settings.user.recent-avatar-custom'),
                        'user'
                    );
                    State.addNotification({
                        title: t('settings.user'),
                        message: t('settings.user.custom-avatar-updated'),
                        type: 'success'
                    });
                    this.render();
                })
                .catch(() => {
                    FluentUI.Toast({
                        title: t('settings.user'),
                        message: t('settings.user.avatar-read-failed'),
                        type: 'error'
                    });
                })
                .finally(() => {
                    avatarUploadInput.value = '';
                });
        });

        const avatarActions = document.createElement('div');
        avatarActions.className = 'settings-user-avatar-actions';
        avatarActions.appendChild(FluentUI.Button({
            text: t('settings.user.upload-avatar'),
            variant: 'secondary',
            onClick: () => avatarUploadInput.click()
        }));
        avatarActions.appendChild(FluentUI.Button({
            text: t('settings.user.restore-avatar'),
            variant: 'secondary',
            onClick: () => {
                State.updateSettings({ userAvatar: 'Theme/Profile_img/UserAva.jpg' });
                this.addRecentSetting(
                    t('settings.user.recent-avatar'),
                    t('settings.user.recent-avatar-default'),
                    'user'
                );
                State.addNotification({
                    title: t('settings.user'),
                    message: t('settings.user.default-avatar-restored'),
                    type: 'info'
                });
                this.render();
            }
        }));
        profileCard.appendChild(avatarActions);
        profileSection.appendChild(avatarUploadInput);
        container.appendChild(profileSection);

        const fallbackName = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.username')
            : 'Owner';
        const fallbackEmail = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.email')
            : 'owner@sample.com';
        const profileNameEl = profileCard.querySelector('.settings-user-profile-name');
        const profileEmailEl = profileCard.querySelector('.settings-user-profile-email');
        const syncProfilePreviewText = (name, email) => {
            if (profileNameEl) profileNameEl.textContent = String(name || '').trim() || fallbackName;
            if (profileEmailEl) profileEmailEl.textContent = this.maskEmail(String(email || '').trim() || fallbackEmail);
        };

        const infoSection = this.createSection(t('settings.user.info-section'));
        const nameInput = FluentUI.Input({
            value: profile.name,
            placeholder: t('settings.user.name-placeholder'),
            onChange: (value) => {
                const nextName = String(value || '');
                State.updateSettings({ userName: nextName });
                syncProfilePreviewText(nextName, emailInput.getValue());
                // 同步名称到 Supabase
                if (typeof window !== 'undefined' && window.supabaseClient && State?.session?.isLoggedIn) {
                    try {
                        window.supabaseClient.auth.updateUser({
                            data: { display_name: nextName }
                        }).catch(() => {});
                    } catch (e) {}
                }
            }
        });
        infoSection.appendChild(FluentUI.SettingItem({
            label: t('settings.user.name'),
            description: t('settings.user.lock-preview-desc'),
            control: nameInput
        }));

        const emailInput = FluentUI.Input({
            value: profile.email,
            placeholder: t('settings.user.email-placeholder'),
            onChange: (value) => {
                const nextEmail = String(value || '');
                State.updateSettings({ userEmail: nextEmail });
                syncProfilePreviewText(nameInput.getValue(), nextEmail);
            }
        });
        infoSection.appendChild(FluentUI.SettingItem({
            label: t('settings.user.email'),
            description: t('settings.user.lock-preview-desc'),
            control: emailInput
        }));
        container.appendChild(infoSection);

        const resetSection = this.createSection(t('settings.user.data-clear-section'));
        const resetCard = document.createElement('div');
        resetCard.className = 'fluent-setting-item settings-user-danger-content';
        resetCard.innerHTML = `
            <div class="settings-user-danger-text">
                ${t('settings.user.data-clear-description')}
            </div>
        `;
        resetCard.appendChild(FluentUI.Button({
            text: t('settings.user.data-clear-button'),
            variant: 'danger',
            onClick: () => this.confirmDataClear()
        }));
        resetSection.appendChild(resetCard);
        container.appendChild(resetSection);
    },

    confirmDataClear() {
        const delaySeconds = 5;
        let remaining = delaySeconds;
        let timer = null;

        const dialogRef = FluentUI.Dialog({
            type: 'warning',
            title: t('settings.user.data-clear-dialog-title'),
            closeOnOverlay: false,
            content: `
                <div class="settings-reset-warning">
                    <div>${t('settings.user.data-clear-dialog-line1')}</div>
                    <div>${t('settings.user.data-clear-dialog-line2')}</div>
                    <div id="settings-reset-countdown" class="settings-reset-countdown">${t('settings.user.data-clear-dialog-countdown', { seconds: delaySeconds })}</div>
                </div>
            `,
            buttons: [
                { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                { text: t('settings.user.data-clear-dialog-continue-seconds', { seconds: delaySeconds }), variant: 'danger', value: 'continue' }
            ],
            onClose: (result) => {
                if (timer) clearInterval(timer);
                if (result === 'continue') {
                    this.promptDataClearPin();
                }
            }
        });

        const continueBtn = dialogRef.dialog.querySelector('.fluent-btn-danger');
        const continueBtnText = continueBtn?.querySelector('.fluent-btn-text');
        const countdownEl = dialogRef.dialog.querySelector('#settings-reset-countdown');
        if (continueBtn) continueBtn.disabled = true;

        timer = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(timer);
                timer = null;
                if (continueBtn) continueBtn.disabled = false;
                if (continueBtnText) continueBtnText.textContent = t('settings.user.data-clear-dialog-continue');
                if (countdownEl) countdownEl.textContent = t('settings.user.data-clear-dialog-unlocked');
                return;
            }

            if (continueBtnText) continueBtnText.textContent = t('settings.user.data-clear-dialog-continue-seconds', { seconds: remaining });
            if (countdownEl) countdownEl.textContent = t('settings.user.data-clear-dialog-countdown', { seconds: remaining });
        }, 1000);
    },

    promptDataClearPin() {
        const currentPin = String(State.settings.pin || '1234');
        FluentUI.InputDialog({
            title: t('settings.user.pin-title'),
            placeholder: t('settings.user.pin-placeholder'),
            inputType: 'password',
            confirmText: t('settings.user.pin-confirm'),
            cancelText: t('cancel'),
            closeOnOverlay: false,
            validateFn: (value) => {
                const pin = String(value || '').trim();
                if (!pin) return t('settings.user.pin-required');
                if (pin !== currentPin) return t('settings.user.pin-invalid');
                return true;
            },
            onConfirm: () => this.runDataClearAndReboot()
        });
    },

    async runDataClearAndReboot() {
        if (this._dataClearRunning) return;
        this._dataClearRunning = true;
        FluentUI.Toast({
            title: t('settings.title'),
            message: t('settings.user.data-clear-rebooting'),
            type: 'warning'
        });

        try {
            if (typeof WindowManager !== 'undefined' && Array.isArray(WindowManager.windows)) {
                WindowManager.windows.slice().forEach((windowData) => {
                    if (windowData?.id !== this.windowId) WindowManager.closeWindow(windowData.id);
                });
                await new Promise(resolve => setTimeout(resolve, 120));
            }
            await Storage.clearAllUserData();
            window.location.reload();
        } catch (error) {
            this._dataClearRunning = false;
            console.error('[SettingsApp] Full user data clear failed', error);
            const failedAreas = (error?.failures || []).map(item => item.label).join(', ');
            FluentUI.Toast({
                title: t('settings.title'),
                message: I18n.currentLang === 'en'
                    ? `Some browser data could not be deleted${failedAreas ? `: ${failedAreas}` : ''}. Nothing was reset.`
                    : `部分浏览器数据无法删除${failedAreas ? `：${failedAreas}` : ''}，系统未执行重置。`,
                type: 'error',
                duration: 8000
            });
        }
    },

    // 网络页面
    renderNetwork(container) {
        container.className = 'settings-content settings-network';
        
        // 顶部以太网状态卡片
        const ethernetHero = document.createElement('div');
        ethernetHero.className = 'network-hero-card';
        ethernetHero.innerHTML = `
            <div class="network-hero-icon">
                <img src="Theme/Icon/Symbol_icon/stroke/Ethernet.svg" alt="Ethernet">
            </div>
            <div class="network-hero-info">
                <h2>${t('settings.ethernet')} 4</h2>
                <div class="network-hero-status">
                    <span class="network-status-dot connected"></span>
                    <span>${t('settings.connected')}</span>
                </div>
            </div>
            <div class="network-hero-actions">
                <span class="network-hero-link">${t('properties')}</span>
                <span class="network-hero-link">${t('settings.data-usage')}</span>
            </div>
        `;
        container.appendChild(ethernetHero);
        
        // 网络选项列表
        const networkList = document.createElement('div');
        networkList.className = 'network-options-list';
        
        // 以太网选项
        const ethernetItem = document.createElement('div');
        ethernetItem.className = 'network-option-item';
        ethernetItem.innerHTML = `
            <div class="network-option-icon">
                <img src="Theme/Icon/Symbol_icon/stroke/Ethernet.svg" alt="">
            </div>
            <div class="network-option-info">
                <h4>${t('settings.ethernet')}</h4>
                <p>${t('settings.ethernet-desc')}</p>
            </div>
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" class="network-option-arrow" alt="">
        `;
        networkList.appendChild(ethernetItem);

        // 移动端彩蛋：蜂窝网络 - 未插入 SIM 卡
        const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent)
            || (window.innerWidth <= 1024 && 'ontouchstart' in window);
        if (isMobileOrTablet) {
            const cellularItem = document.createElement('div');
            cellularItem.className = 'network-option-item';
            cellularItem.style.cursor = 'default';
            cellularItem.innerHTML = `
                <div class="network-option-icon">
                    <img src="Theme/Icon/Symbol_icon/stroke/Cellular.svg" alt="" onerror="this.style.opacity='0.3'">
                </div>
                <div class="network-option-info">
                    <h4>${t('settings.cellular') || '蜂窝网络'}</h4>
                    <p style="color:var(--text-secondary);">${t('settings.no-sim') || '未插入 SIM 或加入 eSIM 电话卡'}</p>
                </div>
            `;
            networkList.appendChild(cellularItem);
        }

        // 蓝牙选项（可展开）
        const btExpanded = State.settings.bluetoothExpanded || false;
        const btEnabled = State.settings.bluetoothEnabled !== false;
        
        const btItem = document.createElement('div');
        btItem.className = 'network-option-item network-option-expandable';
        btItem.innerHTML = `
            <div class="network-option-icon bluetooth-icon ${btEnabled ? 'enabled' : 'disabled'}">
                <img src="Theme/Icon/Symbol_icon/stroke/Bluetooth_${btEnabled ? 'open' : 'close'}.svg" alt="">
            </div>
            <div class="network-option-info">
                <h4>${t('settings.bluetooth-name')}</h4>
                <p>${btEnabled ? t('settings.bluetooth-on') : t('settings.bluetooth-off')}</p>
            </div>
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow ${btExpanded ? 'Down' : 'Right'}.svg" class="network-option-arrow expand-arrow" alt="">
        `;
        btItem.addEventListener('click', (e) => {
            if (!e.target.closest('.fluent-toggle')) {
                State.updateSettings({ bluetoothExpanded: !btExpanded });
                this.render();
            }
        });
        networkList.appendChild(btItem);
        
        // 蓝牙展开内容
        if (btExpanded) {
            const btPanel = document.createElement('div');
            btPanel.className = 'network-expand-panel';
            
            // 蓝牙开关
            const btToggleRow = document.createElement('div');
            btToggleRow.className = 'network-expand-row';
            btToggleRow.innerHTML = `<span>${t('settings.bluetooth-name')}</span>`;
            const btToggle = FluentUI.Toggle({
                checked: btEnabled,
                onChange: (v) => {
                    State.updateSettings({ bluetoothEnabled: v });
                    this.addRecentSetting(t('settings.bluetooth-name'), v ? t('settings.on') : t('settings.off'), 'network');
                    State.addNotification({ title: t('settings.bluetooth-name'), message: v ? t('settings.bluetooth-enabled') : t('settings.bluetooth-disabled'), type: 'info' });
                    // 同步控制中心
                    if (typeof ControlCenter !== 'undefined') {
                        ControlCenter.updateTiles();
                    }
                    this.render();
                }
            });
            btToggleRow.appendChild(btToggle);
            btPanel.appendChild(btToggleRow);
            
            if (btEnabled) {
                // 设备发现
                const discoverRow = document.createElement('div');
                discoverRow.className = 'network-expand-row';
                discoverRow.innerHTML = `<span>${t('settings.device-discovery')}</span>`;
                discoverRow.appendChild(FluentUI.Toggle({ checked: true }));
                btPanel.appendChild(discoverRow);
                
                // 设备列表
                const deviceList = document.createElement('div');
                deviceList.className = 'network-device-list';
                deviceList.innerHTML = `
                    <div class="network-device-empty">
                        <img src="Theme/Icon/Symbol_icon/stroke/Bluetooth_open.svg" alt="">
                        <p>${t('settings.no-bt-device')}</p>
                        <span>${t('settings.no-bt-device-desc')}</span>
                    </div>
                `;
                btPanel.appendChild(deviceList);
            }
            
            networkList.appendChild(btPanel);
        }
        
        container.appendChild(networkList);
    },
    
    // 时间和语言页面
    renderTimeLanguage(container) {
        // 时间设置
        const timeSection = this.createSection(t('settings.time'));

        timeSection.appendChild(FluentUI.SettingItem({
            label: t('settings.auto-sync-time'),
            description: t('settings.auto-sync-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.autoSyncTime !== false,
                onChange: (v) => {
                    State.updateSettings({ autoSyncTime: v });
                    this.addRecentSetting(t('settings.auto-sync-time'), v ? t('settings.on') : t('settings.off'), 'time-language');
                    State.addNotification({ title: t('settings.time'), message: v ? t('settings.auto-sync-on') : t('settings.auto-sync-off'), type: 'info' });
                }
            })
        }));

        timeSection.appendChild(FluentUI.SettingItem({
            label: t('settings.use-local-time'),
            description: t('settings.use-local-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.useLocalTime === true,
                onChange: (v) => {
                    State.updateSettings({ useLocalTime: v });
                    this.addRecentSetting(t('settings.use-local-time'), v ? t('settings.on') : t('settings.off'), 'time-language');
                    State.addNotification({ title: t('settings.time'), message: v ? t('settings.local-time-on') : t('settings.local-time-off'), type: 'info' });
                }
            })
        }));

        container.appendChild(timeSection);

        // 语言设置
        const langSection = this.createSection(t('settings.language'));
        langSection.appendChild(FluentUI.SettingItem({
            label: t('settings.language.display'),
            description: t('settings.language.desc'),
            control: FluentUI.Select({
                options: [
                    { value: 'zh', label: t('settings.lang-zh') },
                    { value: 'en', label: t('settings.lang-en') },
                    { value: 'ja', label: t('settings.lang-ja') },
                    { value: 'th', label: t('settings.lang-th') },
                    { value: 'de', label: t('settings.lang-de') }
                ],
                value: State.settings.language,
                onChange: (v) => {
                    I18n.setLanguage(v);
                    const langLabels = { zh: t('settings.lang-zh'), en: t('settings.lang-en'), ja: t('settings.lang-ja'), th: t('settings.lang-th'), de: t('settings.lang-de') };
                    this.addRecentSetting(t('settings.language.display'), langLabels[v], 'time-language');
                    State.addNotification({ title: t('settings.language'), message: t('settings.language.changed'), type: 'info' });
                }
            })
        }));
        container.appendChild(langSection);
    },

    renderMultitask(container) {
        container.className = 'settings-content';
        const performanceSection = this.createSection(t('settings.performance-title'));

        performanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.tombstone-background'),
            description: t('settings.tombstone-background-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.tombstoneBackgroundEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ tombstoneBackgroundEnabled: v });
                    this.addRecentSetting(t('settings.tombstone-background'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.performance-title'),
                        message: v ? t('settings.tombstone-background-on') : t('settings.tombstone-background-off'),
                        type: 'info'
                    });
                }
            })
        }));

        container.appendChild(performanceSection);

        const section = this.createSection(t('settings.multitask-window-title'));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-quick-switch'),
            description: t('settings.multitask-quick-switch-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.quickWindowSwitchEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ quickWindowSwitchEnabled: v });
                    this.addRecentSetting(t('settings.multitask-quick-switch'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-quick-switch-on') : t('settings.multitask-quick-switch-off'),
                        type: 'info'
                    });
                    if (!v && typeof AppSwitcher !== 'undefined' && typeof AppSwitcher.close === 'function') {
                        AppSwitcher.close(false);
                    }
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-edge-snap'),
            description: t('settings.multitask-edge-snap-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.windowEdgeSnapEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ windowEdgeSnapEnabled: v });
                    this.addRecentSetting(t('settings.multitask-edge-snap'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-edge-snap-on') : t('settings.multitask-edge-snap-off'),
                        type: 'info'
                    });
                    if (!v && typeof WindowManager !== 'undefined' && typeof WindowManager._hideDragSnapHint === 'function') {
                        WindowManager._hideDragSnapHint(true);
                    }
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-hover-snap'),
            description: t('settings.multitask-hover-snap-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.windowHoverSnapEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ windowHoverSnapEnabled: v });
                    this.addRecentSetting(t('settings.multitask-hover-snap'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-hover-snap-on') : t('settings.multitask-hover-snap-off'),
                        type: 'info'
                    });
                    if (!v && typeof WindowManager !== 'undefined' && typeof WindowManager._hideAllSnapMenus === 'function') {
                        WindowManager._hideAllSnapMenus();
                    }
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-top-maximize'),
            description: t('settings.multitask-top-maximize-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.windowTopMaximizeEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ windowTopMaximizeEnabled: v });
                    this.addRecentSetting(t('settings.multitask-top-maximize'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-top-maximize-on') : t('settings.multitask-top-maximize-off'),
                        type: 'info'
                    });
                    if (!v && typeof WindowManager !== 'undefined' && typeof WindowManager._hideDragSnapHint === 'function') {
                        WindowManager._hideDragSnapHint(true);
                    }
                }
            })
        }));

        container.appendChild(section);
    },
    
    // 隐私页面（原系统页面）
    renderPrivacy(container) {
        // 安全设置
        const securitySection = this.createSection(t('settings.security'));
        securitySection.appendChild(FluentUI.SettingItem({
            label: t('settings.change-pin'),
            description: t('settings.change-pin.desc'),
            control: FluentUI.Button({
                text: t('settings.change-pin.btn'),
                variant: 'primary',
                onClick: () => {
                    FluentUI.InputDialog({
                        title: t('settings.change-pin.prompt'),
                        placeholder: t('settings.change-pin.placeholder'),
                        inputType: 'password',
                        minLength: 4,
                        maxLength: 10,
                        validateFn: (value) => {
                            if (value.length < 4) return t('settings.change-pin.error');
                            if (value.length > 10) return t('settings.change-pin.error');
                            return true;
                        },
                        confirmText: t('settings.confirm-pin'),
                        cancelText: t('cancel'),
                        onConfirm: (newPin) => {
                            State.updateSettings({ pin: newPin });
                            this.addRecentSetting(t('settings.change-pin'), t('settings.change-pin.success'), 'privacy');
                            FluentUI.Toast({
                                title: t('settings.security'),
                                message: t('settings.change-pin.success'),
                                type: 'success'
                            });
                        }
                    });
                }
            })
        }));
        container.appendChild(securitySection);

        // 隐私设置
        const privacySection = this.createSection(t('settings.privacy-title'));
        privacySection.appendChild(FluentUI.SettingItem({
            label: t('settings.location-service'),
            description: t('settings.location-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.locationEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ locationEnabled: v });
                    this.addRecentSetting(t('settings.location-service'), v ? t('settings.on') : t('settings.off'), 'privacy');
                    State.addNotification({ title: t('settings.privacy-title'), message: v ? t('settings.location-on') : t('settings.location-off'), type: 'info' });
                }
            })
        }));

        const strictCspItem = FluentUI.SettingItem({
            label: t('settings.strict-csp'),
            description: t('settings.strict-csp-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.strictCspEnabled === true,
                onChange: (v) => {
                    const updates = { strictCspEnabled: v };
                    if (!v && State.settings.SurfCustomMode) {
                        updates.SurfCustomMode = false;
                        // Keep last custom-mode preference so startup CSP restore can recover it.
                        updates.SurfCustomLastEnabled = true;
                    }
                    State.updateSettings(updates);
                    this.addRecentSetting(t('settings.strict-csp'), v ? t('settings.on') : t('settings.off'), 'privacy');
                    State.addNotification({
                        title: t('settings.privacy-title'),
                        message: v ? t('settings.strict-csp-on') : t('settings.strict-csp-off'),
                        type: 'info'
                    });
                }
            })
        });
        strictCspItem.dataset.settingId = 'privacy-strict-csp';
        privacySection.appendChild(strictCspItem);
        container.appendChild(privacySection);
    },

    renderSurf(container) {
        // 隐私
        const privSection = this.createSection(t('settings.Surf-privacy'));
        privSection.appendChild(FluentUI.SettingItem({
            label: t('settings.Surf-uxplan'),
            description: t('settings.Surf-uxplan-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.SurfUXPlan || false,
                onChange: (v) => {
                    State.updateSettings({ SurfUXPlan: v });
                    this.addRecentSetting(t('settings.Surf-uxplan'), v ? t('settings.on') : t('settings.off'), 'Surf');
                }
            })
        }));
        container.appendChild(privSection);

        // 对话模式
        const modeSection = this.createSection(t('settings.Surf-mode'));
        const customEnabled = State.settings.SurfCustomMode || false;
        let customOptionsWrap = null;
        modeSection.appendChild(FluentUI.SettingItem({
            label: t('settings.Surf-custom'),
            description: t('settings.Surf-custom-desc'),
            control: FluentUI.Toggle({
                checked: customEnabled,
                onChange: (v) => {
                    if (this._SurfModeAnimating) return;
                    if (v) {
                        const enableCustomMode = () => {
                            State.updateSettings({ SurfCustomMode: true });
                            this.addRecentSetting(t('settings.Surf-custom'), t('settings.on'), 'Surf');
                            this._pendingSurfCustomEnter = true;
                            this._SurfCustomRiskAcknowledgedForCsp = false;
                            this.render();
                        };

                        const promptEnableCsp = () => {
                            this._showSurfCustomRequireCspDialog().then((goEnableCsp) => {
                                if (goEnableCsp) {
                                    this._goPrivacyAndHighlightStrictCsp();
                                    return;
                                }
                                this.render();
                            });
                        };

                        const strictEnabled = State.settings.strictCspEnabled === true;
                        if (this._SurfCustomRiskAcknowledgedForCsp) {
                            if (strictEnabled) enableCustomMode();
                            else promptEnableCsp();
                            return;
                        }

                        this._showSurfCustomRiskDialog().then((accepted) => {
                            if (!accepted) {
                                this.render();
                                return;
                            }
                            if (State.settings.strictCspEnabled !== true) {
                                this._SurfCustomRiskAcknowledgedForCsp = true;
                                promptEnableCsp();
                                return;
                            }
                            enableCustomMode();
                        });
                        return;
                    }

                    this.addRecentSetting(t('settings.Surf-custom'), t('settings.off'), 'Surf');

                    const finishDisable = () => {
                        State.updateSettings({ SurfCustomMode: false });
                        this._SurfCustomRiskAcknowledgedForCsp = false;
                        this.render();
                        this._SurfModeAnimating = false;
                    };

                    this._SurfModeAnimating = true;
                    if (customOptionsWrap) {
                        customOptionsWrap.classList.remove('anim-in');
                        customOptionsWrap.classList.add('anim-out');
                        setTimeout(finishDisable, 430);
                    } else {
                        finishDisable();
                    }
                }
            })
        }));

        if (customEnabled) {
            customOptionsWrap = document.createElement('div');
            customOptionsWrap.className = 'settings-Surf-custom-options';

            const providerItem = FluentUI.SettingItem({
                label: t('settings.Surf-provider'),
                control: FluentUI.Select({
                    options: [
                        { value: 'openai', label: 'OpenAI' },
                        { value: 'siliconflow', label: '硅基流动 (SiliconFlow)' }
                    ],
                    value: State.settings.SurfProvider || 'openai',
                    onChange: (v) => State.updateSettings({ SurfProvider: v })
                })
            });
            providerItem.style.setProperty('--Surf-stagger-index', '0');
            customOptionsWrap.appendChild(providerItem);

            const saveModeItem = FluentUI.SettingItem({
                label: t('settings.Surf-key-save-mode'),
                description: t('settings.Surf-key-save-mode-desc'),
                control: FluentUI.Select({
                    options: [
                        { value: 'temporary', label: t('settings.Surf-key-mode-temporary') },
                        { value: 'permanent', label: t('settings.Surf-key-mode-permanent') }
                    ],
                    value: State.settings.SurfApiSaveMode === 'permanent' ? 'permanent' : 'temporary',
                    onChange: (v) => State.updateSettings({ SurfApiSaveMode: v })
                })
            });
            saveModeItem.style.setProperty('--Surf-stagger-index', '1');
            customOptionsWrap.appendChild(saveModeItem);

            const keyWrapper = document.createElement('div');
            keyWrapper.className = 'fluent-setting-item';
            keyWrapper.style.cssText = 'display:flex;flex-direction:column;align-items:stretch;gap:10px';
            keyWrapper.style.setProperty('--Surf-stagger-index', '2');
            const keyLabel = document.createElement('div');
            keyLabel.className = 'fluent-setting-item-label';
            keyLabel.textContent = t('settings.Surf-apikey');
            const keyRow = document.createElement('div');
            keyRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
            const currentStorageType = (typeof Surf !== 'undefined' && typeof Surf.getApiKeyStorageType === 'function')
                ? Surf.getApiKeyStorageType()
                : (State.settings.SurfApiStorageType || 'none');
            const sessionKey = (typeof Surf !== 'undefined' && typeof Surf.getSessionApiKey === 'function')
                ? (Surf.getSessionApiKey() || '')
                : '';
            const encryptedLocked = currentStorageType === 'permanent-encrypted' && !sessionKey;
            const uiKeyValue = (typeof Surf !== 'undefined' && typeof Surf.getSessionApiKey === 'function')
                ? (Surf.getSessionApiKey() || '')
                : '';
            const keyInput = FluentUI.Input({
                type: 'password',
                placeholder: encryptedLocked ? t('settings.Surf-key-encrypted-placeholder') : t('settings.Surf-apikey-placeholder'),
                value: uiKeyValue
            });
            keyInput.style.flex = '1';
            keyInput.style.minWidth = '220px';
            const saveBtn = FluentUI.Button({
                text: t('settings.Surf-save'),
                variant: 'primary',
                onClick: async () => {
                    const val = (keyInput.getValue ? keyInput.getValue() : keyInput.querySelector('input').value).trim();
                    if (!val) {
                        if (encryptedLocked) {
                            FluentUI.Toast({
                                title: t('settings.Surf'),
                                message: t('settings.Surf-key-encrypted-use-tip'),
                                type: 'info'
                            });
                            return;
                        }
                        if (typeof Surf !== 'undefined' && typeof Surf.clearApiKey === 'function') {
                            Surf.clearApiKey();
                        } else {
                            State.updateSettings({ SurfApiKey: '', SurfApiEncrypted: null, SurfApiStorageType: 'none' });
                        }
                        FluentUI.Toast({ title: t('settings.Surf'), message: t('settings.Surf-key-cleared'), type: 'success' });
                        this.render();
                        return;
                    }

                    const saveMode = State.settings.SurfApiSaveMode === 'permanent' ? 'permanent' : 'temporary';
                    if (saveMode === 'temporary') {
                        if (typeof Surf !== 'undefined' && typeof Surf.saveApiKeyTemporary === 'function') {
                            Surf.saveApiKeyTemporary(val);
                        } else {
                            State.updateSettings({ SurfApiKey: '', SurfApiEncrypted: null, SurfApiStorageType: 'session' });
                        }
                        FluentUI.Toast({ title: t('settings.Surf'), message: t('settings.Surf-temp-saved'), type: 'success' });
                        this.render();
                        return;
                    }

                    this._handleSurfPermanentSave(val);
                }
            });
            const clearBtn = FluentUI.Button({
                text: t('settings.Surf-clear-key'),
                variant: 'secondary',
                onClick: () => {
                    if (typeof Surf !== 'undefined' && typeof Surf.clearApiKey === 'function') {
                        Surf.clearApiKey();
                    } else {
                        State.updateSettings({ SurfApiKey: '', SurfApiEncrypted: null, SurfApiStorageType: 'none' });
                    }
                    FluentUI.Toast({ title: t('settings.Surf'), message: t('settings.Surf-key-cleared'), type: 'success' });
                    this.render();
                }
            });
            keyRow.appendChild(keyInput);
            keyRow.appendChild(saveBtn);
            keyRow.appendChild(clearBtn);
            const keyStatus = document.createElement('div');
            keyStatus.className = 'fluent-setting-item-desc';
            keyStatus.style.marginTop = '2px';
            keyStatus.textContent = this._getSurfApiStorageStatusText(
                (typeof Surf !== 'undefined' && typeof Surf.getApiKeyStorageType === 'function')
                    ? Surf.getApiKeyStorageType()
                    : (State.settings.SurfApiStorageType || 'none')
            );
            keyWrapper.appendChild(keyLabel);
            keyWrapper.appendChild(keyRow);
            keyWrapper.appendChild(keyStatus);
            customOptionsWrap.appendChild(keyWrapper);

            modeSection.appendChild(customOptionsWrap);
            if (this._pendingSurfCustomEnter) {
                this._pendingSurfCustomEnter = false;
                requestAnimationFrame(() => {
                    customOptionsWrap?.classList.add('anim-in');
                    setTimeout(() => customOptionsWrap?.classList.remove('anim-in'), 660);
                });
            }
        }
        container.appendChild(modeSection);

        // 关于
        const aboutSection = this.createSection(t('settings.Surf-about'));
        const aboutText = document.createElement('div');
        aboutText.className = 'fluent-setting-item';
        aboutText.innerHTML = `<div class="fluent-setting-item-info"><div class="fluent-setting-item-desc" style="font-size:13px;line-height:1.6">${t('settings.Surf-about-text')}</div></div>`;
        aboutSection.appendChild(aboutText);
        container.appendChild(aboutSection);
    },

    _showSurfCustomRiskDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(false);
                return;
            }

            let timer = null;
            const dialogRef = FluentUI.Dialog({
                type: 'warning',
                title: t('settings.Surf-custom-risk-title'),
                content: `<div class="Surf-custom-risk-content">${t('settings.Surf-custom-risk-content')}</div>`,
                closeOnOverlay: false,
                buttons: [
                    { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                    { text: t('settings.Surf-custom-risk-ack'), variant: 'primary', value: 'confirm' }
                ],
                onClose: (result) => {
                    if (timer) clearInterval(timer);
                    resolve(result === 'confirm');
                }
            });

            const buttons = dialogRef?.dialog?.querySelectorAll('.fluent-dialog-footer .fluent-btn');
            const confirmBtn = buttons && buttons.length ? buttons[buttons.length - 1] : null;
            if (!confirmBtn) return;

            const textEl = confirmBtn.querySelector('.fluent-btn-text');
            const setConfirmText = (txt) => {
                if (textEl) textEl.textContent = txt;
                else confirmBtn.textContent = txt;
            };

            let remaining = 10;
            confirmBtn.disabled = true;
            setConfirmText(t('settings.Surf-custom-risk-ack-countdown', { seconds: remaining }));

            timer = setInterval(() => {
                remaining -= 1;
                if (remaining > 0) {
                    setConfirmText(t('settings.Surf-custom-risk-ack-countdown', { seconds: remaining }));
                    return;
                }
                clearInterval(timer);
                confirmBtn.disabled = false;
                setConfirmText(t('settings.Surf-custom-risk-ack'));
            }, 1000);
        });
    },

    _showSurfCustomRequireCspDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(window.confirm(t('settings.Surf-custom-csp-required-content')));
                return;
            }

            FluentUI.Dialog({
                type: 'warning',
                title: t('settings.Surf-custom-csp-required-title'),
                content: `<div class="Surf-custom-risk-content">${t('settings.Surf-custom-csp-required-content')}</div>`,
                closeOnOverlay: false,
                buttons: [
                    { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                    { text: t('settings.Surf-custom-csp-required-go'), variant: 'primary', value: 'go' }
                ],
                onClose: (result) => resolve(result === 'go')
            });
        });
    },

    _goPrivacyAndHighlightStrictCsp() {
        this.navigateToPage('privacy', {
            after: () => this.highlightSettingByDataId('privacy-strict-csp', 1200),
            delay: 220
        });
    },

    _getSurfApiStorageStatusText(type) {
        switch (type) {
            case 'session':
                return t('settings.Surf-key-status-session');
            case 'permanent-plain':
                return t('settings.Surf-key-status-plain');
            case 'permanent-encrypted':
                return t('settings.Surf-key-status-encrypted');
            default:
                return t('settings.Surf-key-status-none');
        }
    },

    _promptSurfEncryptPassphrase() {
        return new Promise((resolve) => {
            FluentUI.InputDialog({
                title: t('settings.Surf-encrypt-passphrase-title'),
                placeholder: t('settings.Surf-encrypt-passphrase-placeholder'),
                inputType: 'password',
                minLength: 8,
                validateFn: (value) => value.length >= 8 || t('settings.Surf-encrypt-passphrase-error'),
                confirmText: t('ok'),
                cancelText: t('cancel'),
                onConfirm: (passphrase) => resolve(passphrase),
                onCancel: () => resolve(null)
            });
        });
    },

    _handleSurfPermanentSave(apiKey) {
        FluentUI.Dialog({
            type: 'warning',
            title: t('settings.Surf-perm-save-title'),
            content: t('settings.Surf-perm-save-content'),
            buttons: [
                { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                { text: t('settings.Surf-perm-save-encrypted'), variant: 'primary', value: 'encrypted' }
            ],
            onClose: async (result) => {
                if (result !== 'encrypted') return;

                const passphrase = await this._promptSurfEncryptPassphrase();
                if (!passphrase) return;

                try {
                    if (typeof Surf !== 'undefined' && typeof Surf.saveApiKeyPermanentEncrypted === 'function') {
                        await Surf.saveApiKeyPermanentEncrypted(apiKey, passphrase);
                    } else {
                        throw new Error(t('settings.Surf-webcrypto-unavailable'));
                    }
                    FluentUI.Toast({ title: t('settings.Surf'), message: t('settings.Surf-perm-encrypted-saved'), type: 'success' });
                    this.render();
                } catch (error) {
                    FluentUI.Toast({
                        title: t('settings.Surf'),
                        message: error?.message || t('settings.Surf-webcrypto-unavailable'),
                        type: 'error'
                    });
                }
            }
        });
    },

    renderPersonalization(container) {
        const wallpapers = [
            'Theme/Picture/Fluent-1.png', 'Theme/Picture/Fluent-2.png', 'Theme/Picture/Fluent-3.jpg',
            'Theme/Picture/Fluent-4.jpg', 'Theme/Picture/Fluent-5.png', 'Theme/Picture/Fluent-6.jpg'
        ];
        
        // 桌面壁纸
        const desktopSection = this.createSection(t('settings.desktop-wallpaper'));
        
        // 壁纸操作工具栏
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';
        
        // 1. Bing 壁纸按钮
        const bingBtn = FluentUI.Button({
            text: t('settings.bing-wallpaper'),
            icon: 'Image',
            onClick: async () => {
                // 添加加载状态
                const btn = bingBtn.querySelector('button') || bingBtn; // FluentUI.Button 返回的是 button 元素
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="fluent-btn-spinner"></span> ...';
                
                try {
                    // 使用第三方 API 获取 Bing 壁纸 URL (支持 CORS)
                    const response = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN');
                    const data = await response.json();
                    if (data && data.url) {
                        const wp = data.url;
                        await State.setWallpaper('desktop', wp, { sourceType: 'bing', sourceUrl: wp });
                        await Desktop.updateWallpaper();
                        this.addRecentSetting(t('settings.desktop-wallpaper'), t('settings.bing-wallpaper'), 'personalization');
                        State.addNotification({ title: t('settings.desktop-wallpaper'), message: t('settings.bing-applied'), type: 'success' });
                        desktopGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                    } else {
                        throw new Error('Invalid response');
                    }
                } catch (e) {
                    console.error('Bing wallpaper fetch failed', e);
                    State.addNotification({ title: t('settings.error'), message: t('settings.bing-fail'), type: 'error' });
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        });
        
        // 2. 上传壁纸按钮
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = 'image/*';
        uploadInput.style.display = 'none';
        uploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await State.setWallpaper('desktop', file, { sourceType: 'upload', name: file.name, mime: file.type });
                    await Desktop.updateWallpaper();
                    this.addRecentSetting(t('settings.desktop-wallpaper'), t('settings.custom-applied'), 'personalization');
                    State.addNotification({ title: t('settings.desktop-wallpaper'), message: t('settings.custom-applied'), type: 'success' });
                    desktopGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                } catch (error) {
                    console.error('Desktop wallpaper cache failed', error);
                    State.addNotification({ title: t('settings.error'), message: t('settings.custom-wallpaper-fail'), type: 'error' });
                }
            }
            e.target.value = '';
        };
        
        const uploadBtn = FluentUI.Button({
            text: t('settings.upload-wallpaper'),            icon: 'Upload',
            onClick: () => uploadInput.click()
        });
        
        toolbar.appendChild(bingBtn);
        toolbar.appendChild(uploadBtn);
        desktopSection.appendChild(toolbar);

        const desktopGrid = this.createWallpaperGrid(wallpapers, State.settings.wallpaperDesktop, 'desktop');
        desktopSection.appendChild(desktopGrid);
        container.appendChild(desktopSection);
        
        // 锁屏壁纸
        const lockSection = this.createSection(t('settings.lock-wallpaper'));
        
        // 锁屏壁纸工具栏
        const lockToolbar = document.createElement('div');
        lockToolbar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';
        
        const lockBingBtn = FluentUI.Button({
            text: t('settings.bing-wallpaper'),
            icon: 'Globe',
            onClick: async () => {
                try {
                    State.addNotification({ title: t('settings.lock-wallpaper'), message: t('settings.bing-fetching'), type: 'info' });
                    const response = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN');
                    const data = await response.json();
                    if (data.url) {
                        await State.setWallpaper('lock', data.url, { sourceType: 'bing', sourceUrl: data.url });
                        if (LockScreen.updateWallpaper) await LockScreen.updateWallpaper();
                        State.addNotification({ title: t('settings.lock-wallpaper'), message: t('settings.lock-bing-applied'), type: 'success' });
                        lockGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                    }
                } catch (err) {
                    State.addNotification({ title: t('settings.error'), message: t('settings.lock-bing-fail'), type: 'error' });
                }
            }
        });
        
        const lockUploadInput = document.createElement('input');
        lockUploadInput.type = 'file';
        lockUploadInput.accept = 'image/*';
        lockUploadInput.style.display = 'none';
        lockUploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await State.setWallpaper('lock', file, { sourceType: 'upload', name: file.name, mime: file.type });
                    if (LockScreen.updateWallpaper) await LockScreen.updateWallpaper();
                    State.addNotification({ title: t('settings.lock-wallpaper'), message: t('settings.lock-custom-applied'), type: 'success' });
                    lockGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                } catch (error) {
                    console.error('Lock wallpaper cache failed', error);
                    State.addNotification({ title: t('settings.error'), message: t('settings.custom-wallpaper-fail'), type: 'error' });
                }
            }
            e.target.value = '';
        };
        
        const lockUploadBtn = FluentUI.Button({
            text: t('settings.upload-wallpaper'),
        });
        
        lockToolbar.appendChild(lockBingBtn);
        lockToolbar.appendChild(lockUploadBtn);
        lockSection.appendChild(lockToolbar);
        
        const lockGrid = this.createWallpaperGrid(wallpapers, State.settings.wallpaperLock, 'lock');
        lockSection.appendChild(lockGrid);
        container.appendChild(lockSection);
        
        // 外观设置
        const appearanceSection = this.createSection(t('settings.appearance'));
        appearanceSection.classList.add('settings-appearance-section');
        
        // 主题选择 - 使用 FluentUI.SettingItem + FluentUI.Select
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.theme'),
            description: t('settings.theme.desc'),
            control: FluentUI.Select({
                options: [
                    { value: 'light', label: t('settings.theme.light') },
                    { value: 'dark', label: t('settings.theme.dark') },
                    { value: 'auto', label: t('settings.theme.auto') }
                ],
                value: State.settings.theme,
                onChange: (v) => {
                    State.updateSettings({ theme: v });
                    State.applyTheme();
                    const themeLabel = v === 'light' ? t('settings.theme.light') : v === 'dark' ? t('settings.theme.dark') : t('settings.theme.auto');
                    this.addRecentSetting(t('settings.theme'), themeLabel, 'personalization');
                    State.addNotification({ title: t('settings.theme'), message: t('settings.theme-changed'), type: 'success' });
                }
            })
        }));

        appearanceSection.appendChild(this.createAccentColorPanel());
        
        // 模糊效果
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.blur'),
            description: t('settings.blur.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableBlur,
                onChange: (v) => {
                    State.updateSettings({ enableBlur: v });
                    this.addRecentSetting(t('settings.blur'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({ title: t('settings.blur'), message: t('settings.blur-changed', { status: v ? t('settings.on') : t('settings.off') }), type: 'success' });
                }
            })
        }));
        
        // 动画效果
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.animation'),
            description: t('settings.animation.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableAnimation,
                onChange: (v) => {
                    State.updateSettings({ enableAnimation: v });
                    this.addRecentSetting(t('settings.animation'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({ title: t('settings.animation'), message: t('settings.animation-changed', { status: v ? t('settings.on') : t('settings.off') }), type: 'success' });
                }
            })
        }));
        
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.window-blur'),
            description: t('settings.window-blur.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableWindowBlur === true,
                onChange: (v) => {
                    State.updateSettings({ enableWindowBlur: v });
                    const mode = v ? t('settings.window-blur.glass') : t('settings.window-blur.solid');
                    this.addRecentSetting(t('settings.window-blur'), mode, 'personalization');
                    State.addNotification({
                        title: t('settings.window-blur'),
                        message: t('settings.window-blur-changed', { mode }),
                        type: 'success'
                    });
                }
            })
        }));
        
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: '液态玻璃效果',
            description: '为任务栏、窗口和菜单应用 Apple 风格的液态玻璃材质',
            control: FluentUI.Toggle({
                checked: localStorage.getItem('liquidGlass') === 'true',
                onChange: (v) => {
                    if (v) {
                        document.body.classList.add('liquid-glass');
                        localStorage.setItem('liquidGlass', 'true');
                    } else {
                        document.body.classList.remove('liquid-glass');
                        localStorage.setItem('liquidGlass', 'false');
                    }
                    this.addRecentSetting('液态玻璃效果', v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({
                        title: '液态玻璃效果',
                        message: v ? '液态玻璃效果已开启' : '液态玻璃效果已关闭',
                        type: 'success'
                    });
                }
            })
        }));

        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.auto-fullscreen'),
            description: t('settings.auto-fullscreen.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.autoEnterFullscreen !== false,
                onChange: (v) => {
                    State.updateSettings({ autoEnterFullscreen: v });
                    this.addRecentSetting(t('settings.auto-fullscreen'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({
                        title: t('settings.auto-fullscreen'),
                        message: t('settings.auto-fullscreen-changed', { status: v ? t('settings.on') : t('settings.off') }),
                        type: 'success'
                    });
                }
            })
        }));
        
        container.appendChild(appearanceSection);

        const advancedSection = this.createSection(t('settings.advanced-options'));
        const advancedItem = FluentUI.SettingItem({
            label: t('settings.advanced-options'),
            description: t('settings.advanced-options.desc'),
            control: (() => {
                const arrow = document.createElement('img');
                arrow.className = 'settings-entry-arrow';
                arrow.src = 'Theme/Icon/Symbol_icon/stroke/Arrow Right.svg';
                arrow.alt = '';
                return arrow;
            })(),
            className: 'settings-advanced-entry'
        });
        advancedItem.style.cursor = 'pointer';
        advancedItem.addEventListener('click', () => {
            this.navigateToPage('personalization-advanced');
        });
        advancedSection.appendChild(advancedItem);
        container.appendChild(advancedSection);
    },

    renderPersonalizationAdvanced(container) {
        container.className = 'settings-content settings-material-page';

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'settings-page-back';
        backBtn.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow Left.svg" alt="">
            <span>${t('settings.personalization')}</span>
        `;
        backBtn.addEventListener('click', () => {
            container.classList.add('slide-out');
            setTimeout(() => this.navigateToPage('personalization'), 240);
        });
        container.appendChild(backBtn);

        const section = this.createSection(t('settings.advanced-options'));
        const currentMaterial = State.settings.materialType === 'mica' ? 'mica' : 'gaussian';
        const materialLabels = {
            gaussian: t('settings.material.gaussian'),
            mica: t('settings.material.mica')
        };

        const preview = document.createElement('div');
        preview.className = `material-preview material-preview-${currentMaterial}`;
        preview.innerHTML = `
            <div class="material-preview-wallpaper"></div>
            <div class="material-preview-panel">
                <div class="material-preview-title">${t('settings.material')}</div>
                <div class="material-preview-subtitle">${materialLabels[currentMaterial]}</div>
            </div>
        `;
        section.appendChild(preview);

        let blurItem = null;

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.material'),
            description: t('settings.material.desc'),
            control: FluentUI.Select({
                value: currentMaterial,
                options: [
                    { value: 'gaussian', label: t('settings.material.gaussian') },
                    { value: 'mica', label: t('settings.material.mica') }
                ],
                onChange: (value) => {
                    State.updateSettings({ materialType: value });
                    preview.className = `material-preview material-preview-${value}`;
                    preview.querySelector('.material-preview-subtitle').textContent = materialLabels[value] || value;
                    if (blurItem) {
                        const isMica = value === 'mica';
                        blurItem.classList.toggle('settings-mica-hidden', isMica);
                        const blurSlider = blurItem.querySelector('.fluent-slider');
                        const blurSliderWrapper = blurItem.querySelector('.fluent-slider-wrapper');
                        if (blurSlider) blurSlider.disabled = isMica;
                        if (blurSliderWrapper) blurSliderWrapper.classList.toggle('fluent-slider-disabled', isMica);
                    }
                    this.addRecentSetting(t('settings.material'), materialLabels[value] || value, 'personalization');
                    State.addNotification({
                        title: t('settings.material'),
                        message: t('settings.material.changed', { material: materialLabels[value] || value }),
                        type: 'success'
                    });
                }
            })
        }));

        const blur = Math.max(10, Math.min(70, Number(State.settings.blurIntensity ?? 40)));
        blurItem = FluentUI.SettingItem({
            label: t('settings.blur-intensity'),
            description: t('settings.blur-intensity.desc'),
            control: FluentUI.Slider({
                min: 10,
                max: 70,
                value: blur,
                step: 1,
                disabled: currentMaterial === 'mica',
                showValue: true,
                onChange: (v) => State.updateSettings({ blurIntensity: v })
            }),
            className: `settings-blur-strength-item ${currentMaterial === 'mica' ? 'settings-mica-hidden' : ''}`
        });
        section.appendChild(blurItem);

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.button-glow-effect'),
            description: t('settings.button-glow-effect.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableButtonGlowEffect !== false,
                onChange: (v) => {
                    State.updateSettings({ enableButtonGlowEffect: v });
                    this.addRecentSetting(t('settings.button-glow-effect'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({
                        title: t('settings.button-glow-effect'),
                        message: v ? t('settings.on') : t('settings.off'),
                        type: 'info'
                    });
                }
            })
        }));

        container.appendChild(section);
    },

    renderLab(container) {
        // 实验室标题
        const section = this.createSection(t('settings.lab-title'));
        
        // 实验性功能说明
        const notice = document.createElement('div');
        notice.className = 'lab-notice';
        notice.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Exclamation Triangle.svg" alt="" style="width: 20px; height: 20px; opacity: 0.7;">
            <span style="font-size: 13px; color: var(--text-secondary);">${t('settings.lab-notice')}</span>
        `;
        notice.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(255, 180, 0, 0.1); border-radius: var(--radius-md); margin-bottom: 16px;';
        section.appendChild(notice);

        // 开发者中心仍处于 BETA，其显示入口归入实验室管理。
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.hide-developer-center'),
            description: t('settings.hide-developer-center-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.hideDeveloperCenter !== false,
                onChange: (value) => {
                    State.updateSettings({ hideDeveloperCenter: value });
                    this.addRecentSetting(t('settings.hide-developer-center'), value ? t('settings.on') : t('settings.off'), 'lab');
                    State.addNotification({
                        title: t('settings.lab-title'),
                        message: value ? t('settings.developer-center-hidden') : t('settings.developer-center-visible'),
                        type: 'info'
                    });
                }
            })
        }));
        
        // 外部文件导入（拖拽/上传）开关
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.lab-file-import'),
            description: t('settings.lab-file-import-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableExternalFileImport === true,
                onChange: (v) => {
                    State.updateSettings({ enableExternalFileImport: v });
                    this.addRecentSetting(t('settings.lab-file-import'), v ? t('settings.on') : t('settings.off'), 'lab');
                    State.addNotification({
                        title: t('settings.lab-title'),
                        message: `${t('settings.lab-file-import')}：${v ? t('settings.on') : t('settings.off')}`,
                        type: 'info'
                    });
                }
            })
        }));

        // 强制始终实时模糊开关(默认关闭:桌面小组件使用静态模糊贴图降低 GPU 压力)
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.lab-realtime-blur'),
            description: t('settings.lab-realtime-blur-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.forceRealtimeBlur === true,
                onChange: (v) => {
                    State.updateSettings({ forceRealtimeBlur: v });
                    this.addRecentSetting(t('settings.lab-realtime-blur'), v ? t('settings.on') : t('settings.off'), 'lab');
                    State.addNotification({
                        title: t('settings.lab-title'),
                        message: `${t('settings.lab-realtime-blur')}：${v ? t('settings.on') : t('settings.off')}`,
                        type: 'info'
                    });
                }
            })
        }));

        // Apple Intelligence 跑马灯环（仅触屏设备显示）
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) {
            section.appendChild(FluentUI.SettingItem({
                label: t('settings.lab-ai-light'),
                description: t('settings.lab-ai-light-desc'),
                control: FluentUI.Toggle({
                    checked: State.settings.aiLightRingEnabled === true,
                    onChange: (v) => {
                        State.updateSettings({ aiLightRingEnabled: v });
                        this.addRecentSetting(t('settings.lab-ai-light'), v ? t('settings.on') : t('settings.off'), 'lab');
                        State.addNotification({
                            title: t('settings.lab-title'),
                            message: `${t('settings.lab-ai-light')}：${v ? t('settings.on') : t('settings.off')}`,
                            type: 'info'
                        });
                    }
                })
            }));
        }
        
        // ========== 灵翼交互 ==========
        const lingyiSection = this.createSection(t('settings.lingyi'));
        
        // 灵翼交互功能说明
        const lingyiNotice = document.createElement('div');
        lingyiNotice.className = 'lab-notice lingyi-notice';
        lingyiNotice.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Hand.svg" alt="" style="width: 20px; height: 20px; opacity: 0.7;">
            <span style="font-size: 13px; color: var(--text-secondary);">${t('settings.lingyi-notice')}</span>
        `;
        const lingyiNoticeIcon = lingyiNotice.querySelector('img');
        if (lingyiNoticeIcon) {
            lingyiNoticeIcon.addEventListener('error', () => {
                lingyiNoticeIcon.src = 'Theme/Icon/Symbol_icon/stroke/Stars A.svg';
            }, { once: true });
        }
        lingyiNotice.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(100, 180, 255, 0.1); border-radius: var(--radius-md); margin-bottom: 16px;';
        lingyiSection.appendChild(lingyiNotice);
        
        // 灵翼交互主开关
        const lingyiEnabled = State.settings.lingyiEnabled || false;
        lingyiSection.appendChild(FluentUI.SettingItem({
            label: t('settings.lingyi-enable'),
            description: t('settings.lingyi-enable-desc'),
            control: FluentUI.Toggle({
                checked: lingyiEnabled,
                onChange: async (v) => {
                    try {
                        if (v) {
                            await LingYi.start();
                            State.addNotification({
                                title: t('settings.lingyi'),
                                message: t('settings.lingyi-started'),
                                type: 'success'
                            });
                        } else {
                            LingYi.stop();
                            State.addNotification({
                                title: t('settings.lingyi'),
                                message: t('settings.lingyi-stopped'),
                                type: 'info'
                            });
                        }
                        this.addRecentSetting(t('settings.lingyi'), v ? t('settings.on') : t('settings.off'), 'lab');
                        this.render(); // 刷新以更新选项状态
                    } catch (error) {
                        console.error('灵翼交互启动失败:', error);
                    }
                }
            })
        }));
        
        // 灵翼交互子选项（仅在启用时显示）
        if (lingyiEnabled && typeof LingYi !== 'undefined') {
            // 显示摄像头画面
            lingyiSection.appendChild(FluentUI.SettingItem({
                label: t('settings.lingyi-camera'),
                description: t('settings.lingyi-camera-desc'),
                control: FluentUI.Toggle({
                    checked: LingYi.options.showCamera,
                    onChange: (v) => {
                        LingYi.setOption('showCamera', v);
                        this.addRecentSetting(t('settings.lingyi-camera'), v ? t('settings.on') : t('settings.off'), 'lab');
                    }
                })
            }));

            // 显示代码实时显示
            lingyiSection.appendChild(FluentUI.SettingItem({
                label: t('settings.lingyi-code'),
                description: t('settings.lingyi-code-desc'),
                control: FluentUI.Toggle({
                    checked: LingYi.options.showCodePanel,
                    onChange: (v) => {
                        LingYi.setOption('showCodePanel', v);
                        this.addRecentSetting(t('settings.lingyi-code'), v ? t('settings.on') : t('settings.off'), 'lab');
                    }
                })
            }));
            
            // 状态指示器
            const statusContainer = document.createElement('div');
            statusContainer.className = 'fluent-setting-item';
            statusContainer.innerHTML = `
                <div class="fluent-setting-item-info">
                    <div class="fluent-setting-item-label">${t('settings.lingyi-status')}</div>
                    <div class="fluent-setting-item-desc">${t('settings.lingyi-status-desc')}</div>
                </div>
                <div class="fluent-setting-item-control">
                    <div class="lingyi-status-indicator">
                        <span class="lingyi-status-dot ${LingYi.enabled ? 'active' : ''}"></span>
                        <span>${LingYi.enabled ? t('settings.lingyi-running') : t('settings.lingyi-stopped-status')}</span>
                    </div>
                </div>
            `;
            lingyiSection.appendChild(statusContainer);
            
            // 使用说明
            const usageGuide = document.createElement('div');
            usageGuide.className = 'lingyi-usage-guide';
            usageGuide.style.cssText = 'padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-top: 12px;';
            usageGuide.innerHTML = `
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">${t('settings.lingyi-guide')}</div>
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary);">
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">☝️</span>
                        <span><strong>${t('settings.lingyi-move')}</strong> - ${t('settings.lingyi-move-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">👌</span>
                        <span><strong>${t('settings.lingyi-click')}</strong> - ${t('settings.lingyi-click-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: #ffa050; font-weight: 600;">🤏</span>
                        <span><strong>${t('settings.lingyi-rclick')}</strong> - ${t('settings.lingyi-rclick-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: #00ff64; font-weight: 600;">🖐️</span>
                        <span><strong>${t('settings.lingyi-scroll')}</strong> - ${t('settings.lingyi-scroll-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">↔️</span>
                        <span><strong>${t('settings.lingyi-resize')}</strong> - ${t('settings.lingyi-resize-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">⤡</span>
                        <span><strong>${t('settings.lingyi-scale')}</strong> - ${t('settings.lingyi-scale-desc')}</span>
                    </div>
                </div>
            `;
            lingyiSection.appendChild(usageGuide);
        }
        
        container.appendChild(lingyiSection);
        container.appendChild(section);
        
        // 组件演示区域
        const demoSection = this.createSection(t('settings.demo-section'));

        // Dialog 对话框演示
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.demo-dialog'),
            description: t('settings.demo-dialog-desc'),
            control: FluentUI.Button({
                text: t('settings.demo'),
                variant: 'secondary',
                onClick: () => {
                    FluentUI.Dialog({
                        type: 'info',
                        title: t('settings.demo-dialog-title'),
                        content: t('settings.demo-dialog-content'),
                        buttons: [
                            { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                            { text: t('settings.demo-learn-more'), variant: 'secondary', value: 'more' },
                            { text: t('ok'), variant: 'primary', value: 'ok' }
                        ],
                        onClose: (result) => {
                            if (result) {
                                FluentUI.Toast({
                                    title: t('settings.demo-dialog-closed'),
                                    message: t('settings.demo-clicked', { result }),
                                    type: 'info'
                                });
                            }
                        }
                    });
                }
            })
        }));

        // Toast 通知演示
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.demo-toast'),
            description: t('settings.demo-toast-desc'),
            control: FluentUI.Button({
                text: t('settings.demo'),
                variant: 'secondary',
                onClick: () => {
                    const types = ['info', 'success', 'warning', 'error'];
                    const messages = {
                        info: { title: t('settings.demo-toast-info'), message: t('settings.demo-toast-info-msg') },
                        success: { title: t('settings.demo-toast-success'), message: t('settings.demo-toast-success-msg') },
                        warning: { title: t('settings.demo-toast-warning'), message: t('settings.demo-toast-warning-msg') },
                        error: { title: t('settings.demo-toast-error'), message: t('settings.demo-toast-error-msg') }
                    };
                    const type = types[Math.floor(Math.random() * types.length)];
                    FluentUI.Toast({
                        title: messages[type].title,
                        message: messages[type].message,
                        type: type,
                        duration: 5000
                    });
                }
            })
        }));

        // 警告对话框演示
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.demo-warning-dialog'),
            description: t('settings.demo-warning-desc'),
            control: FluentUI.Button({
                text: t('settings.demo'),
                variant: 'secondary',
                onClick: () => {
                    FluentUI.Dialog({
                        type: 'warning',
                        title: t('settings.demo-confirm-action'),
                        content: t('settings.demo-confirm-content'),
                        buttons: [
                            { text: t('cancel'), variant: 'secondary', value: false },
                            { text: t('settings.demo-continue'), variant: 'primary', value: true }
                        ],
                        onClose: (result) => {
                            if (result === true) {
                                FluentUI.Toast({ title: t('settings.demo-confirmed'), message: t('settings.demo-confirmed-msg'), type: 'success' });
                            } else if (result === false) {
                                FluentUI.Toast({ title: t('settings.demo-cancelled'), message: t('settings.demo-cancelled-msg'), type: 'info' });
                            }
                        }
                    });
                }
            })
        }));
        
        // 错误对话框演示
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.demo-error-dialog'),
            description: t('settings.demo-error-desc'),
            control: FluentUI.Button({
                text: t('settings.demo'),
                variant: 'secondary',
                onClick: () => {
                    FluentUI.Dialog({
                        type: 'error',
                        title: t('settings.demo-error-title'),
                        content: t('settings.demo-error-content'),
                        buttons: [
                            { text: t('ok'), variant: 'primary' }
                        ]
                    });
                }
            })
        }));

        // 输入对话框演示
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.demo-input-dialog'),
            description: t('settings.demo-input-desc'),
            control: FluentUI.Button({
                text: t('settings.demo'),
                variant: 'secondary',
                onClick: () => {
                    FluentUI.InputDialog({
                        title: t('settings.demo-input-title'),
                        placeholder: t('settings.demo-input-placeholder'),
                        defaultValue: '',
                        minLength: 2,
                        validateFn: (value) => {
                            if (value.length < 2) return t('settings.demo-input-validate');
                            return true;
                        },
                        onConfirm: (value) => {
                            FluentUI.Toast({
                                title: t('settings.demo-input-success'),
                                message: t('settings.demo-input-hello', { name: value }),
                                type: 'success'
                            });
                        }
                    });
                }
            })
        }));
    },

    // 应用排序状态
    appSortOrder: 'desc', // 'desc' 或 'asc'
    
    // NyouOS 应用及其中允许由用户卸载的可选应用
    systemAppIds: ['files', 'settings', 'process-manager', 'developer-center', 'terminal', 'tips', 'calculator', 'notes', 'browser', 'clock', 'weather', 'appshop', 'camera', 'photos', 'media'],
    removableSystemAppIds: ['tips', 'camera', 'photos', 'media'],

    getAppVersion(appId) {
        const versions = {
            terminal: '2.0.2',
            'process-manager': '2.0.2',
            'developer-center': '0.9.0 BETA',
            media: '2.1.0',
            photos: '2.1.0',
            files: '2.1.0',
            settings: '2.1.0',
            appshop: '2.1.0'
        };
        return versions[appId] || '2.0.1';
    },

    // 应用描述
    getAppDescription(appId) {
        const descKeys = {
            'files': 'settings.app-desc-files',
            'settings': 'settings.app-desc-settings',
            'calculator': 'settings.app-desc-calculator',
            'notes': 'settings.app-desc-notes',
            'browser': 'settings.app-desc-browser',
            'clock': 'settings.app-desc-clock',
            'weather': 'settings.app-desc-weather',
            'appshop': 'settings.app-desc-appshop',
            'camera': 'settings.app-desc-camera',
            'photos': 'settings.app-desc-photos',
            'media': 'settings.app-desc-media'
        };
        return descKeys[appId] ? t(descKeys[appId]) : t('settings.app-desc-default');
    },
    
    renderApplications(container) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        const apps = this.getStorageApps();
        
        // 存储概览卡片
        const storageCard = document.createElement('div');
        storageCard.className = 'fluent-setting-item settings-static-card';
        storageCard.innerHTML = `
            <div class="storage-card-content">
                <div class="storage-header">
                    <span class="storage-title">${this.getDeviceName()}</span>
                    <span class="storage-usage">${t('settings.storage-calculating')}</span>
                </div>
                <div class="storage-bar-wrapper" aria-hidden="true"></div>
                <div class="storage-legend"></div>
            </div>
        `;
        section.appendChild(storageCard);
        
        // 应用列表标题
        const listHeader = document.createElement('div');
        listHeader.className = 'apps-list-header';
        listHeader.innerHTML = `
            <span class="apps-list-title">${t('settings.installed-apps')}</span>
            <span class="apps-sort-btn" id="apps-sort-btn">${t('settings.sort-size')} ${this.appSortOrder === 'desc' ? '↓' : '↑'}</span>
        `;
        section.appendChild(listHeader);
        
        // 应用列表容器
        const appsList = document.createElement('div');
        appsList.className = 'apps-list';
        appsList.id = 'apps-list-container';
        this.renderAppsListContent(appsList, apps, null);
        section.appendChild(appsList);
        
        container.appendChild(section);

        if (globalThis.FluentOSStorage) {
            FluentOSStorage.analyze(apps).then((snapshot) => {
                if (!storageCard.isConnected || this.currentPage !== 'applications') return;
                this.renderStorageOverview(storageCard, snapshot);
                this.renderAppsListContent(appsList, apps, snapshot);
            }).catch((error) => {
                console.error('[SettingsApp] Storage analysis failed', error);
                const usage = storageCard.querySelector('.storage-usage');
                if (usage) usage.textContent = t('settings.storage-unavailable');
            });
        }
        
        // 排序按钮事件
        listHeader.querySelector('#apps-sort-btn').addEventListener('click', () => {
            this.appSortOrder = this.appSortOrder === 'desc' ? 'asc' : 'desc';
            listHeader.querySelector('#apps-sort-btn').textContent = `${t('settings.sort-size')} ${this.appSortOrder === 'desc' ? '↓' : '↑'}`;
            this.renderAppsListContent(appsList, apps, this._lastStorageSnapshot || null);
        });
    },

    getStorageApps() {
        const installed = new Set(State.settings.installedApps || []);
        const desktopApps = typeof Desktop !== 'undefined' ? Desktop.apps : [];
        return desktopApps.filter((app) => app.isPWA !== true || installed.has(app.id)).map((app) => {
            const shopApp = typeof AppShop !== 'undefined' ? AppShop.apps.find(item => item.id === app.id) : null;
            const pwaConfig = typeof PWALoader !== 'undefined' ? PWALoader.apps?.[app.id] : null;
            const isPWA = app.isPWA === true;
            return {
                ...app,
                name: Desktop.getAppName(app),
                isPWA,
                desc: isPWA
                    ? (pwaConfig?.description || shopApp?.desc || t('settings.app-desc-default'))
                    : this.getAppDescription(app.id)
            };
        });
    },

    renderStorageOverview(card, snapshot) {
        this._lastStorageSnapshot = snapshot;
        const categories = snapshot.categories;
        const displayQuota = 1024 * 1024 * 1024;
        const denominator = displayQuota;
        const segments = [
            ['core', t('settings.storage-core'), categories.systemCoreBytes],
            ['resources', t('settings.storage-resources'), categories.systemResourceBytes],
            ['apps', t('settings.storage-apps'), categories.appsBytes],
            ['other', t('settings.storage-other'), categories.otherBytes],
            ['overhead', t('settings.storage-overhead'), categories.browserOverheadBytes]
        ];
        const bar = card.querySelector('.storage-bar-wrapper');
        bar.innerHTML = segments.map(([key, label, bytes]) => {
            const width = Math.max(0, Math.min(100, bytes / denominator * 100));
            return `<div class="storage-bar-fill ${key}" style="width:${width.toFixed(4)}%" title="${label}"></div>`;
        }).join('');
        const legend = card.querySelector('.storage-legend');
        legend.innerHTML = segments.map(([key, label]) => `
            <span class="storage-legend-item"><span class="legend-dot legend-dot-${key}"></span><span>${label}</span></span>
        `).join('') + `
            <span class="storage-legend-item"><span class="legend-dot legend-dot-available"></span><span>${t('settings.storage-available')}</span></span>
        `;
        const usage = card.querySelector('.storage-usage');
        usage.textContent = `${FluentOSStorage.formatBytes(snapshot.browserUsageBytes || 0)} / ${FluentOSStorage.formatBytes(displayQuota)}`;
    },

    renderAppsListContent(container, apps, snapshot) {
        const allApps = apps.map((app) => ({
            ...app,
            sizeBytes: snapshot?.apps?.[app.id]?.appSizeBytes ?? (globalThis.FluentOSStorage ? FluentOSStorage.getAppSize(app) : 0),
            dataSizeBytes: snapshot?.apps?.[app.id]?.dataSizeBytes ?? 0
        }));
        
        // 排序
        allApps.sort((a, b) => this.appSortOrder === 'desc' ? b.sizeBytes - a.sizeBytes : a.sizeBytes - b.sizeBytes);
        
        container.innerHTML = allApps.map(app => `
            <div class="app-list-item" data-app-id="${app.id}" data-is-pwa="${app.isPWA}">
                <div class="app-icon">
                    <img src="${app.icon}" alt="${app.name}">
                </div>
                <div class="app-info">
                    <div class="app-name">${app.name}</div>
                    <div class="app-meta">${t('settings.last-used', { time: this.formatAppLastUsed(app.id) })}</div>
                </div>
                <div class="app-size">${globalThis.FluentOSStorage ? FluentOSStorage.formatBytes(app.sizeBytes) : '0 B'}</div>
                <div class="app-arrow">
                    <img src="Theme/Icon/Symbol_icon/stroke/Chevron Right.svg" alt="">
                </div>
            </div>
        `).join('');
        
        // 绑定点击事件
        container.querySelectorAll('.app-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const appId = item.dataset.appId;
                const app = allApps.find(a => a.id === appId);
                if (app) {
                    this.showAppDetail(app);
                }
            });
        });
    },

    formatAppLastUsed(appId) {
        const lastUsed = typeof State.getAppLastUsed === 'function' ? State.getAppLastUsed(appId) : null;
        if (!lastUsed) return t('settings.last-used-never');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const usedDay = new Date(lastUsed.getFullYear(), lastUsed.getMonth(), lastUsed.getDate());
        const diffDays = Math.floor((today - usedDay) / 86400000);

        if (diffDays <= 0) return t('settings.last-used-today');
        if (diffDays === 1) return t('settings.last-used-yesterday');
        if (diffDays === 2) return t('settings.last-used-2days');
        if (diffDays === 3) return t('settings.last-used-3days');
        if (diffDays < 7) return t('settings.last-used-days-ago', { days: diffDays });

        const lang = I18n.currentLang === 'en' ? 'en-US' : 'zh-CN';
        return lastUsed.toLocaleDateString(lang, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },
    
    // 当前查看的应用详情
    currentAppDetail: null,
    
    showAppDetail(app) {
        this.currentAppDetail = app;
        // 保持同一个 FluentWindow 实例，让框架保存 applications 页的滚动位置。
        this.navigateToPage('app-detail');
    },
    
    renderAppDetailPage(container) {
        const app = this.currentAppDetail;
        if (!app) {
            this.currentPage = 'applications';
            this.render();
            return;
        }
        
        const isSystem = this.systemAppIds.includes(app.id);
        const canUninstall = !isSystem || this.removableSystemAppIds.includes(app.id);
        const initialSize = Number(app.sizeBytes || this.getAppSize(app.id, app.isPWA === true) || 0);
        const initialDataSize = Number(app.dataSizeBytes || 0);
        
        const section = document.createElement('div');
        section.className = 'settings-section app-detail-page';
        
        // 返回按钮
        const backBtn = document.createElement('div');
        backBtn.className = 'app-detail-back';
        backBtn.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Chevron Left.svg" alt="">
            <span>${t('settings.applications')}</span>
        `;
        backBtn.addEventListener('click', () => {
            // 播放滑出动画
            section.classList.add('slide-out');
            setTimeout(() => {
                const detailId = this.currentAppDetail?.id;
                this.navigateToPage('applications', {
                    delay: 420,
                    after: () => {
                        if (this.currentAppDetail?.id === detailId) this.currentAppDetail = null;
                    }
                });
            }, 280);
        });
        section.appendChild(backBtn);
        
        // 应用信息卡片
        const infoCard = document.createElement('div');
        infoCard.className = 'fluent-setting-item settings-static-card app-info-card';
        infoCard.innerHTML = `
            <div class="app-detail-info-card">
                <img src="${app.icon}" class="app-detail-icon" alt="${app.name}">
                <div class="app-detail-info">
                    <div class="app-detail-name">${app.name}</div>
                    <div class="app-detail-version">${t('settings.version')} ${this.getAppVersion(app.id)}</div>
                    <div class="app-detail-developer">${isSystem ? 'NyouOS' : t('settings.third-party-dev')}</div>
                </div>
            </div>
        `;
        section.appendChild(infoCard);
        
        // 存储信息
        const storageCard = document.createElement('div');
        storageCard.className = 'fluent-setting-item settings-static-card app-storage-card';
        storageCard.innerHTML = `
            <div class="app-storage-info">
                <div class="app-storage-row">
                    <span>${t('settings.app-size')}</span>
                    <span data-storage-value="app">${FluentOSStorage.formatBytes(initialSize)}</span>
                </div>
                <div class="app-storage-divider"></div>
                <div class="app-storage-row">
                    <span>${t('settings.app-data')}</span>
                    <span data-storage-value="data">${FluentOSStorage.formatBytes(initialDataSize)}</span>
                </div>
                <div class="app-storage-divider"></div>
                <div class="app-storage-row app-storage-total">
                    <span>${t('settings.app-total')}</span>
                    <span data-storage-value="total">${FluentOSStorage.formatBytes(initialSize + initialDataSize)}</span>
                </div>
            </div>
        `;
        section.appendChild(storageCard);
        
        // 应用介绍
        const descCard = document.createElement('div');
        descCard.className = 'fluent-setting-item settings-static-card';
        descCard.innerHTML = `
            <div class="app-desc-card">
                <div class="app-desc-title">${t('settings.app-intro')}</div>
                <p class="app-desc-text">${app.desc}</p>
            </div>
        `;
        section.appendChild(descCard);
        
        // 修复按钮 - 使用统一 Fluent 按钮和高光系统
        const repairHost = document.createElement('div');
        repairHost.className = 'app-action-host';
        repairHost.appendChild(FluentUI.Button({
            text: t('settings.repair-app'),
            variant: 'secondary',
            className: 'app-detail-action app-detail-repair',
            disabled: this.isAppRepairing(app.id),
            onClick: () => {
                this._ensureAppClosed(app.id, app.name, t('settings.repair'), () => this.repairApp(app));
            }
        }));
        section.appendChild(repairHost);
        
        const repairDesc = document.createElement('p');
        repairDesc.className = 'app-action-desc';
        repairDesc.textContent = t('settings.repair-desc');
        section.appendChild(repairDesc);
        
        // 卸载按钮
        const uninstallHost = document.createElement('div');
        uninstallHost.className = 'app-action-host';
        uninstallHost.appendChild(FluentUI.Button({
            text: isSystem ? t('settings.uninstall-app') : t('settings.delete-app'),
            variant: canUninstall ? 'danger' : 'secondary',
            className: 'app-detail-action app-detail-uninstall',
            disabled: !canUninstall,
            onClick: !canUninstall ? null : () => {
                this._ensureAppClosed(app.id, app.name, t('settings.uninstall'), () => {
                    FluentUI.Dialog({
                        title: t('settings.confirm-uninstall'),
                        content: t('settings.confirm-uninstall-msg', { name: app.name }),
                        type: 'warning',
                        buttons: [
                            { text: t('cancel'), variant: 'secondary' },
                            { text: t('settings.uninstall'), variant: 'danger', value: 'uninstall' }
                        ],
                        onClose: async (result) => {
                            if (result === 'uninstall') {
                                let success = true;
                                if (typeof AppShop !== 'undefined' && AppShop.uninstallApp) {
                                    success = await AppShop.uninstallApp(app.id, {
                                        skipConfirm: true,
                                        skipRunningCheck: true
                                    });
                                }
                                if (success === false) return;
                                this.currentPage = 'applications';
                                this.currentAppDetail = null;
                                this.render();
                            }
                        }
                    });
                });
            }
        }));
        section.appendChild(uninstallHost);
        
        const uninstallDesc = document.createElement('p');
        uninstallDesc.className = 'app-action-desc';
        uninstallDesc.textContent = canUninstall ? t('settings.uninstall-desc') : t('settings.system-app-no-uninstall');
        if (canUninstall) uninstallDesc.classList.add('app-action-desc-danger');
        section.appendChild(uninstallDesc);
        
        container.appendChild(section);

        if (globalThis.FluentOSStorage) {
            const apps = this.getStorageApps();
            FluentOSStorage.analyze(apps).then((snapshot) => {
                if (!storageCard.isConnected || this.currentPage !== 'app-detail' || this.currentAppDetail?.id !== app.id) return;
                const values = snapshot.apps[app.id] || { appSizeBytes: initialSize, dataSizeBytes: 0 };
                app.sizeBytes = values.appSizeBytes;
                app.dataSizeBytes = values.dataSizeBytes;
                storageCard.querySelector('[data-storage-value="app"]').textContent = FluentOSStorage.formatBytes(values.appSizeBytes);
                storageCard.querySelector('[data-storage-value="data"]').textContent = FluentOSStorage.formatBytes(values.dataSizeBytes);
                storageCard.querySelector('[data-storage-value="total"]').textContent = FluentOSStorage.formatBytes(values.appSizeBytes + values.dataSizeBytes);
            }).catch(error => console.error('[SettingsApp] App storage analysis failed', error));
        }
    },
    
    // 修复应用
    repairApp(app) {
        // 检查是否已在修复中
        if (this.repairingApps.includes(app.id)) {
            FluentUI.Toast({ title: app.name, message: t('settings.app-repairing'), type: 'warning' });
            return;
        }
        
        // 添加到修复列表
        this.repairingApps.push(app.id);
        
        // 显示开始修复通知
        FluentUI.Toast({
            title: app.name,
            message: t('settings.app-repairing-start'),
            type: 'info',
            duration: 5000
        });

        // 触发修复状态变化事件
        State.emit('appRepairStart', app.id);
        
        // 10秒后完成修复
        setTimeout(() => {
            let repaired = true;
            try {
                if (app.isPWA === true && typeof AppShop !== 'undefined') {
                    const catalogApp = AppShop.apps.find(item => item.id === app.id);
                    if (typeof PWALoader !== 'undefined') PWALoader.unregister(app.id);
                    repaired = !!catalogApp && AppShop.ensureAppRegistered(catalogApp) !== false;
                } else if (typeof WindowManager !== 'undefined') {
                    repaired = !!WindowManager.appConfigs?.[app.id];
                }
            } catch (error) {
                console.error('[SettingsApp] App repair failed', error);
                repaired = false;
            }
            // 从修复列表移除
            this.repairingApps = this.repairingApps.filter(id => id !== app.id);
            
            // 显示修复完成通知
            FluentUI.Toast({ 
                title: app.name, 
                message: repaired ? t('settings.app-repaired') : t('settings.storage-unavailable'),
                type: repaired ? 'success' : 'error'
            });
            
            // 触发修复完成事件
            State.emit('appRepairEnd', app.id);
        }, 10000);
    },
    
    // 检查应用是否正在修复
    isAppRepairing(appId) {
        return this.repairingApps.includes(appId);
    },

    // 检查应用是否有正在运行的窗口
    _isAppRunning(appId) {
        if (typeof WindowManager === 'undefined') return false;
        return WindowManager.windows.some(w => w.appId === appId);
    },

    // 关闭指定应用的所有窗口
    _forceCloseApp(appId) {
        if (typeof WindowManager === 'undefined') return;
        const wins = WindowManager.windows.filter(w => w.appId === appId);
        wins.forEach(w => WindowManager.closeWindow(w.id));
    },

    // 如果应用正在运行，弹出确认对话框；否则直接执行回调
    _ensureAppClosed(appId, appName, actionLabel, callback) {
        if (!this._isAppRunning(appId)) {
            callback();
            return;
        }
        FluentUI.Dialog({
            title: t('settings.app-running', { name: appName }),
            content: t('settings.app-running-msg', { action: actionLabel, name: appName }),
            type: 'warning',
            buttons: [
                { text: t('cancel'), variant: 'secondary' },
                { text: t('settings.end-process'), variant: 'danger', value: 'confirm' }
            ],
            onClose: (result) => {
                if (result === 'confirm') {
                    this._forceCloseApp(appId);
                    // 等窗口关闭动画结束后再执行操作
                    setTimeout(() => callback(), 300);
                }
            }
        });
    },

    _detectCurrentVersion() {
        const path = window.location.pathname;
        const match = path.match(/\/(\d+\.\d+)\//);
        if (match) return match[1];
        return '26.4';
    },

    async _fetchUpdateInfo() {
        try {
            const basePath = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            const updateUrl = basePath.substring(0, basePath.lastIndexOf('/')) + '/update.html';
            const response = await fetch(updateUrl + '?_=' + Date.now());
            if (!response.ok) throw new Error('Failed to fetch');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const versionEl = doc.getElementById('update-version') || doc.querySelector('.update-version') || doc.querySelector('[data-version]');
            let version = '';
            if (versionEl) {
                // 优先使用 data-version 属性，避免 textContent 包含"版本"等文字
                version = versionEl.dataset.version || '';
                if (!version) {
                    // 从 textContent 中提取版本号（如"版本 26.4" → "26.4"）
                    const text = versionEl.textContent.trim();
                    const vMatch = text.match(/(\d+\.\d+)/);
                    if (vMatch) version = vMatch[1];
                }
            }
            if (!version) {
                const vMatch = html.match(/version[:：]\s*(\d+\.\d+)/i) || html.match(/(\d+\.\d+)\s*[-—]\s*\d{4}/);
                if (vMatch) version = vMatch[1];
            }
            const changelogEl = doc.getElementById('update-changelog') || doc.querySelector('.update-changelog') || doc.querySelector('ul');
            let changelog = [];
            if (changelogEl) {
                changelog = Array.from(changelogEl.querySelectorAll('li')).map(li => li.textContent.trim());
            }
            return { version, changelog, available: !!version && version !== this._detectCurrentVersion() };
        } catch (e) {
            console.warn('[Update] Failed to fetch update info:', e);
            return { version: '', changelog: [], available: false, error: e.message };
        }
    },

    _migrateDataToNewVersion(targetVersion) {
        try {
            const keysToMigrate = [];
            for (let i = 0; i < localStorage.length; i++) {
                keysToMigrate.push(localStorage.key(i));
            }
            const migrationData = {};
            keysToMigrate.forEach(key => {
                try {
                    migrationData[key] = localStorage.getItem(key);
                } catch (e) {}
            });
            sessionStorage.setItem('nyouos_migration_' + targetVersion, JSON.stringify(migrationData));
            return true;
        } catch (e) {
            console.warn('[Update] Data migration failed:', e);
            return false;
        }
    },

    renderNyouOSUpdate(container) {
        container.className = 'settings-content settings-update';

        const currentVersion = this._detectCurrentVersion();
        const section = this.createSection(t('settings.update-title'));
        section.querySelector('.settings-section-title').textContent = t('settings.update-subtitle');

        const statusCard = document.createElement('div');
        statusCard.className = 'fluent-setting-item settings-update-status-card';
        statusCard.innerHTML = `
            <div class="settings-update-status-header">
                <div class="settings-update-icon" style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#0078d4,#00bcf2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12a9 9 0 1 1-3-6.7L21 8"/>
                        <polyline points="21 3 21 8 16 8"/>
                    </svg>
                </div>
                <div style="flex:1;min-width:0;">
                    <div class="settings-update-status-title" style="font-size:16px;font-weight:600;margin-bottom:4px;">${t('settings.update-checking')}</div>
                    <div class="settings-update-status-subtitle" style="font-size:13px;color:var(--text-secondary);">
                        ${t('settings.update-current-version')}: <strong>${currentVersion}</strong>
                    </div>
                </div>
            </div>
            <div class="settings-update-progress" style="margin-top:16px;display:none;">
                <div style="height:4px;background:var(--divider-color);border-radius:2px;overflow:hidden;">
                    <div class="settings-update-progress-bar" style="height:100%;width:0%;background:#0078d4;transition:width 0.3s;"></div>
                </div>
                <div class="settings-update-progress-text" style="font-size:12px;color:var(--text-secondary);margin-top:8px;"></div>
            </div>
            <div class="settings-update-actions" style="margin-top:16px;display:none;gap:8px;">
                <button class="fluent-btn fluent-btn-primary settings-update-download-btn">${t('settings.update-download')}</button>
            </div>
        `;
        section.appendChild(statusCard);

        const changelogSection = this.createSection(t('settings.update-changelog'));
        const changelogList = document.createElement('div');
        changelogList.className = 'settings-update-changelog';
        changelogList.style.padding = '0 16px 16px';
        changelogList.innerHTML = `<div style="color:var(--text-secondary);font-size:13px;">${t('settings.update-checking')}</div>`;
        changelogSection.appendChild(changelogList);

        container.appendChild(section);
        container.appendChild(changelogSection);

        const progressBar = statusCard.querySelector('.settings-update-progress');
        const progressBarInner = statusCard.querySelector('.settings-update-progress-bar');
        const progressText = statusCard.querySelector('.settings-update-progress-text');
        const statusTitle = statusCard.querySelector('.settings-update-status-title');
        const actionsDiv = statusCard.querySelector('.settings-update-actions');
        const downloadBtn = statusCard.querySelector('.settings-update-download-btn');

        this._fetchUpdateInfo().then((info) => {
            if (!this._isMounted() || this.currentPage !== 'update') return;

            if (info.available && info.version) {
                statusTitle.textContent = t('settings.update-available');
                const subtitle = statusCard.querySelector('.settings-update-status-subtitle');
                subtitle.innerHTML = `${t('settings.update-latest-version')}: <strong style="color:#0078d4;">${info.version}</strong> · ${t('settings.update-current-version')}: ${currentVersion}`;
                actionsDiv.style.display = 'flex';

                if (info.changelog && info.changelog.length > 0) {
                    changelogList.innerHTML = info.changelog.map(item =>
                        `<div style="padding:8px 0;border-bottom:1px solid var(--divider-color);font-size:13px;">
                            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#0078d4;margin-right:10px;vertical-align:middle;"></span>
                            ${item}
                        </div>`
                    ).join('');
                } else {
                    changelogList.innerHTML = `<div style="color:var(--text-secondary);font-size:13px;">${t('settings.update-available')}: ${info.version}</div>`;
                }

                downloadBtn.addEventListener('click', () => {
                    actionsDiv.style.display = 'none';
                    progressBar.style.display = 'block';
                    const stages = [
                        { pct: 40, text: t('settings.update-downloading') },
                        { pct: 70, text: t('settings.update-installing') },
                        { pct: 90, text: t('settings.update-migrating') },
                        { pct: 100, text: t('settings.update-restart') }
                    ];
                    let stageIndex = 0;
                    const interval = setInterval(() => {
                        if (stageIndex >= stages.length) {
                            clearInterval(interval);
                            this._migrateDataToNewVersion(info.version);
                            // 跳转到最新版本的体验地址：根目录/版本号/index.html
                            const origin = window.location.origin;
                            const newUrl = origin + '/' + info.version + '/index.html';
                            setTimeout(() => {
                                window.location.href = newUrl;
                            }, 800);
                            return;
                        }
                        const stage = stages[stageIndex];
                        progressText.textContent = stage.text;
                        progressBarInner.style.width = stage.pct + '%';
                        stageIndex++;
                    }, 600);
                });
            } else {
                statusTitle.textContent = t('settings.update-no-updates');
                const subtitle = statusCard.querySelector('.settings-update-status-subtitle');
                subtitle.innerHTML = `${t('settings.update-current-version')}: <strong>${currentVersion}</strong>`;
                changelogList.innerHTML = `<div style="color:var(--text-secondary);font-size:13px;">${t('settings.update-no-updates')}</div>`;
            }
        }).catch(() => {
            if (!this._isMounted() || this.currentPage !== 'update') return;
            statusTitle.textContent = t('settings.update-no-updates');
            changelogList.innerHTML = `<div style="color:var(--text-secondary);font-size:13px;">${t('settings.update-no-updates')}</div>`;
        });
    },

    renderAbout(container) {
        container.className = 'settings-content settings-about';

        const section = this.createSection(t('settings.about-title'));
        const currentVersion = this.aboutChangelog[0].version;
        const originalProjectUrl = 'https://github.com/YoYoPAN1115/FluentOS-On-Web';
        const nyouosUrl = 'https://nyouos.pages.dev';

        const heroCard = document.createElement('div');
        heroCard.className = 'fluent-setting-item settings-about-hero-card';
        heroCard.innerHTML = `
            <div class="settings-about-brand">
                <div class="settings-about-brand-logo">
                    <img class="settings-about-logo-light" src="Theme/Icon/Fluent_logo.png" alt="">
                    <img class="settings-about-logo-dark" src="Theme/Icon/Fluent_logo_dark.png" alt="">
                </div>
                <div class="settings-about-brand-name">NyouOS</div>
            </div>
        `;
        section.appendChild(heroCard);
        const aboutTitleEl = section.querySelector('.settings-section-title');
        const bindDevTap = (el) => {
            if (!el) return;
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => this._handleAboutDeveloperTap());
        };
        bindDevTap(aboutTitleEl);
        bindDevTap(heroCard);

        const attributionCard = document.createElement('div');
        attributionCard.className = 'fluent-setting-item settings-about-meta-card';
        attributionCard.innerHTML = `
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">${t('settings.about.attribution')}</div>
            </div>
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">${t('settings.about.original-project')}</div>
                <a class="settings-about-meta-link" href="${originalProjectUrl}" target="_blank" rel="noopener noreferrer">${originalProjectUrl}</a>
            </div>
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">${t('settings.about.original-author')}</div>
                <div class="settings-about-meta-value">${t('settings.about.original-author-name')}</div>
            </div>
        `;
        section.appendChild(attributionCard);

        const metaCard = document.createElement('div');
        metaCard.className = 'fluent-setting-item settings-about-meta-card';
        metaCard.innerHTML = `
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">${t('settings.about.project-url')}</div>
                <a class="settings-about-meta-link" href="${nyouosUrl}" target="_blank" rel="noopener noreferrer">${nyouosUrl}</a>
            </div>
        `;
        section.appendChild(metaCard);

        const devCard = document.createElement('div');
        devCard.className = 'fluent-setting-item settings-about-meta-card';
        devCard.innerHTML = `
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">开发者 B 站</div>
                <a class="settings-about-meta-link" href="https://space.bilibili.com/3546832275769548" target="_blank" rel="noopener noreferrer">space.bilibili.com/3546832275769548</a>
            </div>
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">开发者主页</div>
                <a class="settings-about-meta-link" href="https://kevinhomepage.rf.gd/?i=1" target="_blank" rel="noopener noreferrer">kevinhomepage.rf.gd</a>
            </div>
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">原作者 B 站</div>
                <a class="settings-about-meta-link" href="https://space.bilibili.com/3493124194175754" target="_blank" rel="noopener noreferrer">space.bilibili.com/3493124194175754</a>
            </div>
        `;
        section.appendChild(devCard);

        const list = FluentUI.List({
            className: 'settings-about-list',
            items: [
                { id: 'changelog', title: t('settings.about.changelog'), description: t('settings.about.changelog-desc'), icon: 'Document', extra: '›' },
                { id: 'version', title: t('settings.version'), description: currentVersion, icon: 'Information Circle' },
                { id: 'tech', title: t('settings.tech-stack'), description: 'HTML5 + CSS3 + JavaScript', icon: 'Database 2' },
                { id: 'license', title: t('settings.license'), description: t('settings.about.no-open-source'), icon: 'Document' }
            ],
            onItemClick: (id) => {
                if (id === 'changelog') this.navigateToPage('about-changelog');
            }
        });
        const changelogItem = list.querySelector('[data-id="changelog"]');
        if (changelogItem) {
            changelogItem.setAttribute('role', 'button');
            changelogItem.tabIndex = 0;
            changelogItem.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                this.navigateToPage('about-changelog');
            });
        }
        section.appendChild(list);
        container.appendChild(section);
    },

    renderAboutChangelog(container) {
        container.className = 'settings-content settings-about-changelog';

        const section = document.createElement('section');
        section.className = 'settings-section settings-changelog-page';

        const backBtn = document.createElement('div');
        backBtn.className = 'app-detail-back settings-changelog-back';
        backBtn.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Chevron Left.svg" alt="">
            <span>${t('settings.about-title')}</span>
        `;
        backBtn.addEventListener('click', () => {
            section.classList.add('slide-out');
            setTimeout(() => this.navigateToPage('about'), 240);
        });
        section.appendChild(backBtn);

        const commitCount = this.aboutChangelog.reduce((total, release) => total + release.commits.length, 0);
        const header = document.createElement('header');
        header.className = 'settings-changelog-header';
        header.innerHTML = `
            <div>
                <h1 class="settings-changelog-title">${t('settings.about.changelog')}</h1>
                <p class="settings-changelog-subtitle">${t('settings.about.changelog-subtitle')}</p>
            </div>
            <div class="settings-changelog-count">${t('settings.about.commit-count', { count: commitCount })}</div>
        `;
        section.appendChild(header);

        const timeline = document.createElement('div');
        timeline.className = 'settings-changelog-timeline';

        this.aboutChangelog.forEach((release, index) => {
            const entry = document.createElement('article');
            entry.className = `fluent-setting-item settings-changelog-entry${release.baseline ? ' is-baseline' : ''}`;
            entry.style.setProperty('--log-index', index);

            const entryHead = document.createElement('div');
            entryHead.className = 'settings-changelog-entry-head';
            entryHead.innerHTML = `
                <div class="settings-changelog-version">${release.version}</div>
                <time class="settings-changelog-date" datetime="${release.date}">${release.date}</time>
            `;
            entry.appendChild(entryHead);

            if (release.baseline) {
                const baseline = document.createElement('div');
                baseline.className = 'settings-changelog-baseline';
                baseline.textContent = t('settings.about.baseline');
                entry.appendChild(baseline);
            } else {
                const commits = document.createElement('div');
                commits.className = 'settings-changelog-commits';
                release.commits.forEach(commit => {
                    const commitRow = document.createElement('div');
                    commitRow.className = 'settings-changelog-commit';

                    const hash = document.createElement('span');
                    hash.className = 'settings-changelog-hash';
                    hash.textContent = commit.hash;

                    const title = document.createElement('span');
                    title.className = 'settings-changelog-commit-title';
                    title.textContent = commit.title;

                    commitRow.append(hash, title);
                    commits.appendChild(commitRow);
                });
                entry.appendChild(commits);
            }

            timeline.appendChild(entry);
        });

        section.appendChild(timeline);
        container.appendChild(section);
    },

    _handleAboutDeveloperTap() {
        if (this._developerModeVisible === true) {
            this.currentPage = 'developer';
            this.render();
            return;
        }

        this._aboutDevTapCount += 1;

        const remain = 10 - this._aboutDevTapCount;
        if (remain > 0 && remain <= 3) {
            State.addNotification({
                title: t('settings.developer-title'),
                message: t('settings.developer-unlock-remaining', { count: remain }),
                type: 'info'
            });
        }
        if (this._aboutDevTapCount < 10) return;

        this._aboutDevTapCount = 0;
        this._developerModeVisible = true;
        State.addNotification({
            title: t('settings.developer-title'),
            message: t('settings.developer-unlocked'),
            type: 'success'
        });

        this.currentPage = 'developer';
        this.render();
    },

    formatTombstoneFreezeDelay(ms) {
        const seconds = Math.max(3, Math.min(600, Math.round(Number(ms || 60000) / 1000)));
        const isEn = typeof I18n !== 'undefined' && I18n.currentLang === 'en';
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const rest = seconds % 60;
        if (rest === 0) return isEn ? `${minutes} min` : `${minutes} 分钟`;
        return isEn ? `${minutes} min ${rest}s` : `${minutes} 分 ${rest} 秒`;
    },

    getTombstoneFreezeDelayMs() {
        const raw = State.settings.tombstoneFreezeDelayMs;
        if (State.normalizeTombstoneFreezeDelay) {
            return State.normalizeTombstoneFreezeDelay(raw);
        }
        const numeric = Number(raw);
        if (!Number.isFinite(numeric)) return 60 * 1000;
        return Math.max(3 * 1000, Math.min(10 * 60 * 1000, Math.round(numeric)));
    },

    createTombstoneFreezeDelayControl() {
        const currentMs = this.getTombstoneFreezeDelayMs();
        const control = document.createElement('div');
        control.className = 'settings-slider-control';

        const valueLabel = document.createElement('span');
        valueLabel.className = 'fluent-slider-value';
        valueLabel.style.minWidth = '68px';
        valueLabel.textContent = this.formatTombstoneFreezeDelay(currentMs);

        const slider = FluentUI.Slider({
            min: 3,
            max: 600,
            value: Math.round(currentMs / 1000),
            step: 1,
            showValue: false,
            onChange: (seconds) => {
                const nextMs = Math.max(3, Math.min(600, Number(seconds))) * 1000;
                valueLabel.textContent = this.formatTombstoneFreezeDelay(nextMs);
                State.updateSettings({ tombstoneFreezeDelayMs: nextMs });
            }
        });

        control.appendChild(slider);
        control.appendChild(valueLabel);
        return control;
    },

    renderDeveloper(container) {
        container.className = 'settings-content';
        const section = this.createSection(t('settings.developer-title'));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.debug-mode'),
            description: t('settings.debug-mode-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.debugModeEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ debugModeEnabled: v });
                    this.addRecentSetting(t('settings.debug-mode'), v ? t('settings.on') : t('settings.off'), 'developer');
                    State.addNotification({
                        title: t('settings.developer-title'),
                        message: v ? t('settings.debug-mode-on') : t('settings.debug-mode-off'),
                        type: 'info'
                    });
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.tombstone-freeze-delay'),
            description: t('settings.tombstone-freeze-delay-desc'),
            control: this.createTombstoneFreezeDelayControl()
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.tombstone-dim-frozen-apps'),
            description: t('settings.tombstone-dim-frozen-apps-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.tombstoneDimFrozenAppsEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ tombstoneDimFrozenAppsEnabled: v });
                    this.addRecentSetting(t('settings.tombstone-dim-frozen-apps'), v ? t('settings.on') : t('settings.off'), 'developer');
                    State.addNotification({
                        title: t('settings.developer-title'),
                        message: v ? t('settings.tombstone-dim-frozen-apps-on') : t('settings.tombstone-dim-frozen-apps-off'),
                        type: 'info'
                    });
                }
            })
        }));

        const appShopFeatureOptions = [
            { value: 'auto', label: '自动按日期切换' },
            ...Array.from({ length: 16 }, (_, index) => ({
                value: String(index + 1),
                label: `第 ${index + 1} 期精选`
            }))
        ];
        const currentAppShopPreview = Number(State.settings.appShopFeaturePreviewIndex);
        section.appendChild(FluentUI.SettingItem({
            label: 'App Shop 精选预览',
            description: '用于开发调试：手动选择 App Shop 首页展示第几期精选内容。',
            control: FluentUI.Select({
                options: appShopFeatureOptions,
                value: Number.isInteger(currentAppShopPreview) && currentAppShopPreview >= 1 && currentAppShopPreview <= 16
                    ? String(currentAppShopPreview)
                    : 'auto',
                onChange: (value) => {
                    const nextValue = value === 'auto' ? 'auto' : String(value);
                    State.updateSettings({ appShopFeaturePreviewIndex: nextValue });
                    this.addRecentSetting('App Shop 精选预览', value === 'auto' ? '自动' : `第 ${value} 期`, 'developer');
                    State.addNotification({
                        title: t('settings.developer-title'),
                        message: value === 'auto' ? 'App Shop 精选已恢复自动切换。' : `App Shop 精选已切换到第 ${value} 期。`,
                        type: 'info'
                    });
                }
            })
        }));

        container.appendChild(section);
    },
    
    getAccentPalette() {
        return [
            '#ffb900', '#ff8c00', '#f7630c', '#ca5010', '#da3b01', '#ef6950', '#d13438', '#ff4343',
            '#e74856', '#e81123', '#e3008c', '#bf0077', '#c30052', '#9a0089', '#b146c2', '#881798',
            '#0078d4', '#0063b1', '#8e8cd8', '#6b69d6', '#8764b8', '#744da9', '#b24bc2', '#881798',
            '#0099bc', '#2d7d9a', '#00b7c3', '#038387', '#00a98f', '#018574', '#00cc6a', '#10893e',
            '#7a7574', '#5d5a58', '#68768a', '#515c6b', '#567c73', '#486860', '#498205', '#107c10',
            '#767676', '#4c4a48', '#69797e', '#4a5459', '#647c64', '#525e54', '#847545', '#7e735f'
        ];
    },

    createAccentColorPanel() {
        const currentColor = State.normalizeAccentColor
            ? State.normalizeAccentColor(State.settings.accentColor)
            : (State.settings.accentColor || '#0078d4');
        const autoEnabled = State.settings.accentColorAuto === true;
        const readabilityEnabled = State.settings.accentColorReadability === true;
        const expanded = State.settings.accentColorExpanded === true;
        const recentColors = State.normalizeRecentAccentColors
            ? State.normalizeRecentAccentColors(State.settings.recentAccentColors)
            : (State.settings.recentAccentColors || []);

        const wrapper = document.createElement('div');
        wrapper.className = `settings-accent-panel ${expanded ? 'is-expanded' : ''}`;

        const entry = document.createElement('div');
        entry.className = `network-option-item network-option-expandable settings-accent-entry ${expanded ? 'is-expanded' : ''}`;
        entry.innerHTML = `
            <div class="network-option-icon">
                <span class="settings-accent-entry-swatch" style="--accent: ${currentColor}; background: ${currentColor}; background-color: ${currentColor};"></span>
            </div>
            <div class="network-option-info">
                <h4>${t('settings.accent-color')}</h4>
                <p>${autoEnabled ? t('settings.accent-auto') : currentColor.toUpperCase()}</p>
            </div>
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" class="network-option-arrow expand-arrow" alt="">
        `;
        entry.addEventListener('click', () => {
            if (expanded) {
                wrapper.classList.add('is-collapsing');
                const reducedMotion = typeof window !== 'undefined'
                    && window.matchMedia
                    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                setTimeout(() => {
                    State.updateSettings({ accentColorExpanded: false });
                    this.refreshCurrentPage();
                }, reducedMotion ? 0 : 260);
                return;
            }
            State.updateSettings({ accentColorExpanded: true });
            this.refreshCurrentPage();
        });
        wrapper.appendChild(entry);

        const selectColor = (color) => {
            const normalized = State.normalizeAccentColor ? State.normalizeAccentColor(color) : color;
            State.updateSettings({
                accentColor: normalized,
                accentColorAuto: false,
                recentAccentColors: State.addRecentAccentColor ? State.addRecentAccentColor(normalized) : [normalized, ...recentColors].slice(0, 8)
            });
            this.addRecentSetting(t('settings.accent-color'), normalized, 'personalization');
            State.addNotification({ title: t('settings.accent-color'), message: t('settings.accent-color-changed'), type: 'success' });
            this.refreshCurrentPage();
        };

        const createSwatch = (color) => {
            const normalized = State.normalizeAccentColor ? State.normalizeAccentColor(color) : color;
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = `settings-accent-swatch ${normalized === currentColor ? 'selected' : ''}`;
            swatch.style.setProperty('--swatch-color', normalized);
            swatch.style.background = normalized;
            swatch.style.backgroundColor = normalized;
            swatch.title = normalized;
            swatch.setAttribute('aria-label', normalized);
            swatch.addEventListener('click', () => selectColor(normalized));
            return swatch;
        };

        if (!expanded) {
            return wrapper;
        }

        const panel = document.createElement('div');
        panel.className = 'network-expand-panel settings-accent-expand-panel';

        const autoRow = document.createElement('div');
        autoRow.className = 'network-expand-row settings-accent-auto-row';
        autoRow.innerHTML = `<span>${t('settings.accent-auto')}</span>`;
        const autoToggle = FluentUI.Toggle({
            checked: autoEnabled,
            onChange: async (next) => {
                State.updateSettings({ accentColorAuto: next });
                this.addRecentSetting(t('settings.accent-color'), next ? t('settings.on') : t('settings.off'), 'personalization');
                State.addNotification({
                    title: t('settings.accent-color'),
                    message: next ? t('settings.accent-auto-on') : t('settings.accent-auto-off'),
                    type: next ? 'info' : 'success'
                });
                if (next && State.updateAccentFromWallpaper) {
                    const color = await State.updateAccentFromWallpaper(State.settings.wallpaperDesktop);
                    if (color) {
                        this.refreshCurrentPage();
                        return;
                    }
                }
                this.refreshCurrentPage();
            }
        });
        autoRow.appendChild(autoToggle);
        panel.appendChild(autoRow);

        const readabilityRow = document.createElement('div');
        readabilityRow.className = 'network-expand-row settings-accent-auto-row';
        readabilityRow.innerHTML = `<span>${t('settings.accent-readability')}</span>`;
        const readabilityToggle = FluentUI.Toggle({
            checked: readabilityEnabled,
            onChange: (next) => {
                State.updateSettings({ accentColorReadability: next });
                this.addRecentSetting(t('settings.accent-color'), next ? t('settings.on') : t('settings.off'), 'personalization');
                State.addNotification({
                    title: t('settings.accent-color'),
                    message: next ? t('settings.accent-readability-on') : t('settings.accent-readability-off'),
                    type: next ? 'info' : 'success'
                });
                this.refreshCurrentPage();
            }
        });
        readabilityRow.appendChild(readabilityToggle);
        panel.appendChild(readabilityRow);

        if (recentColors.length) {
            const recentGroup = document.createElement('div');
            recentGroup.className = 'settings-accent-group';
            recentGroup.innerHTML = `<div class="settings-accent-group-title">${t('settings.accent-recent')}</div>`;
            const row = document.createElement('div');
            row.className = 'settings-accent-row';
            recentColors.forEach((color) => row.appendChild(createSwatch(color)));
            recentGroup.appendChild(row);
            panel.appendChild(recentGroup);
        }

        const paletteGroup = document.createElement('div');
        paletteGroup.className = 'settings-accent-group';
        paletteGroup.innerHTML = `<div class="settings-accent-group-title">${t('settings.accent-windows')}</div>`;
        const grid = document.createElement('div');
        grid.className = 'settings-accent-grid';
        this.getAccentPalette().slice(0, -1).forEach((color) => grid.appendChild(createSwatch(color)));
        const input = document.createElement('input');
        input.type = 'color';
        input.value = currentColor;
        input.style.display = 'none';
        input.addEventListener('input', (event) => selectColor(event.target.value));
        const customBtn = document.createElement('button');
        customBtn.type = 'button';
        customBtn.className = 'settings-accent-custom';
        customBtn.innerHTML = '<img src="Theme/Icon/Symbol_icon/stroke/Add.svg" alt="">';
        customBtn.setAttribute('aria-label', t('settings.accent-custom'));
        customBtn.addEventListener('click', () => input.click());
        grid.appendChild(customBtn);
        grid.appendChild(input);
        paletteGroup.appendChild(grid);
        panel.appendChild(paletteGroup);
        wrapper.appendChild(panel);

        return wrapper;
    },

    // 辅助方法：创建分区
    createSection(title) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        const titleEl = document.createElement('div');
        titleEl.className = 'settings-section-title';
        titleEl.textContent = title;
        section.appendChild(titleEl);
        return section;
    },
    
    // 辅助方法：创建壁纸网格
    createWallpaperGrid(wallpapers, selected, type) {
        const grid = document.createElement('div');
        grid.className = 'wallpaper-grid';
        wallpapers.forEach(wp => {
            const item = document.createElement('div');
            item.className = `wallpaper-item ${wp === selected ? 'selected' : ''}`;
            item.innerHTML = `<img src="${wp}" alt="壁纸">`;
            item.addEventListener('click', async () => {
                if (type === 'desktop') {
                    await State.setWallpaper('desktop', wp, { sourceType: 'built-in' });
                    await Desktop.updateWallpaper();
                } else {
                    await State.setWallpaper('lock', wp, { sourceType: 'built-in' });
                    if (typeof LockScreen !== 'undefined' && LockScreen.updateWallpaper) await LockScreen.updateWallpaper();
                }
                grid.querySelectorAll('.wallpaper-item').forEach(candidate => {
                    candidate.classList.toggle('selected', candidate === item);
                });
                State.addNotification({ title: t('settings.personalization'), message: t('settings.wallpaper-changed', { type: type === 'desktop' ? t('settings.desktop') : t('settings.lockscreen') }), type: 'success' });
            });
            grid.appendChild(item);
        });
        return grid;
    }
};

if (typeof window !== 'undefined') {
    window.SettingsApp = SettingsApp;
}
