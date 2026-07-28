/**
 * Apple Intelligence 风格跑马灯点击效果
 * 仅触屏设备 + 设置开启时生效
 */
(function() {
    'use strict';

    // 触屏设备检测
    function isTouchDevice() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               window.matchMedia('(pointer: coarse)').matches;
    }

    // 非触屏设备直接退出，不绑定任何事件
    if (!isTouchDevice()) return;

    // 读取设置：默认关闭（默认没有跑马灯环）
    function isAILightEnabled() {
        try {
            var s = localStorage.getItem('fluentos.settings');
            if (!s) return false;
            var parsed = JSON.parse(s);
            return parsed && parsed.aiLightRingEnabled === true;
        } catch (_) {
            return false;
        }
    }

    // 显示跑马灯
    function showAILight(x, y) {
        var container = document.createElement('div');
        container.className = 'ai-running-light';
        container.style.left = x + 'px';
        container.style.top = y + 'px';

        // 外层柔光辉光
        var glow = document.createElement('div');
        glow.className = 'ai-running-light-glow';
        container.appendChild(glow);

        // 主跑马灯环
        var ring = document.createElement('div');
        ring.className = 'ai-running-light-ring';
        container.appendChild(ring);

        document.body.appendChild(container);

        // 动画结束后自动移除
        container.addEventListener('animationend', function() {
            if (container.parentElement) container.remove();
        });

        // 安全超时清理
        setTimeout(function() {
            if (container.parentElement) container.remove();
        }, 2000);
    }

    // 监听全局点击（pointerdown 兼容触屏和鼠标）
    var lastTrigger = 0;
    document.addEventListener('pointerdown', function(e) {
        // 设置未开启时不触发
        if (!isAILightEnabled()) return;

        // 防抖：200ms 内不重复触发
        var now = Date.now();
        if (now - lastTrigger < 200) return;
        lastTrigger = now;

        // 忽略表单输入元素
        var tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

        showAILight(e.clientX, e.clientY);
    }, true);
})();
