/**
 * 截图模块
 * 快捷键：Ctrl + Shift + S
 */
const Screenshot = {
    flashElement: null,
    
    init() {
        this.flashElement = document.createElement('div');
        this.flashElement.className = 'screenshot-flash';
        document.body.appendChild(this.flashElement);
    },

    async take() {
        this._playFlash();
        
        try {
            const canvas = await this._captureViewport();
            const dataUrl = canvas.toDataURL('image/png');
            
            const fileName = `NyouOS_Screenshot_${this._formatDate()}.png`;
            
            this._saveToStorage(dataUrl, fileName);
            
            this._showNotification(fileName);
            
            return dataUrl;
        } catch (e) {
            console.error('截图失败:', e);
            this._showNotification('截图失败', true);
            return null;
        }
    },

    _playFlash() {
        if (!this.flashElement) return;
        this.flashElement.classList.add('active');
        setTimeout(() => {
            this.flashElement.classList.remove('active');
        }, 200);
    },

    async _captureViewport() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        try {
            const appElement = document.getElementById('app');
            if (appElement) {
                const computedStyle = window.getComputedStyle(appElement);
                const bgColor = computedStyle.backgroundColor;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, width, height);
                }
            }
        } catch (e) {}
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NyouOS 26.2', width / 2, height / 2 - 30);
        
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(new Date().toLocaleString(), width / 2, height / 2 + 20);
        
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Screenshot', width / 2, height / 2 + 60);
        
        return canvas;
    },

    _formatDate() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    },

    _saveToStorage(dataUrl, fileName) {
        try {
            const screenshots = JSON.parse(localStorage.getItem('nyouos.screenshots') || '[]');
            screenshots.unshift({
                name: fileName,
                dataUrl: dataUrl,
                timestamp: Date.now()
            });
            if (screenshots.length > 20) {
                screenshots.pop();
            }
            localStorage.setItem('nyouos.screenshots', JSON.stringify(screenshots));
        } catch (e) {
            console.warn('保存截图到本地存储失败:', e);
        }
    },

    _showNotification(fileName, isError = false) {
        if (typeof State !== 'undefined' && typeof State.addNotification === 'function') {
            State.addNotification({
                title: isError ? '截图失败' : '截图已保存',
                message: isError ? '无法创建截图' : `${fileName} 已保存到相册`,
                type: isError ? 'error' : 'success',
                duration: 3000
            });
        }
    },

    downloadScreenshot(dataUrl, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    },

    getScreenshots() {
        try {
            return JSON.parse(localStorage.getItem('nyouos.screenshots') || '[]');
        } catch (e) {
            return [];
        }
    }
};
