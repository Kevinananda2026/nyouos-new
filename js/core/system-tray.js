class SystemTray {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.clockElement = null;
        this.networkStatus = 'online';
        this.build();
        this.startClock();
        this.monitorNetwork();
    }

    build() {
        this.container.innerHTML = `
            <div class="nyouos-tray">
                <button class="nyouos-tray-btn nyouos-tray-notifications" title="通知">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a4.5 4.5 0 0 0-4.5 4.5v3.1l-1.2 2.4A.5.5 0 0 0 2.7 12h10.6a.5.5 0 0 0 .4-.7L13 8.6V5.5A4.5 4.5 0 0 0 8 1zM6 13a2 2 0 0 0 4 0H6z"/>
                    </svg>
                    <span class="nyouos-tray-badge" style="display:none;"></span>
                </button>
                <button class="nyouos-tray-btn nyouos-tray-network" title="网络状态">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.5 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM3.5 4.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM6.5 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v9.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM9.5 1a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v10.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                </button>
                <button class="nyouos-tray-btn nyouos-tray-volume" title="音量">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.5 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.9.3L7.2 10.5H4.5a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5h2.7l3.4-3.3a.5.5 0 0 1 .9.3z"/>
                        <path d="M12 3.5a4 4 0 0 1 0 9v-1a3 3 0 0 0 0-7z" fill="currentColor" opacity="0.7"/>
                        <path d="M12 5.5a2 2 0 0 1 0 5v-1a1 1 0 0 0 0-3z" fill="currentColor" opacity="0.5"/>
                    </svg>
                </button>
                <div class="nyouos-tray-separator"></div>
                <button class="nyouos-tray-btn nyouos-tray-clock" title="日期时间">
                    <span class="nyouos-tray-time">--:--</span>
                    <span class="nyouos-tray-date">--/--</span>
                </button>
            </div>
            <div class="nyouos-tray-popup" id="nyouos-tray-popup"></div>
        `;

        this.clockElement = this.container.querySelector('.nyouos-tray-clock');
        this.popup = this.container.querySelector('#nyouos-tray-popup');

        this.clockElement.addEventListener('click', () => this.toggleCalendar());
        
        this.container.querySelector('.nyouos-tray-notifications').addEventListener('click', () => {
            this.showPopup('notifications');
        });
        
        this.container.querySelector('.nyouos-tray-volume').addEventListener('click', () => {
            this.showPopup('volume');
        });
        
        this.container.querySelector('.nyouos-tray-network').addEventListener('click', () => {
            this.showPopup('network');
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hidePopup();
            }
        });
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            
            if (this.clockElement) {
                this.clockElement.querySelector('.nyouos-tray-time').textContent = `${hours}:${minutes}`;
                this.clockElement.querySelector('.nyouos-tray-date').textContent = `${month}/${day}`;
            }
        };

        updateClock();
        setInterval(updateClock, 10000);
    }

    monitorNetwork() {
        const updateNetworkStatus = () => {
            this.networkStatus = navigator.onLine ? 'online' : 'offline';
            const networkBtn = this.container.querySelector('.nyouos-tray-network');
            if (networkBtn) {
                networkBtn.style.opacity = this.networkStatus === 'online' ? '1' : '0.4';
                networkBtn.title = this.networkStatus === 'online' ? '网络已连接' : '网络已断开';
            }
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();
    }

    toggleCalendar() {
        this.showPopup('calendar');
    }

    showPopup(type) {
        this.popup.classList.add('show');
        
        let content = '';
        switch (type) {
            case 'calendar':
                content = this.getCalendarHTML();
                break;
            case 'volume':
                content = this.getVolumeHTML();
                break;
            case 'network':
                content = this.getNetworkHTML();
                break;
            case 'notifications':
                content = this.getNotificationsHTML();
                break;
        }
        
        this.popup.innerHTML = content;
        this._bindPopupEvents(type);
    }

    hidePopup() {
        this.popup.classList.remove('show');
    }

    getCalendarHTML() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let calendarHTML = `
            <div class="nyouos-calendar">
                <div class="nyouos-calendar-header">
                    <button class="nyouos-calendar-prev">‹</button>
                    <span>${year}年 ${month + 1}月</span>
                    <button class="nyouos-calendar-next">›</button>
                </div>
                <div class="nyouos-calendar-grid">
                    <div class="nyouos-calendar-weekday">日</div>
                    <div class="nyouos-calendar-weekday">一</div>
                    <div class="nyouos-calendar-weekday">二</div>
                    <div class="nyouos-calendar-weekday">三</div>
                    <div class="nyouos-calendar-weekday">四</div>
                    <div class="nyouos-calendar-weekday">五</div>
                    <div class="nyouos-calendar-weekday">六</div>
        `;
        
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="nyouos-calendar-empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today;
            calendarHTML += `<div class="nyouos-calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
        }
        
        calendarHTML += `</div></div>`;
        return calendarHTML;
    }

    getVolumeHTML() {
        return `
            <div class="nyouos-volume-panel">
                <div class="nyouos-volume-title">音量控制</div>
                <div class="nyouos-volume-slider-container">
                    <span class="nyouos-volume-icon">🔊</span>
                    <input type="range" class="nyouos-volume-slider" min="0" max="100" value="70">
                    <span class="nyouos-volume-value">70</span>
                </div>
            </div>
        `;
    }

    getNetworkHTML() {
        const statusText = this.networkStatus === 'online' ? '已连接' : '已断开';
        const statusColor = this.networkStatus === 'online' ? '#107c10' : '#d13438';
        return `
            <div class="nyouos-network-panel">
                <div class="nyouos-network-title">网络状态</div>
                <div class="nyouos-network-status" style="color: ${statusColor};">● ${statusText}</div>
                <div class="nyouos-network-info">当前网络：NyouOS Virtual Network</div>
            </div>
        `;
    }

    getNotificationsHTML() {
        return `
            <div class="nyouos-notifications-panel">
                <div class="nyouos-notifications-title">通知</div>
                <div class="nyouos-notifications-empty">暂无新通知</div>
            </div>
        `;
    }

    _bindPopupEvents(type) {
        if (type === 'calendar') {
            const prevBtn = this.popup.querySelector('.nyouos-calendar-prev');
            const nextBtn = this.popup.querySelector('.nyouos-calendar-next');
            if (prevBtn) prevBtn.addEventListener('click', () => this.hidePopup());
            if (nextBtn) nextBtn.addEventListener('click', () => this.hidePopup());
        }
        if (type === 'volume') {
            const slider = this.popup.querySelector('.nyouos-volume-slider');
            const value = this.popup.querySelector('.nyouos-volume-value');
            if (slider) {
                slider.addEventListener('input', (e) => {
                    if (value) value.textContent = e.target.value;
                });
            }
        }
    }
}

window.SystemTray = SystemTray;
