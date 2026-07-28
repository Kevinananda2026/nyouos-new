# NyouOS UI Development Guide

[简体中文](fluent-ui-guide.md) | [English](fluent-ui-guide-en.md)

This guide covers the visual foundations,  DOM factory, and  application framework in NyouOS-On-Web 2.0. The documented interfaces correspond to , , and their stylesheets.

See the [Developer Guide](DEVELOPER_GUIDE_EN.md) for architecture and app registration.

## Design Principles

- Reuse system tokens and components instead of creating app-specific copies of buttons, fields, or dialogs.
- Component factories return real DOM nodes, not HTML strings or virtual DOM.
- Use  for user data; only trusted templates may use .
- Test every interaction in light/dark themes and with blur or animation disabled.
- Use icons from :  for normal state and  where an active state is needed.
- Design for resizable windows, not only for a full-screen desktop.

## CSS Tokens and Themes

Base tokens are defined under  in ;  overrides them.



| Category | Variables |
| --- | --- |
| Background | , ,  |
| Text | , ,  |
| Accent | , , ,  |
| Border/shadow | ,  |
| Radius |  (8/12/16/20 px) |
| Blur |  (8/12/16 px) |
| Motion |  |

Do not hard-code white backgrounds or a fixed blue accent. Users and wallpaper extraction can change accent values at runtime. System material, blur, animation, and NyouOS V2 classes are managed globally by ; applications should not mutate those body classes directly.

## Icons

Icon names match SVG filenames without the extension:



Check both  and  directories before using a new icon. Filenames, spaces, and capitalization must match exactly.

## FluentUI Basics

 is a global DOM factory. Most factories accept  and  and immediately return an :



Components do not mount themselves or provide reactive binding. The caller updates the returned DOM or renders it again when state changes.

## Buttons

### Button



 disables the button and displays a spinner.

### IconButton



Always give icon-only buttons a meaningful  and, when needed, an .

## Input and Selection

### Input / SearchBox



The returned node is a wrapper. Use its , , , and  helpers when direct input access is required.

### Select



This is a custom dropdown rather than a native .

### Toggle



Toggle maintains  and .

### Slider



The callback receives a number. Avoid expensive work on every high-frequency input event.

### SegmentedControl



## Navigation

### NavigationBar



 and  accept strings or DOM nodes. Do not pass untrusted strings as HTML.

### ToolBar



### Breadcrumb



### TabBar



## Content and Feedback

### Card and List



 accepts a string or DOM node;  currently accepts an HTML string. Dynamic data should be passed as a node or escaped first.

### Progress / Spinner



### Empty and SettingItem



### ScrollArea



Do not nest it inside a   unless a second independent scrolling region is truly required.

## Menus and Dialogs

### ContextMenu



The caller remains responsible for mounting, outside-click handling, and cleanup.

### Dialog and InputDialog



 returns  on success or an error string on failure.

### Modal



### Toast and Notification Center



Toast is transient.  persists an entry in Notification Center.

## FluentWindow Application Framework

 manages navigation inside a window. The outer system window is still created by .



Render only into the supplied . Sidebar search supports , placeholder/status strings, minimum query length, debounce, asynchronous , and result callbacks.

| API | Purpose |
| --- | --- |
|  /  | Change pages |
|  | Render the active page again |
|  | Disconnect observers/listeners and host styles |
|  /  | Manage per-page scroll |
|  | Enable or hide sidebar search |
|  | Supply results manually |
|  /  | Control the search field |
|  | Read the current query |

Always call  from the confirmed close path.

## Accessibility and Keyboard

- Prefer  for clickable controls.
- Decorative icons may use empty ; meaningful icons need text, , or .
- Move focus into modals and restore it to the trigger on close.
- Custom keyboard controls should support Enter/Space and expose the correct roles and states.
- Do not override system-level Alt shortcuts or unrelated editing keys.
- Critical text and borders must retain contrast without translucent materials.

## Responsive Design and Performance

- Declare and test minimum app dimensions in .
- Prefer grid/flex, , overflow, and container width over screen coordinates.
- Provide remote-image loading/error states and release object URLs.
- Remove document/window listeners, intervals, observers, streams, and pending requests before reinitialization.
- Throttle high-frequency settings, slider, and resize work.
- Pause animation, media, and polling in tombstone freeze hooks.

## Component Selection

| Need | Preferred component |
| --- | --- |
| Standard or primary action |  |
| Icon-only tool action |  /  |
| Boolean setting |  +  |
| Small mutually exclusive view set |  |
| Multi-document navigation |  |
| App section navigation |  |
| Transient feedback |  |
| Persistent system message |  |
| Destructive confirmation |  |
| Single short text value |  |
| Empty collection |  |
| Indeterminate/determinate progress |  /  |

Search existing apps before adding a component. Consistency in this project comes primarily from reuse rather than additional near-duplicate controls.


