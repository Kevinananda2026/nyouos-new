# NyouOS-On-Web 2.0 Developer Guide

[简体中文](DEVELOPER_GUIDE.md) | [English](DEVELOPER_GUIDE_EN.md)

This guide is for developers who want to understand, debug, or extend NyouOS-On-Web. The project uses traditional browser scripts: there are no npm runtime dependencies, ES modules, build artifacts, or frontend frameworks.  loads scripts in dependency order, and modules expose objects in the global scope.

See the [project README](../README_EN.md) for usage and the [NyouOS UI Guide](fluent-ui-guide-en.md) for components and visual conventions.

## 1. Development Baseline

Run a static server from the repository root:



Open <http://localhost:8000/> and use the browser developer tools. Do not use  as the development baseline because preloading, remote requests, camera, clipboard, and file-picker behavior will differ.

There is currently no automated test or lint configuration. If Node.js is available, run a syntax check before committing:



## 2. Architecture



| Directory | Responsibility |
| --- | --- |
|  | Storage, global state, i18n, file import, favorites, FluentUI/FluentWindow, SurfAi, Lingyi, and resource metadata |
|  | Boot, OOBE, desktop, taskbar, Start, system panels, Task View, windows, and widgets |
|  | Native application components mounted by  |
|  | iframe Web/PWA registration and catalog |
|  | Theme tokens, system shell, shared components, and application styles |
|  | Icons, wallpapers, avatars, preload assets, and illustrations |

### Script Order

Global objects have real ordering constraints.  depends on ; apps depend on , , , and ;  initializes the complete system.

- Place a core script before its first consumer.
- Load native app scripts after  and before .
- Keep  as early as possible so strict CSP can be restored before other resources execute.
- Do not add , , or reorder scripts unless the associated global dependencies are removed as well.

## 3. Startup and View Lifecycle

The main  values are , , , and .  listens for  and activates the corresponding screen.

OOBE checks its persistence marker on the first visit. Normal startup preloads resources through , enters the lock screen, then PIN login, and finally the desktop.



These APIs only change the web interface; they never control the host computer.

## 4. Storage and State

### Storage

 is a JSON wrapper around :



Core keys are , , , , , and .  clears all  values for the current origin, not only NyouOS core keys, so it must not be used in normal business flows.

The virtual file-system serializer strips oversized Data URLs—roughly over 128 KiB for images and 2 MiB for other inline data—to protect startup performance. Store large photos and media as Blob data in IndexedDB instead.

### State

 is the runtime source of truth:



Always update settings through  so persistence, side effects, and events run correctly:



Important settings include , , wallpapers, blur and material options, accent colors, animation, quick switching, window snapping, tombstone freezing, , external file import, and strict CSP.

### Event Bus



Common events include , , , , notification events, , , , , and . Use stable listener keys for repeated initialization and unsubscribe during cleanup.

### Virtual File System

The standard root contains , , , , and .



File IDs must be globally unique. Items moved to the Recycle Bin should retain  so they can be restored.

## 5. Internationalization

Translations live in ; current language keys are  and :



Add matching keys to both tables, avoid caching translated strings, listen for , and use  in app configurations. Missing English text falls back to Chinese, then to the key itself.

## 6. Window Management

 creates, focuses, resizes, snaps, minimizes, maximizes, freezes, and restores windows. By default, each app ID has one window.





Supported component hooks are , , , , , and .  may return  or a Promise resolving to  to cancel closing. Only perform irreversible cleanup after close confirmation.

## 7. Adding a Native App



App components are singletons. Register the app in , add metadata to , optionally add it to , include its script in , and provide an icon, translations, and styles.

Complex apps should use  for internal navigation:



## 8. Widgets

Definitions live in ; layout and interaction are handled by . A variant defines grid size, theme, defaults, rendering, and optional interaction:



Use  for cached asynchronous data and stop timers, observers, and listeners when widget DOM is removed.

## 9. Third-party Web/PWA Apps



Catalog entries are stored in . Cross-origin iframe DOM cannot be read, and sites may reject embedding, cookies, popups, downloads, autoplay, or permissions. Cooperative apps can listen for  messages with  and  actions.

## 10. Network, Permissions, and Security

- Provide loading, failure, timeout, and offline fallback states for remote data.
- Prefer ; escape third-party text before writing it to .
- Validate URL protocols and use  for external windows.
- Stop every camera track when closing a stream.
- Never place API keys in source code, logs, the virtual file system, or plain persistent fields.
- Keep strict CSP sources minimal and provide a no-network fallback.
- Client storage and browser-side encryption are not trusted secret stores.

## 11. Debugging



Use  for persistent Notification Center entries and  for transient feedback.  is the notification convenience wrapper.

## 12. Pre-commit Checklist

- JavaScript passes syntax checks.
- OOBE, lock, login, and desktop work from cleared site data.
- Light/dark themes, accent colors, disabled animation, and disabled blur remain usable.
- Apps open, resize, snap, minimize, maximize, close, and reopen correctly.
- Minimum window sizes do not hide critical controls.
- Chinese/English changes update titles, navigation, and dynamic content.
- Settings, files, window bounds, and app data survive refreshes.
- Offline mode and denied camera/geolocation permissions fail gracefully.
- No new unhandled errors, duplicated listeners, or orphaned timers appear.


