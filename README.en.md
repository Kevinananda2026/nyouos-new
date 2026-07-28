# NyouOS

[简体中文](https://gitee.com/black-kevin/nyouos/blob/master/README.md) | English

Self-developed web desktop system built with HTML, CSS and JavaScript, maintained as private closed-source project.

## System Features
1. Login & Registration Interface
The KevinAnanda ROOT account is locked against repeated registration. All accounts are isolated by permissions; common accounts have no database read and write access.
2. Weather Service
Integrated with free Open-Meteo weather API. Global weather information is displayed on the status bar with zero API call fees.
3. App Shop
All extended tools are collected and managed uniformly. No extra third-party APIs for wallpapers and resources are needed.
4. Built-in Browser
Supports UA device recognition and self-designed easter egg logic, with no reliance on external detection APIs.
5. Multilingual Support
Compatible with Chinese, English, Thai and German.

## Current Version
v26.4

## Security Statement
1. The entire repository is private, and source code will never be disclosed.
2. Private keys and private configuration files are excluded by `.gitignore` and will never be uploaded to cloud servers.
3. Only the weather API is exposed publicly. No sensitive keys are hardcoded on frontend pages.

## Distribution Rules
Only the developer has permission to manage source code. Only compiled finished website is available for external distribution, and source code will not be provided.

## Usage Guide
1. You may download source code and open `index.html`. Redistribution of source code is forbidden. If you conduct secondary development based on the source code, do not release your modified code to public.
2. If you do not want to download source code, visit the official website: [NyouOS](https://nyouos.pages.dev). The website may lag occasionally.
3. An email that can receive mails normally is required for NyouOS account registration. All accounts are hosted on Supabase. Please contact Supabase official for relevant failures. NyouOS development team takes no relevant responsibilities.

## License Terms
1. The project source code is closed-source and private. Only KevinAnanda has rights to view, edit and maintain the code. No one may copy, repost, fully or partially upload the source code to Gitee, GitHub or other code hosting platforms without permission.
2. Public browsing and daily use of official website `nyouos.pages.dev` are allowed. Packaged builds can be used personally. Selling builds or source code for commercial use is strictly prohibited.
3. Do not modify system code and release counterfeit versions pretending to be official NyouOS. It is banned to revise system kernel and claim it as new official original release.
4. It is forbidden to reverse login logic and interface code for bulk account registration and malicious data crawling. Exploiting program bugs to access database illegally is not allowed.
5. Public online edition is only for daily normal use without any source code authorization. The developer has the right to suspend service access of anyone who leaks source code privately.
6. Open-Meteo weather API and Supabase follow their own official user agreements. NyouOS is not responsible for malfunctions and access limits of third-party platforms.

## Account Introduction
1. KevinAnanda: ROOT super administrator account, repeated registration permanently disabled, owns full backend management and configuration modification permissions.
George Wong: administrator account, responsible for daily auxiliary inspection.
Owner: common test account, only with basic browsing permission, unable to read or write database.
2. All regular user accounts without ROOT permission can only use basic system functions, with no access to backend operations and data export.

## Supplementary Notes
1. This project is stored in private Gitee repository. Only the developer can push updates; no other collaboration accounts exist. Contact the developer offline to obtain new installation packages.
2. Built-in browser, easter eggs, multilingual framework and App Shop are all fully hand-coded natively. No redundant third-party APIs are introduced, ensuring controllable stability.
3. Access speed varies on networks in Shenzhen, Hong Kong, Thailand and other regions. Loading stuttering is caused by network conditions instead of system defects.

## Acknowledgement
Thanks for using NyouOS On Web!