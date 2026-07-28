/**
 * BlueScreen - BSOD (Blue Screen of Death) module
 * Triggers a full-screen blue error overlay when critical processes are terminated.
 */
const BlueScreen = {
    element: null,
    progressTimer: null,

    show(processName) {
        if (this.element) return;

        const overlay = document.createElement('div');
        overlay.id = 'bsod-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: '#0078d4',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: '0',
            transition: 'opacity 0.5s ease',
            cursor: 'default',
            userSelect: 'none'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            maxWidth: '800px',
            padding: '40px'
        });

        const sadFace = document.createElement('div');
        sadFace.textContent = ':(';
        Object.assign(sadFace.style, {
            fontSize: '120px',
            marginBottom: '40px',
            fontWeight: '300',
            lineHeight: '1'
        });

        const title = document.createElement('div');
        title.textContent = 'NyouOS 遇到了问题，需要重启。';
        Object.assign(title.style, {
            fontSize: '24px',
            marginBottom: '16px'
        });

        const subtitle = document.createElement('div');
        subtitle.textContent = '我们正在收集错误信息，然后为您重新启动。';
        Object.assign(subtitle.style, {
            fontSize: '18px',
            opacity: '0.9',
            marginBottom: '24px'
        });

        const progress = document.createElement('div');
        progress.textContent = '0% 完成';
        Object.assign(progress.style, {
            fontSize: '16px'
        });

        const stopCode = document.createElement('div');
        stopCode.innerHTML = `停止代码: CRITICAL_PROCESS_DIED<br>失败进程: ${processName || 'Unknown'}`;
        Object.assign(stopCode.style, {
            position: 'fixed',
            bottom: '40px',
            left: '40px',
            fontSize: '14px',
            opacity: '0.7',
            textAlign: 'left',
            lineHeight: '1.6'
        });

        content.append(sadFace, title, subtitle, progress);
        overlay.appendChild(content);
        overlay.appendChild(stopCode);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        this.element = overlay;

        const duration = 8000;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const percent = Math.min(100, Math.round((elapsed / duration) * 100));
            progress.textContent = `${percent}% 完成`;
            if (percent < 100) {
                this.progressTimer = requestAnimationFrame(tick);
            } else {
                setTimeout(() => location.reload(), 300);
            }
        };
        this.progressTimer = requestAnimationFrame(tick);
    }
};

globalThis.BlueScreen = BlueScreen;
