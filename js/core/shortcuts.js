class ShortcutManager {
    constructor() {
        this.shortcuts = {};
        this.enabled = true;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
    }

    _handleKeyDown(e) {
        if (!this.enabled) return;
        
        const ctrlKey = e.ctrlKey || e.metaKey;
        const altKey = e.altKey;
        const shiftKey = e.shiftKey;
        const key = e.key.toLowerCase();
        
        for (const [combo, handler] of Object.entries(this.shortcuts)) {
            const parts = combo.toLowerCase().split('+');
            const expected = {
                ctrl: parts.includes('ctrl'),
                alt: parts.includes('alt'),
                shift: parts.includes('shift'),
                key: parts[parts.length - 1]
            };
            
            if (ctrlKey === expected.ctrl &&
                altKey === expected.alt &&
                shiftKey === expected.shift &&
                key === expected.key) {
                e.preventDefault();
                e.stopPropagation();
                handler(e);
                return;
            }
        }
    }

    register(combo, handler) {
        this.shortcuts[combo.toLowerCase()] = handler;
    }

    unregister(combo) {
        delete this.shortcuts[combo.toLowerCase()];
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    reset() {
        this.shortcuts = {};
    }
}

window.ShortcutManager = ShortcutManager;
