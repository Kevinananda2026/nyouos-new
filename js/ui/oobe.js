/**
 * OOBE first-launch onboarding flow.
 * Standalone module: 7 steps (0-6) with staged settings and live preview.
 */
const OOBE = {
    STORAGE_KEY: 'fluentos.oobe_completed',

    element: null,
    backgroundElement: null,
    steps: [],
    systemPreviewHosts: [],
    systemPreviewFrames: [],
    themeControlEl: null,
    windowBlurToggleEl: null,
    autoFullscreenToggleEl: null,

    userNameInputEl: null,
    userEmailInputEl: null,
    userInlineStatusEl: null,
    userSettingsHostEl: null,
    userSettingsBodyEl: null,
    userSettingsScrollArea: null,
    userSettingsViewportEl: null,
    userAvatarGridEl: null,
    userAvatarUploadBtnEl: null,
    userAvatarResetBtnEl: null,
    userAvatarFileInputEl: null,

    selectedLang: null,
    selectedCountry: null,
    selectedTheme: 'light',
    selectedWallpaper: 'Theme/Picture/Fluent-2.png',
    selectedWindowBlur: false,
    selectedAccentColor: '#0078d4',
    selectedAutoFullscreen: true,
    selectedSurfMode: 'local',
    selectedUserName: '',
    selectedUserEmail: '',
    selectedUserAvatar: 'Theme/Profile_img/UserAva.jpg',
    wallpaperHighResPromises: new Map(),
    selectedWallpaperHighResPromise: null,
    avatarThumbCache: null,
    avatarThumbBuildPromise: null,
    avatarThumbStorageKey: 'fluentos.avatarThumbs.v1',
    avatarPlaceholderSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    currentStep: 0,
    finishing: false,
    completionShown: false,
    completionTimer: null,
    completionParticles: [],
    completionParticleCanvas: null,
    completionParticleContext: null,
    completionParticleRaf: null,
    completionParticleStartTime: 0,
    completionParticleLastFrame: 0,
    completionParticleResizeHandler: null,
    completionPointerMoveHandler: null,
    completionPointerLeaveHandler: null,
    completionPointer: { x: 0, y: 0, vx: 0, vy: 0, active: false, lastTime: 0 },

    preloadingPromise: null,
    preloadCompleted: false,
    preloadFailed: false,

    clockTimer: null,

    SurfMessagesEl: null,
    SurfInputEl: null,
    SurfPreviewContentEl: null,
    SurfHistoryEl: null,
    SurfInputOnlyMode: true,
    SurfSettingsHostEl: null,
    SurfSettingsScrollArea: null,
    SurfSettingsViewportEl: null,
    SurfCustomOptionsWrapEl: null,
    SurfModeAnimating: false,
    pendingSurfCustomEnter: false,
    tempSurfPendingAction: null,
    oobeForceRestarting: false,
    oobeSurfApiListenerBound: false,

    /* Welcome animation state */
    welcomeLogoEl: null,
    welcomeBrandEl: null,
    welcomeBrandTextEl: null,
    welcomeCopyEl: null,
    welcomeTextEl: null,
    welcomeNextEl: null,
    welcomeAnimTimer: null,
    welcomePhaseTimer: null,
    welcomeLogoTextTimer: null,
    welcomeBrandTimer: null,
    welcomeTransformTimer: null,
    welcomeSwapTimer: null,
    welcomeTextIndex: 0,
    welcomeAnimStarted: false,
    logoBridgeEl: null,
    logoBridgeTimer: null,
    bridgeBootLogoEl: null,
    tiltRaf: null,
    tiltPointerX: 0,
    tiltPointerY: 0,
    tiltCurrentX: 0,
    tiltCurrentY: 0,

    i18n: {
        zh: {
            languageTitle: '语言 & Language',
            languageSubtitle: '选择 NyouOS 的显示语言。',
            langZhTitle: '简体中文',
            langZhDesc: '推荐中文用户',
            langEnTitle: 'English',
            langEnDesc: 'For English users',

            themePageTitle: '系统主题',
            themePageSubtitle: '让 NyouOS 看起来更像你。',
            themeTitle: '颜色模式',
            themeLight: '浅色',
            themeDark: '深色',
            wallpaperTitle: '桌面壁纸',
            wallpaperUpload: '上传',
            wallpaperLoading: '正在获取 Bing 壁纸...',
            wallpaperReady: 'Bing 壁纸已准备完成。',
            wallpaperError: '暂时无法获取 Bing 壁纸，可以重试或继续设置。',
            windowBlurTitle: '全局窗口模糊',
            windowBlurDesc: '让壁纸透过 Nyou 窗口。',
            autoFullscreenTitle: '开机自动网页全屏',
            autoFullscreenDesc: '启动后自动进入沉浸全屏。',

            accentPageTitle: '主题颜色',
            accentPageSubtitle: '选择用于按钮、焦点和高亮的颜色。',
            accentCurrentTitle: '当前颜色',
            customColorTitle: '自定义颜色',
            customColorDesc: '从调色板中选择任意颜色。',

            SurfPageTitle: 'SurfAI',
            SurfPageSubtitle: '选择 Surf 的工作方式，也可以在左侧临时对话。',
            SurfModeTitle: '对话模式',
            SurfModeLocal: '默认本地模式',
            SurfModeCustom: '自定义 API 模式',
            SurfInputPlaceholder: 'Ask me anything...',

            authPageTitle: '登录 / 注册',
            authPageSubtitle: '登录或创建 NyouOS 账号，设置你的名称。',
            authUsernameTitle: '名称',
            authUsernamePlaceholder: '输入你的名称',
            authLoginTab: '登录',
            authSignupTab: '注册',
            authEmailPlaceholder: '邮箱',
            authPasswordPlaceholder: '密码',
            authLoginBtn: '登录',
            authSignupBtn: '注册',

            passwordPageTitle: '设置密码',
            passwordPageSubtitle: '输入 4-10 位 PIN，用于锁屏登录。',
            pinTitle: 'PIN 密码',
            pinPlaceholder: '留空则使用当前 PIN',

            next: '下一步',
            back: '返回',
            finish: '完成设置',
            completionTitle: '大功告成',
            enterDesktop: '进入桌面',

            preloadRunning: '正在后台准备离线资源包...',
            preloadDone: '离线资源包已准备完成。',
            preloadFail: '部分资源暂未缓存完成，后续会按需加载。',

            previewSearch: '在此键入以搜索',
            previewPinned: '已固定',
            previewAllApps: '所有应用',
            previewAppFiles: '文件管理器',
            previewAppSettings: '设置',
            previewAppCalc: '计算器',
            previewAppNotes: '快记',
            previewAppBrowser: '浏览器',
            previewAppClock: '时钟',
            previewRecommended: '推荐的项目',
            previewMore: '更多',
            previewPictures: '图片',
            previewDownloads: '下载',
            previewLogin: '登录',

            SurfWelcome: '你好！我是 Surf。你可以先在这里随便聊聊。',
            SurfFallback: '我先记下你的问题，进入桌面后我们继续。',
            SurfOobeBlocked: '这个功能需要进入系统才可以使用哦~',

            privacyPageTitle: '隐私设置',
            privacyPageSubtitle: '选择你愿意共享的数据。',
            privacyDiagnosticsTitle: '诊断数据',
            privacyDiagnosticsDesc: '帮助我们改进产品（可选）。',
            privacyTailoredTitle: '个性化体验',
            privacyTailoredDesc: '使用你的数据提供更贴合的建议。',
            privacyAdsTitle: '广告个性化',
            privacyAdsDesc: '允许基于兴趣的广告推荐。',

            countryPageTitle: '国家/地区',
            countryPageSubtitle: '选择你所在的国家或地区，我们将为你推荐本地化的应用。',
            countrySearchPlaceholder: '搜索国家/地区',
            devicePageTitle: '设备名称',
            devicePageSubtitle: '给这台设备起个名字，便于在网络中识别。',
            deviceNameTitle: '设备名称'
        },
        en: {
            languageTitle: 'Language',
            languageSubtitle: 'Choose the display language for NyouOS.',
            langZhTitle: 'Chinese',
            langZhDesc: 'Simplified Chinese UI',
            langEnTitle: 'English',
            langEnDesc: 'Recommended for English users',

            themePageTitle: 'Theme',
            themePageSubtitle: 'Make NyouOS feel like yours.',
            themeTitle: 'Color mode',
            themeLight: 'Light',
            themeDark: 'Dark',
            wallpaperTitle: 'Desktop wallpaper',
            wallpaperUpload: 'Upload',
            wallpaperLoading: 'Fetching a Bing wallpaper...',
            wallpaperReady: 'The Bing wallpaper is ready.',
            wallpaperError: 'Bing wallpaper is unavailable. Retry or continue setup.',
            windowBlurTitle: 'Global window blur',
            windowBlurDesc: 'Let the wallpaper show through Nyou windows.',
            autoFullscreenTitle: 'Auto Web Fullscreen On Boot',
            autoFullscreenDesc: 'Enter immersive fullscreen automatically after startup.',

            accentPageTitle: 'Accent color',
            accentPageSubtitle: 'Choose the color used for buttons, focus and highlights.',
            accentCurrentTitle: 'Current color',
            customColorTitle: 'Custom color',
            customColorDesc: 'Choose any color from the color picker.',

            SurfPageTitle: 'SurfAI Mode',
            SurfPageSubtitle: 'Choose how Surf works, or try a temporary chat on the left.',
            SurfModeTitle: 'Conversation Mode',
            SurfModeLocal: 'Default local mode',
            SurfModeCustom: 'Custom API mode',
            SurfInputPlaceholder: 'Ask me anything...',

            authPageTitle: 'Log In / Sign Up',
            authPageSubtitle: 'Sign up or log in to your NyouOS account and set your display name.',
            authUsernameTitle: 'Display Name',
            authUsernamePlaceholder: 'Enter your display name',
            authLoginTab: 'Log In',
            authSignupTab: 'Sign Up',
            authEmailPlaceholder: 'Email',
            authPasswordPlaceholder: 'Password',
            authLoginBtn: 'Log In',
            authSignupBtn: 'Sign Up',

            passwordPageTitle: 'Set Password',
            passwordPageSubtitle: 'Enter a 4-10 digit PIN for lock screen login.',
            pinTitle: 'PIN',
            pinPlaceholder: 'Leave empty to keep current PIN',

            next: 'Next',
            back: 'Back',
            finish: 'Finish setup',
            completionTitle: 'Done',
            enterDesktop: 'Enter desktop',

            preloadRunning: 'Preparing offline resource pack in background...',
            preloadDone: 'Offline resource pack is ready.',
            preloadFail: 'Some assets are not cached yet and will load on demand.',

            previewSearch: 'Type here to search',
            previewPinned: 'Pinned',
            previewAllApps: 'All apps',
            previewAppFiles: 'File Manager',
            previewAppSettings: 'Settings',
            previewAppCalc: 'Calculator',
            previewAppNotes: 'Quick Notes',
            previewAppBrowser: 'Browser',
            previewAppClock: 'Clock',
            previewRecommended: 'Recommended',
            previewMore: 'More',
            previewPictures: 'Pictures',
            previewDownloads: 'Downloads',
            previewLogin: 'Sign in',

            SurfWelcome: 'Hi, I am Surf. You can chat with me here first.',
            SurfFallback: 'I got it. We can continue after entering desktop.',
            SurfOobeBlocked: 'This feature requires entering the system first.',

            privacyPageTitle: 'Privacy',
            privacyPageSubtitle: 'Choose what data you share.',
            privacyDiagnosticsTitle: 'Diagnostic data',
            privacyDiagnosticsDesc: 'Help us improve products (optional).',
            privacyTailoredTitle: 'Personalized experiences',
            privacyTailoredDesc: 'Use your data to provide more relevant suggestions.',
            privacyAdsTitle: 'Ad personalization',
            privacyAdsDesc: 'Allow interest-based ad recommendations.',

            countryPageTitle: 'Country/Region',
            countryPageSubtitle: 'Select your country or region for localized app recommendations.',
            countrySearchPlaceholder: 'Search country/region',
            devicePageTitle: 'Device name',
            devicePageSubtitle: 'Name this device to identify it on networks.',
            deviceNameTitle: 'Device name'
        },
        ja: {
            languageTitle: '言語',
            languageSubtitle: 'NyouOS の表示言語を選択してください。',
            langZhTitle: '簡体字中国語',
            langZhDesc: '中国語ユーザー向け',
            langEnTitle: '英語',
            langEnDesc: '英語ユーザー向け',
            langJaTitle: '日本語',
            langJaDesc: '日本語ユーザー向け',
            langThTitle: 'タイ語',
            langThDesc: 'タイ語ユーザー向け',
            langDeTitle: 'ドイツ語',
            langDeDesc: 'ドイツ語ユーザー向け',

            themePageTitle: 'テーマ',
            themePageSubtitle: 'NyouOS をあなたらしく。',
            themeTitle: 'カラーモード',
            themeLight: 'ライト',
            themeDark: 'ダーク',
            wallpaperTitle: 'デスクトップの壁紙',
            wallpaperUpload: 'アップロード',
            wallpaperLoading: 'Bing 壁紙を取得中...',
            wallpaperReady: 'Bing 壁紙の準備ができました。',
            wallpaperError: 'Bing 壁紙を取得できません。再試行するか、設定を続けてください。',
            windowBlurTitle: 'グローバルウィンドウのぼかし',
            windowBlurDesc: '壁紙を Nyou ウィンドウに透過させます。',
            autoFullscreenTitle: '起動時に自動でフルスクリーン',
            autoFullscreenDesc: '起動後に自動で全画面表示に切り替えます。',

            accentPageTitle: 'テーマカラー',
            accentPageSubtitle: 'ボタン、フォーカス、ハイライトに使用する色を選択してください。',
            accentCurrentTitle: '現在の色',
            customColorTitle: 'カスタムカラー',
            customColorDesc: 'カラーピッカーから任意の色を選択してください。',

            SurfPageTitle: 'SurfAI モード',
            SurfPageSubtitle: 'Surf の動作モードを選択するか、左側で一時的なチャットをお試しください。',
            SurfModeTitle: '会話モード',
            SurfModeLocal: 'デフォルトローカルモード',
            SurfModeCustom: 'カスタム API モード',
            SurfInputPlaceholder: '何でも聞いてください...',

            passwordPageTitle: 'パスワードの設定',
            passwordPageSubtitle: 'ロック画面のログインに使用する 4-10 桁の PIN を入力してください。',
            pinTitle: 'PIN',
            pinPlaceholder: '空のままにすると現在の PIN が保持されます',

            next: '次へ',
            back: '戻る',
            finish: 'セットアップを完了',
            completionTitle: '完了です',
            enterDesktop: 'デスクトップへ',

            preloadRunning: 'バックグラウンドでオフラインリソースパックを準備中...',
            preloadDone: 'オフラインリソースパックの準備ができました。',
            preloadFail: '一部のアセットはまだキャッシュされておらず、必要に応じて読み込まれます。',

            previewSearch: 'ここに入力して検索',
            previewPinned: 'ピン留め済み',
            previewAllApps: 'すべてのアプリ',
            previewAppFiles: 'ファイルマネージャー',
            previewAppSettings: '設定',
            previewAppCalc: '電卓',
            previewAppNotes: 'クイックメモ',
            previewAppBrowser: 'ブラウザ',
            previewAppClock: '時計',
            previewRecommended: 'おすすめ',
            previewMore: 'その他',
            previewPictures: 'ピクチャ',
            previewDownloads: 'ダウンロード',
            previewLogin: 'ログイン',

            SurfWelcome: 'こんにちは、Surf です。まずはここで気軽にお話ししましょう。',
            SurfFallback: '承知しました。デスクトップに入ったら続きを話しましょう。',
            SurfOobeBlocked: 'この機能はシステムに入ってからご利用ください。',

            authPageTitle: 'ログイン / 新規登録',
            authPageSubtitle: 'ログインまたはNyouOSアカウントを作成し、表示名を設定します。',
            authUsernameTitle: '表示名',
            authUsernamePlaceholder: '表示名を入力',
            authLoginTab: 'ログイン',
            authSignupTab: '新規登録',
            authEmailPlaceholder: 'メール',
            authPasswordPlaceholder: 'パスワード',
            authLoginBtn: 'ログイン',
            authSignupBtn: '新規登録',

            privacyPageTitle: 'プライバシー設定',
            privacyPageSubtitle: '共有するデータを選択してください。',
            privacyDiagnosticsTitle: '診断データ',
            privacyDiagnosticsDesc: '製品の改善に役立てます（任意）。',
            privacyTailoredTitle: 'パーソナライズされた体験',
            privacyTailoredDesc: 'データを使用して、より関連性の高い提案を提供します。',
            privacyAdsTitle: '広告のパーソナライズ',
            privacyAdsDesc: '興味に基づく広告を許可します。',

            countryPageTitle: '国/地域',
            countryPageSubtitle: 'お住まいの国または地域を選択してください。ローカライズされたアプリを推薦します。',
            countrySearchPlaceholder: '国/地域を検索',
            devicePageTitle: 'デバイス名',
            devicePageSubtitle: 'ネットワーク上で識別するための名前を付けてください。',
            deviceNameTitle: 'デバイス名'
        },
        th: {
            languageTitle: 'ภาษา',
            languageSubtitle: 'เลือกภาษาที่แสดงของ NyouOS',
            langZhTitle: 'จีนตรงอย่างง่าย',
            langZhDesc: 'สำหรับผู้ใช้ภาษาจีน',
            langEnTitle: 'อังกฤษ',
            langEnDesc: 'สำหรับผู้ใช้ภาษาอังกฤษ',
            langJaTitle: 'ญี่ปุ่น',
            langJaDesc: 'สำหรับผู้ใช้ภาษาญี่ปุ่น',
            langThTitle: 'ไทย',
            langThDesc: 'สำหรับผู้ใช้ภาษาไทย',
            langDeTitle: 'เยอรมนี',
            langDeDesc: 'สำหรับผู้ใช้ภาษาเยอรมนี',

            themePageTitle: 'ธีม',
            themePageSubtitle: 'ทำให้ NyouOS เป็นแบบคุณ',
            themeTitle: 'โหมดสี',
            themeLight: 'สว่าง',
            themeDark: 'เข้ม',
            wallpaperTitle: 'วอลเปเปอร์เดสก์ท็อป',
            wallpaperUpload: 'อัปโหลด',
            wallpaperLoading: 'กำลังดึงวอลเปเปอร์ Bing...',
            wallpaperReady: 'วอลเปเปอร์ Bing พร้อมแล้ว',
            wallpaperError: 'ไม่สามารถใช้วอลเปเปอร์ Bing ได้ ลองอีกครั้งหรือดำเนินการต่อ',
            windowBlurTitle: 'เบลอหน้าต่างทั่วไป',
            windowBlurDesc: 'ให้วอลเปเปอร์แสดงผ่านหน้าต่าง Nyou',
            autoFullscreenTitle: 'เปิดเว็บเต็มหน้าจออัตโนมัติเมื่อเปิด',
            autoFullscreenDesc: 'เข้าสู่โหมดเต็มหน้าจอโดยอัตโนมัติหลังเริ่มต้น',

            accentPageTitle: 'สีเน้น',
            accentPageSubtitle: 'เลือกสีที่ใช้สำหรับปุ่ม โฟกัส และไฮไลท์',
            accentCurrentTitle: 'สีปัจจุบัน',
            customColorTitle: 'สีที่กำหนดเอง',
            customColorDesc: 'เลือกสีใดๆ จากตัวเลือกสี',

            SurfPageTitle: 'โหมด SurfAI',
            SurfPageSubtitle: 'เลือกวิธีการทำงานของ Surf หรือลองแชทชั่วคราวทางด้านซ้าย',
            SurfModeTitle: 'โหมดการสนทนา',
            SurfModeLocal: 'โหมดโลคัลเริ่มต้น',
            SurfModeCustom: 'โหมด API ที่กำหนดเอง',
            SurfInputPlaceholder: 'ถามฉันอะไรก็ได้...',

            passwordPageTitle: 'ตั้งค่ารหัสผ่าน',
            passwordPageSubtitle: 'ป้อน PIN 4-10 หลักสำหรับการเข้าสู่ระบบหน้าจอล็อค',
            pinTitle: 'PIN',
            pinPlaceholder: 'ปล่อยว่างเพื่อเก็บ PIN ปัจจุบัน',

            next: 'ถัดไป',
            back: 'ย้อนกลับ',
            finish: 'เสร็จสิ้นการตั้งค่า',
            completionTitle: 'เสร็จสมบูรณ์',
            enterDesktop: 'เข้าสู่เดสก์ท็อป',

            preloadRunning: 'กำลังเตรียมแพ็กเกจทรัพยากรออฟไลน์ในพื้นหลัง...',
            preloadDone: 'แพ็กเกจทรัพยากรออฟไลน์พร้อมแล้ว',
            preloadFail: 'เนื้อหาบางส่วนยังไม่ได้แคชและจะโหลดตามความต้องการ',

            previewSearch: 'พิมพ์ที่นี่เพื่อค้นหา',
            previewPinned: 'ค้างไว้แล้ว',
            previewAllApps: 'แอปทั้งหมด',
            previewAppFiles: 'จัดการไฟล์',
            previewAppSettings: 'การตั้งค่า',
            previewAppCalc: 'เครื่องคิดเลข',
            previewAppNotes: 'โน้ตด่วน',
            previewAppBrowser: 'เบราว์เซอร์',
            previewAppClock: 'นาฬิกา',
            previewRecommended: 'แนะนำ',
            previewMore: 'เพิ่มเติม',
            previewPictures: 'รูปภาพ',
            previewDownloads: 'ดาวน์โหลด',
            previewLogin: 'เข้าสู่ระบบ',

            SurfWelcome: 'สวัสดี ฉันชื่อ Surf คุณสามารถคุยกับฉันที่นี่ก่อนได้',
            SurfFallback: 'เข้าใจแล้ว เราสามารถคุยต่อหลังเข้าเดสก์ท็อปได้',
            SurfOobeBlocked: 'ฟีเจอร์นี้ต้องเข้าสู่ระบบก่อนจึงจะใช้ได้',

            authPageTitle: 'เข้าสู่ระบบ / สมัครสมาชิก',
            authPageSubtitle: 'เข้าสู่ระบบหรือสร้างบัญชี NyouOS และตั้งค่าชื่อที่แสดง',
            authUsernameTitle: 'ชื่อที่แสดง',
            authUsernamePlaceholder: 'ป้อนชื่อที่แสดงของคุณ',
            authLoginTab: 'เข้าสู่ระบบ',
            authSignupTab: 'สมัครสมาชิก',
            authEmailPlaceholder: 'อีเมล',
            authPasswordPlaceholder: 'รหัสผ่าน',
            authLoginBtn: 'เข้าสู่ระบบ',
            authSignupBtn: 'สมัครสมาชิก',

            privacyPageTitle: 'การตั้งค่าความเป็นส่วนตัว',
            privacyPageSubtitle: 'เลือกข้อมูลที่คุณต้องการแชร์',
            privacyDiagnosticsTitle: 'ข้อมูลวินิจฉัย',
            privacyDiagnosticsDesc: 'ช่วยเราปรับปรุงผลิตภัณฑ์ (ไม่บังคับ)',
            privacyTailoredTitle: 'ประสบการณ์ส่วนตัว',
            privacyTailoredDesc: 'ใช้ข้อมูลของคุณเพื่อให้ข้อเสนอแนะที่เกี่ยวข้องมากขึ้น',
            privacyAdsTitle: 'โฆษณาเป้าหมาย',
            privacyAdsDesc: 'อนุญาตให้แสดงโฆษณาตามความสนใจ',

            countryPageTitle: 'ประเทศ/ภูมิภาค',
            countryPageSubtitle: 'เลือกประเทศหรือภูมิภาคของคุณ เราจะแนะนำแอปท้องถิ่นให้',
            countrySearchPlaceholder: 'ค้นหาประเทศ/ภูมิภาค',
            devicePageTitle: 'ชื่ออุปกรณ์',
            devicePageSubtitle: 'ตั้งชื่ออุปกรณ์นี้เพื่อใช้ระบุเครือข่าย',
            deviceNameTitle: 'ชื่ออุปกรณ์'
        },
        de: {
            languageTitle: 'Sprache',
            languageSubtitle: 'Wählen Sie die Anzeigesprache für NyouOS.',
            langZhTitle: 'Vereinfachtes Chinesisch',
            langZhDesc: 'Für chinesische Benutzer',
            langEnTitle: 'Englisch',
            langEnDesc: 'Für englische Benutzer',
            langJaTitle: 'Japanisch',
            langJaDesc: 'Für japanische Benutzer',
            langThTitle: 'Thailändisch',
            langThDesc: 'Für thailändische Benutzer',
            langDeTitle: 'Deutsch',
            langDeDesc: 'Für deutsche Benutzer',

            themePageTitle: 'Design',
            themePageSubtitle: 'Machen Sie NyouOS zu Ihrem.',
            themeTitle: 'Farbmodus',
            themeLight: 'Hell',
            themeDark: 'Dunkel',
            wallpaperTitle: 'Desktop-Hintergrund',
            wallpaperUpload: 'Hochladen',
            wallpaperLoading: 'Bing-Hintergrund wird geladen...',
            wallpaperReady: 'Der Bing-Hintergrund ist bereit.',
            wallpaperError: 'Bing-Hintergrund nicht verfügbar. Wiederholen Sie den Versuch oder fahren Sie fort.',
            windowBlurTitle: 'Globale Fensterunschärfe',
            windowBlurDesc: 'Lassen Sie den Hintergrund durch Nyou-Fenster scheinen.',
            autoFullscreenTitle: 'Automatischer Web-Vollbildmodus beim Start',
            autoFullscreenDesc: 'Wechselt nach dem Start automatisch in den Vollbildmodus.',

            accentPageTitle: 'Akzentfarbe',
            accentPageSubtitle: 'Wählen Sie die Farbe für Schaltflächen, Fokus und Hervorhebungen.',
            accentCurrentTitle: 'Aktuelle Farbe',
            customColorTitle: 'Benutzerdefinierte Farbe',
            customColorDesc: 'Wählen Sie eine beliebige Farbe aus der Farbauswahl.',

            SurfPageTitle: 'SurfAI-Modus',
            SurfPageSubtitle: 'Wählen Sie, wie Surf funktioniert, oder probieren Sie einen temporären Chat links.',
            SurfModeTitle: 'Konversationsmodus',
            SurfModeLocal: 'Standard-Lokalmodus',
            SurfModeCustom: 'Benutzerdefinierter API-Modus',
            SurfInputPlaceholder: 'Fragen Sie mich alles...',

            passwordPageTitle: 'Passwort festlegen',
            passwordPageSubtitle: 'Geben Sie eine 4-10-stellige PIN für die Sperrbildschirm-Anmeldung ein.',
            pinTitle: 'PIN',
            pinPlaceholder: 'Leer lassen, um die aktuelle PIN zu behalten',

            next: 'Weiter',
            back: 'Zurück',
            finish: 'Einrichtung abschließen',
            completionTitle: 'Fertig',
            enterDesktop: 'Zum Desktop',

            preloadRunning: 'Offline-Ressourcenpaket wird im Hintergrund vorbereitet...',
            preloadDone: 'Offline-Ressourcenpaket ist bereit.',
            preloadFail: 'Einige Assets sind noch nicht zwischengespeichert und werden bei Bedarf geladen.',

            previewSearch: 'Hier eingeben zum Suchen',
            previewPinned: 'Angeheftet',
            previewAllApps: 'Alle Apps',
            previewAppFiles: 'Datei-Manager',
            previewAppSettings: 'Einstellungen',
            previewAppCalc: 'Taschenrechner',
            previewAppNotes: 'Schnellnotizen',
            previewAppBrowser: 'Browser',
            previewAppClock: 'Uhr',
            previewRecommended: 'Empfohlen',
            previewMore: 'Mehr',
            previewPictures: 'Bilder',
            previewDownloads: 'Downloads',
            previewLogin: 'Anmelden',

            SurfWelcome: 'Hallo, ich bin Surf. Sie können hier zuerst mit mir chatten.',
            SurfFallback: 'Alles klar. Wir können nach dem Desktop weitermachen.',
            SurfOobeBlocked: 'Diese Funktion erfordert zuerst den Eintritt in das System.',

            authPageTitle: 'Anmelden / Registrieren',
            authPageSubtitle: 'Melden Sie sich an oder erstellen Sie ein NyouOS-Konto und legen Sie Ihren Anzeigenamen fest.',
            authUsernameTitle: 'Anzeigename',
            authUsernamePlaceholder: 'Geben Sie Ihren Anzeigenamen ein',
            authLoginTab: 'Anmelden',
            authSignupTab: 'Registrieren',
            authEmailPlaceholder: 'E-Mail',
            authPasswordPlaceholder: 'Passwort',
            authLoginBtn: 'Anmelden',
            authSignupBtn: 'Registrieren',

            privacyPageTitle: 'Datenschutz',
            privacyPageSubtitle: 'Wählen Sie aus, welche Daten Sie teilen.',
            privacyDiagnosticsTitle: 'Diagnosedaten',
            privacyDiagnosticsDesc: 'Helfen Sie uns, Produkte zu verbessern (optional).',
            privacyTailoredTitle: 'Personalisierte Erlebnisse',
            privacyTailoredDesc: 'Nutzen Sie Ihre Daten für relevantere Vorschläge.',
            privacyAdsTitle: 'Werbepersonalisierung',
            privacyAdsDesc: 'Interessenbasierte Werbung erlauben.',

            countryPageTitle: 'Land/Region',
            countryPageSubtitle: 'Wählen Sie Ihr Land oder Ihre Region für lokalisierte App-Empfehlungen.',
            countrySearchPlaceholder: 'Land/Region suchen',
            devicePageTitle: 'Gerätename',
            devicePageSubtitle: 'Geben Sie diesem Gerät einen Namen zur Netzwerkidentifizierung.',
            deviceNameTitle: 'Gerätename'
        }
    },

    init() {
        this.element = document.getElementById('oobe-screen');
        if (!this.element) return;

        this.backgroundElement = document.getElementById('oobe-background');

        this.steps = Array.from(this.element.querySelectorAll('.oobe-step'));

        /* Init Supabase */
        const SUPABASE_URL = 'https://ybfqmaonxptzoyfdjxon.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZnFtYW9ueHB0em95ZmRqeG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMjc2NTEsImV4cCI6MjEwMDcwMzY1MX0.aLZKnP0HmHCUVo_o7EAuFYUxW8UWhAmzOuvuQW9puig';
        this.supabase = (window.supabase && window.supabase.createClient)
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
            : null;
        // 暴露 Supabase 客户端供设置页面使用
        if (this.supabase) {
            window.supabaseClient = this.supabase;
        }
        this.authChecked = false;
        this.isAuthenticated = false;
        this.systemPreviewHosts = [
            document.getElementById('oobe-theme-preview-host'),
            document.getElementById('oobe-accent-preview-host')
        ].filter(Boolean);
        this.themeControlEl = document.getElementById('oobe-theme-control');
        this.windowBlurToggleEl = document.getElementById('oobe-window-blur-toggle');
        this.autoFullscreenToggleEl = document.getElementById('oobe-auto-fullscreen-toggle');

        this.SurfMessagesEl = document.getElementById('oobe-Surf-messages');
        this.SurfInputEl = document.getElementById('oobe-Surf-input');
        this.SurfHistoryEl = document.getElementById('oobe-Surf-history');
        this.SurfPreviewContentEl = document.getElementById('oobe-live-Surf-content');
        this.SurfSettingsHostEl = document.getElementById('oobe-Surf-settings-scroll-host');
        this.authUsernameInputEl = document.getElementById('oobe-auth-username-input');

        /* Welcome elements */
        this.welcomeLogoEl = document.getElementById('oobe-welcome-logo');
        this.welcomeBrandEl = document.getElementById('oobe-welcome-brand');
        this.welcomeBrandTextEl = document.getElementById('oobe-welcome-brand-text');
        this.welcomeTextEl = document.getElementById('oobe-welcome-text');
        this.welcomeCopyEl = this.welcomeTextEl?.closest('.oobe-welcome-copy') || null;
        this.welcomeNextEl = document.getElementById('oobe-welcome-continue');

        this._initThemeControls();
        this._initAccentPalette();
        this._initSurfSettingsPanel();
        if (!this.oobeSurfApiListenerBound && State && typeof State.on === 'function') {
            this.oobeSurfApiListenerBound = true;
            State.on('SurfApiKeyReady', () => this._renderSurfSettingsPanel());
        }

        this._bindEvents();
        this._bindTiltEffect();
        this._refreshTexts();
        this._setStep(0, true);
        this.hide();
    },

    shouldShowOnFirstLaunch() {
        try {
            return !localStorage.getItem(this.STORAGE_KEY);
        } catch (_) {
            return true;
        }
    },

    show(options = {}) {
        if (!this.element) return;

        this.element.classList.remove('hidden');
        this.element.style.opacity = '1';

        this._resetFlow();
        this._syncBackgroundWithLockWallpaper();
        this._syncDesktopPreviewState();
        this._startPreloadInBackground();

        this._refreshTexts();
        this._setStep(0, true);
        requestAnimationFrame(() => {
            this._initSystemPreviews();
            this._syncDesktopPreviewState();
        });
        if (options && options.bootLogoEl) {
            this._startWelcomeAnimationFromBootLogo(options.bootLogoEl);
        } else {
            this._startWelcomeAnimation();
        }
    },

    hide() {
        if (!this.element) return;

        this._resetCompletionScene();
        this._stopPreviewClockTimer();
        this._stopWelcomeAnimation();
        this._resetTiltEffect();
        if (this.welcomeLogoEl) {
            this.welcomeLogoEl.classList.remove('oobe-logo-bridged');
        }
        this.element.classList.add('hidden');
        document.body.classList.remove('oobe-dark-dialog-mode');
    },

    completeAndEnterLock() {
        this.completeAndEnterDesktop();
    },

    _detectBrowserLanguage() {
        const browserLanguage = String(
            (Array.isArray(navigator.languages) && navigator.languages[0])
            || navigator.language
            || ''
        ).toLowerCase();
        return browserLanguage === 'zh' || browserLanguage.startsWith('zh-') ? 'zh' : 'en';
    },

    completeAndEnterDesktop() {
        if (this.finishing || !this.element) return;
        this.finishing = true;

        const continueToDesktop = async () => {
            const selectedWallpaperPreview = typeof WallpaperStore !== 'undefined' && WallpaperStore.isReference(this.selectedWallpaper)
                ? State.getResolvedWallpaper('desktop')
                : this.selectedWallpaper;
            await this._ensureWallpaperHighResolution(selectedWallpaperPreview);
            await this._applySelections();
            // OOBE may have entered browser fullscreen after Widgets initialized.
            // Build the starter desktop against the real grid visible at this moment.
            if (typeof Widgets !== 'undefined' && typeof Widgets.initializeDefaultDesktopLayoutForViewport === 'function') {
                Widgets.initializeDefaultDesktopLayoutForViewport();
            }
            this._markCompleted();
            if (State && typeof State.updateSession === 'function') {
                State.updateSession({
                    isLoggedIn: true,
                    lastLogin: new Date().toISOString(),
                    loginAttempts: 0
                });
            }
            this._showCompletionScene();
        };

        if (!this._shouldWarnDefaultPinBeforeFinish()) {
            continueToDesktop().catch(() => {
                this.finishing = false;
            });
            return;
        }

        this._showDefaultPinWarningDialog().then((confirmed) => {
            if (!confirmed) {
                this.finishing = false;
                return;
            }
            continueToDesktop().catch(() => {
                this.finishing = false;
            });
        }).catch(() => {
            this.finishing = false;
        });
    },

    _shouldWarnDefaultPinBeforeFinish() {
        const pinInput = document.getElementById('oobe-pin-input');
        const inputPin = pinInput ? String(pinInput.value || '').trim() : '';
        const currentPin = String(State?.settings?.pin || '1234').trim() || '1234';
        const hasValidNewPin = inputPin.length >= 4 && inputPin.length <= 10;
        const effectivePin = hasValidNewPin ? inputPin : currentPin;
        const pinChanged = hasValidNewPin && inputPin !== currentPin;

        return !pinChanged && effectivePin === '1234';
    },

    _showDefaultPinWarningDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(true);
                return;
            }

            const isZh = this._langCode() === 'zh';
            const confirmBase = isZh ? '确定' : 'OK';
            const title = isZh ? '默认密码提示' : 'Default Password Notice';
            const content = isZh
                ? '你还没有修改锁屏密码。默认锁屏密码为 1234。'
                : 'You have not changed the lock screen password. The default lock screen password is 1234.';

            let seconds = 3;
            let timer = null;
            const dialogRef = FluentUI.Dialog({
                type: 'warning',
                title,
                content,
                closeOnOverlay: false,
                buttons: [
                    { text: `${confirmBase} (${seconds}s)`, variant: 'primary', value: 'confirm' }
                ],
                onClose: (result) => {
                    if (timer) clearInterval(timer);
                    resolve(result === 'confirm');
                }
            });

            const confirmBtn = dialogRef?.dialog?.querySelector('.fluent-dialog-footer .fluent-btn');
            if (!confirmBtn) return;

            const setConfirmText = (sec) => {
                const textEl = confirmBtn.querySelector('.fluent-btn-text');
                const text = sec > 0 ? `${confirmBase} (${sec}s)` : confirmBase;
                if (textEl) {
                    textEl.textContent = text;
                } else {
                    confirmBtn.textContent = text;
                }
            };

            confirmBtn.disabled = true;
            setConfirmText(seconds);
            timer = setInterval(() => {
                seconds -= 1;
                if (seconds <= 0) {
                    clearInterval(timer);
                    timer = null;
                    confirmBtn.disabled = false;
                    setConfirmText(0);
                    return;
                }
                setConfirmText(seconds);
            }, 1000);
        });
    },

    _enterDesktopTransition() {
        const desktopEl = document.getElementById('desktop-screen');
        if (desktopEl) {
            Desktop.show();
            desktopEl.classList.remove('hidden');
            desktopEl.classList.remove('oobe-desktop-entering');
            void desktopEl.offsetWidth;
            desktopEl.classList.add('oobe-desktop-entering');
        }

        this.element.classList.remove('oobe-leaving');
        void this.element.offsetWidth;
        this.element.classList.add('oobe-leaving');

        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => {
            this.element.classList.remove('oobe-leaving');
            desktopEl?.classList.remove('oobe-desktop-entering');
            if (State && typeof State.setView === 'function') {
                State.setView('desktop');
            } else {
                this.hide();
            }
            this.finishing = false;
            this._openTipsAfterFirstRun();
        }, reducedMotion ? 80 : 1040);
    },

    _showCompletionScene() {
        if (!this.element || this.completionShown) return;
        this.completionShown = true;
        this._resetTiltEffect();
        this._refreshTexts();
        this._buildCompletionParticles();
        this.element.classList.add('oobe-completing');

        const completion = document.getElementById('oobe-completion');
        if (completion) completion.setAttribute('aria-hidden', 'false');

        const revealDelay = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 30 : 760;
        this.completionTimer = setTimeout(() => {
            this.element?.classList.add('oobe-completion-visible');
            this._startCompletionParticleBurst();
            this.completionTimer = null;
        }, revealDelay);
    },

    _buildCompletionParticles() {
        this._stopCompletionParticles();
        const canvas = document.getElementById('oobe-completion-particles');
        const context = canvas?.getContext?.('2d');
        if (!canvas || !context) return;

        this.completionParticleCanvas = canvas;
        this.completionParticleContext = context;
        const resize = () => {
            const oldWidth = Number(canvas.dataset.cssWidth) || window.innerWidth;
            const oldHeight = Number(canvas.dataset.cssHeight) || window.innerHeight;
            const width = Math.max(1, window.innerWidth);
            const height = Math.max(1, window.innerHeight);
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.dataset.cssWidth = String(width);
            canvas.dataset.cssHeight = String(height);
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (this.completionParticles.length && oldWidth && oldHeight) {
                const scaleX = width / oldWidth;
                const scaleY = height / oldHeight;
                this.completionParticles.forEach((particle) => {
                    particle.x *= scaleX;
                    particle.y *= scaleY;
                    particle.originX = width / 2;
                    particle.originY = height / 2;
                });
            }
        };
        this.completionParticleResizeHandler = resize;
        window.addEventListener('resize', resize);
        resize();

        const width = Number(canvas.dataset.cssWidth);
        const height = Number(canvas.dataset.cssHeight);
        const centerX = width / 2;
        const centerY = height / 2;
        const compact = width <= 520;
        const burstCount = compact
            ? 130
            : Math.min(300, Math.max(235, Math.round((width * height) / 5000)));
        const ambientCount = compact
            ? 250
            : Math.min(620, Math.max(500, Math.round((width * height) / 4000)));
        const count = burstCount + ambientCount;

        this.completionParticles = Array.from({ length: count }, (_, index) => {
            const ambient = index >= burstCount;
            const angle = Math.random() * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const xLimit = cos > 0 ? (width - centerX - 8) / cos : cos < 0 ? (8 - centerX) / cos : Infinity;
            const yLimit = sin > 0 ? (height - centerY - 8) / sin : sin < 0 ? (8 - centerY) / sin : Infinity;
            const edgeDistance = Math.min(xLimit, yLimit);
            const distance = edgeDistance * (0.25 + Math.pow(Math.random(), 0.52) * 0.72);
            const damping = 0.966 + Math.random() * 0.012;
            const speed = distance * (1 - damping) * (1.2 + Math.random() * 0.18);
            return {
                x: ambient ? 8 + Math.random() * Math.max(1, width - 16) : centerX,
                y: ambient ? 8 + Math.random() * Math.max(1, height - 16) : centerY,
                originX: centerX,
                originY: centerY,
                vx: ambient ? 0 : cos * speed,
                vy: ambient ? 0 : sin * speed,
                damping,
                angle: angle + (Math.random() - 0.5) * 0.5,
                spin: ambient ? 0 : (Math.random() - 0.5) * 0.34,
                size: ambient ? 1 + Math.random() * 2.5 : 1.4 + Math.random() * 3.8,
                length: ambient ? 2 + Math.random() * 8 : 3 + Math.random() * 13,
                hue: 188 + Math.random() * 46,
                alpha: ambient ? 0.28 + Math.random() * 0.48 : 0.46 + Math.random() * 0.5,
                shape: index % 5,
                delay: ambient ? 1050 + Math.random() * 1450 : Math.random() * 150,
                ambient,
                highlight: 0
            };
        });

        const pointer = this.completionPointer;
        pointer.active = false;
        pointer.vx = 0;
        pointer.vy = 0;
        this.completionPointerMoveHandler = (event) => {
            if (!this.completionShown) return;
            const now = performance.now();
            const elapsed = Math.max(8, now - (pointer.lastTime || now));
            const nextVx = ((event.clientX - pointer.x) / elapsed) * 16.67;
            const nextVy = ((event.clientY - pointer.y) / elapsed) * 16.67;
            pointer.vx = Math.max(-34, Math.min(34, nextVx));
            pointer.vy = Math.max(-34, Math.min(34, nextVy));
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointer.lastTime = now;
            pointer.active = true;
        };
        this.completionPointerLeaveHandler = () => {
            pointer.active = false;
            pointer.vx = 0;
            pointer.vy = 0;
        };
        window.addEventListener('pointermove', this.completionPointerMoveHandler, { passive: true });
        document.documentElement.addEventListener('pointerleave', this.completionPointerLeaveHandler);
    },

    _startCompletionParticleBurst() {
        if (!this.completionParticleCanvas || !this.completionParticleContext) return;
        this.completionParticleStartTime = performance.now();
        this.completionParticleLastFrame = 0;
        this.completionParticleRaf = requestAnimationFrame((time) => this._animateCompletionParticles(time));
    },

    _animateCompletionParticles(time) {
        const canvas = this.completionParticleCanvas;
        const context = this.completionParticleContext;
        if (!canvas || !context || !this.completionShown) return;

        const width = Number(canvas.dataset.cssWidth) || window.innerWidth;
        const height = Number(canvas.dataset.cssHeight) || window.innerHeight;
        const delta = this.completionParticleLastFrame
            ? Math.min(4.2, Math.max(0.45, (time - this.completionParticleLastFrame) / 16.67))
            : 1;
        this.completionParticleLastFrame = time;
        const burstAge = time - this.completionParticleStartTime;
        const pointer = this.completionPointer;
        const interactionRadius = Math.min(210, Math.max(145, width * 0.115));

        context.clearRect(0, 0, width, height);
        context.globalCompositeOperation = 'lighter';
        this.completionParticles.forEach((particle) => {
            const age = burstAge - particle.delay;
            if (age < 0) return;

            const damping = Math.pow(particle.damping, delta);
            particle.vx *= damping;
            particle.vy *= damping;
            particle.spin *= Math.pow(0.982, delta);

            if (pointer.active) {
                const dx = particle.x - pointer.x;
                const dy = particle.y - pointer.y;
                const distance = Math.hypot(dx, dy) || 1;
                if (distance < interactionRadius) {
                    const force = Math.pow(1 - distance / interactionRadius, 2);
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const flowX = pointer.vx * 0.075;
                    const flowY = pointer.vy * 0.075;
                    particle.vx += (nx * 0.62 - ny * 0.48 + flowX) * force * delta;
                    particle.vy += (ny * 0.62 + nx * 0.48 + flowY) * force * delta;
                    particle.spin += (pointer.vx + pointer.vy) * 0.0018 * force;
                    particle.highlight = Math.max(particle.highlight, force);
                }
            }

            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.angle += particle.spin * delta;
            particle.highlight *= Math.pow(0.91, delta);

            const margin = 5;
            if (particle.x < margin || particle.x > width - margin) {
                particle.x = Math.max(margin, Math.min(width - margin, particle.x));
                particle.vx *= -0.28;
            }
            if (particle.y < margin || particle.y > height - margin) {
                particle.y = Math.max(margin, Math.min(height - margin, particle.y));
                particle.vy *= -0.28;
            }

            const appear = Math.min(1, age / (particle.ambient ? 1050 : 150));
            const burstGlow = particle.ambient ? 0 : Math.max(0, 1 - age / 1450);
            const glow = Math.max(burstGlow * 0.76, particle.highlight);
            const lightness = 68 + glow * 24;
            const color = `hsl(${particle.hue} 100% ${lightness}%)`;
            context.save();
            context.translate(particle.x, particle.y);
            context.rotate(particle.angle);
            context.globalAlpha = particle.alpha * appear * (0.78 + glow * 0.32);
            context.fillStyle = color;
            context.strokeStyle = color;
            if (glow > 0.08) {
                context.shadowColor = color;
                context.shadowBlur = 5 + glow * 19;
            }

            if (particle.shape === 0 || particle.shape === 3) {
                context.beginPath();
                context.moveTo(-particle.length / 2, -particle.size * 0.38);
                context.lineTo(particle.length / 2, -particle.size * 0.18);
                context.lineTo(particle.length * 0.34, particle.size * 0.62);
                context.lineTo(-particle.length * 0.42, particle.size * 0.34);
                context.closePath();
                context.fill();
            } else if (particle.shape === 1) {
                context.beginPath();
                context.arc(0, 0, particle.size * 0.72, 0, Math.PI * 2);
                context.fill();
            } else if (particle.shape === 2) {
                context.rotate(Math.PI / 4);
                context.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
            } else {
                context.lineWidth = Math.max(1, particle.size * 0.45);
                context.beginPath();
                context.arc(0, 0, particle.size * 1.15, 0, Math.PI * 2);
                context.stroke();
            }
            context.restore();
        });
        context.globalCompositeOperation = 'source-over';
        pointer.vx *= 0.9;
        pointer.vy *= 0.9;
        this.completionParticleRaf = requestAnimationFrame((nextTime) => this._animateCompletionParticles(nextTime));
    },

    _stopCompletionParticles() {
        if (this.completionParticleRaf) cancelAnimationFrame(this.completionParticleRaf);
        this.completionParticleRaf = null;
        if (this.completionParticleResizeHandler) window.removeEventListener('resize', this.completionParticleResizeHandler);
        if (this.completionPointerMoveHandler) window.removeEventListener('pointermove', this.completionPointerMoveHandler);
        if (this.completionPointerLeaveHandler) document.documentElement.removeEventListener('pointerleave', this.completionPointerLeaveHandler);
        this.completionParticleResizeHandler = null;
        this.completionPointerMoveHandler = null;
        this.completionPointerLeaveHandler = null;
        this.completionParticleContext?.clearRect(
            0,
            0,
            Number(this.completionParticleCanvas?.dataset.cssWidth) || window.innerWidth,
            Number(this.completionParticleCanvas?.dataset.cssHeight) || window.innerHeight
        );
        this.completionParticles = [];
        this.completionParticleCanvas = null;
        this.completionParticleContext = null;
    },

    _resetCompletionScene() {
        if (this.completionTimer) clearTimeout(this.completionTimer);
        this.completionTimer = null;
        this._stopCompletionParticles();
        this.completionShown = false;
        this.element?.classList.remove('oobe-completing', 'oobe-completion-visible');
        const completion = document.getElementById('oobe-completion');
        if (completion) completion.setAttribute('aria-hidden', 'true');
    },

    enterDesktopFromCompletion() {
        if (!this.completionShown) return;
        const button = document.getElementById('oobe-enter-desktop');
        if (button) button.disabled = true;
        this._enterDesktopTransition();
    },

    _openTipsAfterFirstRun() {
        const welcomeKey = 'fluentos.tips_welcome_shown';
        try {
            if (localStorage.getItem(welcomeKey) === '1') return;
            const isInstalled = typeof AppShop !== 'undefined'
                && typeof AppShop.isInstalled === 'function'
                && AppShop.isInstalled('tips');
            if (!isInstalled || typeof WindowManager === 'undefined') return;
            localStorage.setItem(welcomeKey, '1');
            setTimeout(() => WindowManager.openApp('tips', { section: 'getting-started' }), 180);
        } catch (error) {
            console.warn('[OOBE] Unable to launch Tips welcome experience', error);
        }
    },

    _getUserAvatarOptions() {
        return [
            'Theme/Profile_img/UserAva.jpg',
            ...Array.from({ length: 10 }, (_, i) => `Theme/Profile_img/${i + 1}.jpg`)
        ];
    },

    _getProfileFallbacks() {
        const fallbackName = (I18n && typeof I18n.t === 'function') ? I18n.t('login.username') : 'Owner';
        const fallbackEmail = (I18n && typeof I18n.t === 'function') ? I18n.t('login.email') : 'owner@sample.com';
        return { fallbackName, fallbackEmail };
    },

    _getInitialUserProfileDraft() {
        const { fallbackName, fallbackEmail } = this._getProfileFallbacks();
        const avatars = this._getUserAvatarOptions();
        const rawAvatar = String(State?.settings?.userAvatar || '').trim();
        const isCustomAvatar = /^data:image\//i.test(rawAvatar);
        const avatar = (avatars.includes(rawAvatar) || isCustomAvatar) ? rawAvatar : avatars[0];
        const name = String(State?.settings?.userName || '').trim() || fallbackName;
        const email = String(State?.settings?.userEmail || '').trim() || fallbackEmail;
        return { name, email, avatar };
    },

    _isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    },

    _getAvatarThumbCache() {
        if (this.avatarThumbCache) return this.avatarThumbCache;
        try {
            const raw = localStorage.getItem(this.avatarThumbStorageKey);
            const parsed = raw ? JSON.parse(raw) : {};
            this.avatarThumbCache = parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            this.avatarThumbCache = {};
        }
        return this.avatarThumbCache;
    },

    _saveAvatarThumbCache() {
        try {
            localStorage.setItem(this.avatarThumbStorageKey, JSON.stringify(this.avatarThumbCache || {}));
        } catch (_) {
            // ignore storage errors
        }
    },

    _getAvatarThumbSrc(src, fallback = '') {
        const cache = this._getAvatarThumbCache();
        const preloadSrc = typeof BootScreen !== 'undefined' && typeof BootScreen.getOobeAvatarPreview === 'function'
            ? BootScreen.getOobeAvatarPreview(src)
            : src;
        return cache[src] || preloadSrc || fallback || this.avatarPlaceholderSrc;
    },

    async _buildAvatarThumb(src, size = 80) {
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

    async _ensureAvatarThumbs(sources = []) {
        if (!Array.isArray(sources) || sources.length === 0) return;
        if (this.avatarThumbBuildPromise) return this.avatarThumbBuildPromise;

        this.avatarThumbBuildPromise = (async () => {
            const cache = this._getAvatarThumbCache();
            let changed = false;

            for (const src of sources) {
                if (!src || cache[src] || /^data:image\//i.test(src)) continue;
                if (typeof BootScreen !== 'undefined' && typeof BootScreen.getOobeAvatarPreview === 'function'
                    && BootScreen.getOobeAvatarPreview(src) !== src) continue;

                await new Promise((resolve) => {
                    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
                        window.requestIdleCallback(() => resolve(), { timeout: 120 });
                    } else {
                        setTimeout(resolve, 16);
                    }
                });

                const thumb = await this._buildAvatarThumb(src, 80);
                if (!thumb || thumb === src) continue;

                cache[src] = thumb;
                changed = true;

                if (this.element) {
                    const key = encodeURIComponent(src);
                    const imgs = this.element.querySelectorAll(`img[data-avatar-key="${key}"]`);
                    imgs.forEach((img) => {
                        img.src = thumb;
                    });

                    const selectedAvatar = String(this.selectedUserAvatar || '').trim();
                    if (selectedAvatar === src) {
                        this._syncLockPreviewProfile();
                    }
                }
            }

            if (changed) {
                this.avatarThumbCache = cache;
                this._saveAvatarThumbCache();
            }
        })().finally(() => {
            this.avatarThumbBuildPromise = null;
        });

        return this.avatarThumbBuildPromise;
    },

    _syncUserProfileDraftToInputs() {
        if (!this.selectedUserAvatar) {
            const authAvatar = this._getAuthAvatar();
            if (authAvatar) this.selectedUserAvatar = authAvatar;
        }
        if (this.authUsernameInputEl) this.authUsernameInputEl.value = this.selectedUserName;
    },

    _syncLockPreviewProfile() {
        const { fallbackName, fallbackEmail } = this._getProfileFallbacks();
        const avatar = String(this.selectedUserAvatar || '').trim() || 'Theme/Profile_img/UserAva.jpg';
        const previewAvatarSrc = this._getAvatarThumbSrc(avatar, avatar);
        const name = String(this.selectedUserName || '').trim() || fallbackName;
        const email = String(this.selectedUserEmail || '').trim() || fallbackEmail;

        this.element.querySelectorAll('.oobe-lock-preview-username').forEach((el) => {
            el.textContent = name;
        });
        this.element.querySelectorAll('.oobe-lock-preview-email').forEach((el) => {
            el.textContent = email;
        });
        this.element.querySelectorAll('.oobe-lock-preview-avatar').forEach((img) => {
            img.onerror = () => {
                img.onerror = null;
                img.src = 'Theme/Profile_img/UserAva.jpg';
            };
            img.src = previewAvatarSrc;
        });
    },

    _renderUserAvatarGrid() {
        if (!this.userAvatarGridEl) return;
        this.userAvatarGridEl.innerHTML = '';

        const avatars = this._getUserAvatarOptions();
        const selected = String(this.selectedUserAvatar || '').trim();
        const isCustomSelected = /^data:image\//i.test(selected) && !avatars.includes(selected);
        const sources = isCustomSelected ? [selected, ...avatars] : avatars;
        const thumbSources = avatars.slice();

        sources.forEach((avatarPath, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `oobe-avatar-item ${avatarPath === selected ? 'active' : ''}`;
            const thumbSrc = this._getAvatarThumbSrc(avatarPath, avatarPath);
            const avatarKey = encodeURIComponent(avatarPath);
            btn.innerHTML = `<img src="${thumbSrc}" data-avatar-key="${avatarKey}" alt="avatar-${index + 1}" loading="lazy" decoding="async">`;
            btn.addEventListener('click', () => {
                this.selectedUserAvatar = avatarPath;
                this._renderUserAvatarGrid();
                this._syncLockPreviewProfile();
            });
            this.userAvatarGridEl.appendChild(btn);
        });

        requestAnimationFrame(() => {
            this._ensureAvatarThumbs(thumbSources);
        });

        if (this.userSettingsScrollArea && typeof this.userSettingsScrollArea.refresh === 'function') {
            requestAnimationFrame(() => this.userSettingsScrollArea.refresh());
        }
    },

    _syncUserStepState() {
        const d = this._dict();
        const next4 = document.getElementById('oobe-next-5');

        const name = String(this.selectedUserName || '').trim();
        const email = String(this.selectedUserEmail || '').trim();
        let message = '';
        let valid = true;

        if (!name) {
            valid = false;
            message = d.userNameRequired;
        } else if (!this._isValidEmail(email)) {
            valid = false;
            message = d.userEmailInvalid;
        }

        if (this.userInlineStatusEl) {
            this.userInlineStatusEl.textContent = message;
            this.userInlineStatusEl.classList.toggle('error', !valid);
        }

        if (next4) {
            next4.disabled = !valid;
            next4.classList.toggle('is-disabled', !valid);
        }

        return valid;
    },

    async _resizeImageFileToDataUrl(file, size = 192, quality = 0.8) {
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

    _initUserSettingsPanel() {
        if (!this.userSettingsHostEl || !this.userSettingsBodyEl) return;

        const body = this.userSettingsBodyEl;
        this.userSettingsHostEl.innerHTML = '';

        if (typeof FluentUI !== 'undefined' && FluentUI && typeof FluentUI.ScrollArea === 'function') {
            const scrollArea = FluentUI.ScrollArea({
                className: 'oobe-user-settings-scroll'
            });
            this.userSettingsHostEl.appendChild(scrollArea);
            this.userSettingsScrollArea = scrollArea;
            this.userSettingsViewportEl = typeof scrollArea.getViewport === 'function'
                ? scrollArea.getViewport()
                : scrollArea.querySelector('.fluent-scroll-viewport');
            (this.userSettingsViewportEl || this.userSettingsHostEl).appendChild(body);
            requestAnimationFrame(() => {
                if (this.userSettingsScrollArea && typeof this.userSettingsScrollArea.refresh === 'function') {
                    this.userSettingsScrollArea.refresh();
                }
            });
            return;
        }

        this.userSettingsScrollArea = null;
        this.userSettingsViewportEl = this.userSettingsHostEl;
        this.userSettingsHostEl.appendChild(body);
    },

    _initThemeControls() {
        if (typeof FluentUI === 'undefined' || !FluentUI) return;

        if (this.themeControlEl) {
            this.themeControlEl.innerHTML = '';
            this.themeControlEl.appendChild(FluentUI.SegmentedControl({
                segments: [
                    { id: 'light', label: this._dict().themeLight },
                    { id: 'dark', label: this._dict().themeDark }
                ],
                activeSegment: this.selectedTheme,
                onChange: (theme) => {
                    this.selectedTheme = theme === 'dark' ? 'dark' : 'light';
                    this._syncDesktopPreviewState();
                },
                className: 'oobe-theme-segmented'
            }));
        }

        if (this.windowBlurToggleEl) {
            this.windowBlurToggleEl.innerHTML = '';
            this.windowBlurToggleEl.appendChild(FluentUI.Toggle({
                checked: this.selectedWindowBlur,
                onChange: (value) => {
                    this.selectedWindowBlur = value === true;
                    this._syncDesktopPreviewState();
                }
            }));
        }

        if (this.autoFullscreenToggleEl) {
            this.autoFullscreenToggleEl.innerHTML = '';
            this.autoFullscreenToggleEl.appendChild(FluentUI.Toggle({
                checked: this.selectedAutoFullscreen,
                onChange: (value) => {
                    this.selectedAutoFullscreen = value === true;
                }
            }));
        }
    },

    _initAccentPalette() {
        const colors = [
            '#ffb900', '#f7630c', '#d13438', '#e81123',
            '#e3008c', '#b146c2', '#0078d4', '#6b69d6',
            '#0099bc', '#00b7c3', '#00a98f', '#107c10',
            '#7a7574', '#68768a', '#567c73', '#4c4a48'
        ];
        const grid = document.getElementById('oobe-accent-grid');
        if (!grid) return;
        grid.innerHTML = '';
        colors.forEach((color) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'oobe-accent-swatch';
            button.dataset.color = color;
            button.style.setProperty('--swatch-color', color);
            button.title = color.toUpperCase();
            button.setAttribute('aria-label', color.toUpperCase());
            button.innerHTML = '<img src="Theme/Icon/Symbol_icon/stroke/Check.svg" alt="">';
            button.addEventListener('click', () => this._selectAccentColor(color));
            grid.appendChild(button);
        });
        this._syncAccentSelection();
    },

    _selectAccentColor(color) {
        this.selectedAccentColor = State && typeof State.normalizeAccentColor === 'function'
            ? State.normalizeAccentColor(color)
            : String(color || '#0078d4').toLowerCase();
        this._syncAccentSelection();
        this._syncDesktopPreviewState();
    },

    _syncAccentSelection() {
        const normalized = String(this.selectedAccentColor || '#0078d4').toLowerCase();
        this.element?.querySelectorAll('.oobe-accent-swatch').forEach((button) => {
            const selected = String(button.dataset.color || '').toLowerCase() === normalized;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        const current = document.getElementById('oobe-accent-current-swatch');
        const value = document.getElementById('oobe-accent-current-value');
        const input = document.getElementById('oobe-custom-color-input');
        if (current) current.style.backgroundColor = normalized;
        if (value) value.textContent = normalized.toUpperCase();
        if (input) input.value = normalized;
    },

    _initSystemPreviews() {
        if (this.systemPreviewFrames.length) return;
        this.systemPreviewHosts.forEach((host) => {
            host.innerHTML = `
                <div class="oobe-preview-wallpaper"></div>
                <div class="oobe-preview-app-window">
                    <div class="oobe-preview-titlebar">
                        <div class="oobe-preview-app-title">
                            <img src="Theme/Icon/App_icon/settings.png" alt="">
                            <span class="oobe-preview-title-placeholder"></span>
                        </div>
                        <div class="oobe-preview-window-controls" aria-hidden="true">
                            <i class="oobe-preview-window-control"></i>
                            <i class="oobe-preview-window-control"></i>
                            <i class="oobe-preview-window-control"></i>
                        </div>
                    </div>
                    <div class="oobe-preview-window-content">
                        <aside class="oobe-preview-sidebar">
                            ${Array.from({ length: 6 }, (_, index) => `
                                <div class="oobe-preview-nav-row ${index === 0 ? 'active' : ''}">
                                    <i></i><span style="--placeholder-width:${52 + ((index % 4) * 10)}%"></span>
                                </div>
                            `).join('')}
                        </aside>
                        <main class="oobe-preview-main">
                            <div class="oobe-preview-device">
                                <div class="oobe-preview-device-image"></div>
                                <div class="oobe-preview-device-copy"><b></b><span></span><small></small></div>
                            </div>
                            <div class="oobe-preview-section-heading"></div>
                            <div class="oobe-preview-recommendations">
                                ${Array.from({ length: 3 }, () => `
                                    <div class="oobe-preview-recommendation"><i></i><div><b></b><span></span></div><em></em></div>
                                `).join('')}
                            </div>
                        </main>
                    </div>
                </div>
            `;
            this.systemPreviewFrames.push({
                host,
                wallpaperEl: host.querySelector('.oobe-preview-wallpaper'),
                windowEl: host.querySelector('.oobe-preview-app-window')
            });
        });
    },

    _bindTiltEffect() {
        if (this._tiltBound || !this.element) return;
        this._tiltBound = true;
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (reduceMotion || coarsePointer) return;

        window.addEventListener('pointermove', (event) => {
            this.tiltPointerX = ((event.clientX / Math.max(1, window.innerWidth)) - 0.5) * 2;
            this.tiltPointerY = ((event.clientY / Math.max(1, window.innerHeight)) - 0.5) * 2;
            this.element?.classList.add('oobe-tilt-active');
            this._scheduleTiltFrame();
        }, { passive: true });
        document.documentElement.addEventListener('mouseleave', () => this._resetTiltEffect());
    },

    _scheduleTiltFrame() {
        if (this.tiltRaf) return;
        const tick = () => {
            this.tiltRaf = null;
            this.tiltCurrentX += (this.tiltPointerX - this.tiltCurrentX) * 0.12;
            this.tiltCurrentY += (this.tiltPointerY - this.tiltCurrentY) * 0.12;
            this.element?.style.setProperty('--oobe-tilt-x', `${(-this.tiltCurrentY * 3).toFixed(3)}deg`);
            this.element?.style.setProperty('--oobe-tilt-y', `${(this.tiltCurrentX * 4).toFixed(3)}deg`);
            this.element?.style.setProperty('--oobe-tilt-shift-x', `${(this.tiltCurrentX * 4).toFixed(2)}px`);
            this.element?.style.setProperty('--oobe-tilt-shift-y', `${(this.tiltCurrentY * 3).toFixed(2)}px`);
            if (Math.abs(this.tiltPointerX - this.tiltCurrentX) > 0.003 || Math.abs(this.tiltPointerY - this.tiltCurrentY) > 0.003) {
                this._scheduleTiltFrame();
            } else if (this.tiltPointerX === 0 && this.tiltPointerY === 0) {
                this.element?.classList.remove('oobe-tilt-active');
            }
        };
        this.tiltRaf = requestAnimationFrame(tick);
    },

    _resetTiltEffect() {
        this.tiltPointerX = 0;
        this.tiltPointerY = 0;
        this._scheduleTiltFrame();
    },

    _selectWallpaper(wallpaper) {
        if (!wallpaper) return;
        this.selectedWallpaper = wallpaper;
        this.selectedWallpaperHighResPromise = this._ensureWallpaperHighResolution(wallpaper);
        this._syncWallpaperSelection();
        this._syncDesktopPreviewState();
    },

    _ensureWallpaperHighResolution(wallpaper) {
        const src = String(wallpaper || '').trim();
        if (!src) return Promise.resolve(false);

        const existing = this.wallpaperHighResPromises.get(src);
        if (existing) return existing;

        const promise = new Promise((resolve) => {
            let settled = false;
            const finish = (ok) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                resolve(ok);
            };
            const timeout = setTimeout(() => finish(false), 15000);
            const image = new Image();
            image.decoding = 'async';
            image.fetchPriority = 'high';
            image.onload = () => finish(true);
            image.onerror = () => finish(false);
            image.src = src;
            if (typeof image.decode === 'function') {
                image.decode().then(() => finish(true)).catch(() => {});
            }
        }).then(async (ok) => {
            if (!ok) {
                this.wallpaperHighResPromises.delete(src);
                return false;
            }

            // Also retain local wallpapers in the Fluent OS resource cache.
            if (typeof BootScreen !== 'undefined'
                && typeof BootScreen._fetchAndCacheAssetFromBrowserCache === 'function') {
                await BootScreen._fetchAndCacheAssetFromBrowserCache(src);
            }
            return true;
        });

        this.wallpaperHighResPromises.set(src, promise);
        return promise;
    },

    _syncWallpaperSelection() {
        this.element?.querySelectorAll('#oobe-wallpaper-grid [data-wallpaper]').forEach((button) => {
            const selected = button.dataset.wallpaper === this.selectedWallpaper;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
    },

    async _fetchBingWallpaper() {
        const button = document.getElementById('oobe-bing-wallpaper');
        const status = document.getElementById('oobe-wallpaper-status');
        const dict = this._dict();
        if (button?.disabled) return;
        if (button) button.disabled = true;
        if (status) {
            status.textContent = dict.wallpaperLoading;
            status.classList.remove('error', 'success');
        }
        try {
            const market = this._langCode() === 'en' ? 'en-US' : 'zh-CN';
            const response = await fetch(`https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=${market}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!data?.url) throw new Error('Invalid Bing wallpaper response');
            this._selectWallpaper(data.url);
            if (status) {
                status.textContent = dict.wallpaperReady;
                status.classList.add('success');
            }
        } catch (error) {
            console.warn('OOBE Bing wallpaper fetch failed', error);
            if (status) {
                status.textContent = dict.wallpaperError;
                status.classList.add('error');
            }
        } finally {
            if (button) button.disabled = false;
        }
    },

    _bindEvents() {
        window.addEventListener('resize', () => {
            if (this.currentStep === 0 && !this.element?.classList.contains('hidden')) {
                this._syncWelcomeLogoPositions();
            }
        }, { passive: true });

        const languageButtons = Array.from(this.element.querySelectorAll('.oobe-option-btn[data-lang]'));
        languageButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                this.selectedLang = btn.dataset.lang || 'zh';
                languageButtons.forEach(item => item.classList.toggle('active', item === btn));
                this._syncNextStep1State();
                this._refreshTexts();
            });
        });

        this.element.querySelectorAll('#oobe-wallpaper-grid [data-wallpaper]').forEach((button) => {
            button.addEventListener('click', () => this._selectWallpaper(button.dataset.wallpaper));
        });
        document.getElementById('oobe-bing-wallpaper')?.addEventListener('click', () => this._fetchBingWallpaper());
        const wallpaperFile = document.getElementById('oobe-wallpaper-file');
        document.getElementById('oobe-upload-wallpaper')?.addEventListener('click', () => wallpaperFile?.click());
        wallpaperFile?.addEventListener('change', (event) => {
            const file = event.target?.files?.[0];
            if (!file || !file.type?.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = () => this._selectWallpaper(String(reader.result || ''));
            reader.readAsDataURL(file);
            event.target.value = '';
        });
        const customColorInput = document.getElementById('oobe-custom-color-input');
        document.getElementById('oobe-custom-color-button')?.addEventListener('click', () => customColorInput?.click());
        customColorInput?.addEventListener('input', (event) => this._selectAccentColor(event.target.value));

        /* The welcome card itself is the forward action. */
        const welcomeCard = document.getElementById('oobe-card');
        if (welcomeCard) {
            welcomeCard.addEventListener('click', () => {
                if (this.currentStep !== 0 || !this.welcomeNextEl?.classList.contains('is-visible')) return;
                this._stopWelcomeAnimation();
                this._proceedFromWelcome();
            });
        }

        /* Auth step tab switching */
        const authTabs = this.element.querySelectorAll('.oobe-auth-tab');
        authTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                authTabs.forEach((t) => t.classList.toggle('active', t === tab));
                const isLogin = tab.getAttribute('data-auth-tab') === 'login';
                const loginForm = document.getElementById('oobe-login-form');
                const signupForm = document.getElementById('oobe-signup-form');
                if (loginForm) loginForm.style.display = isLogin ? 'flex' : 'none';
                if (signupForm) signupForm.style.display = isLogin ? 'none' : 'flex';
                // 登录 tab 时隐藏"名称"输入框（从 Supabase 读取），注册 tab 时显示
                const usernameBlock = this.authUsernameInputEl?.closest('.oobe-setting-block');
                if (usernameBlock) {
                    usernameBlock.style.display = isLogin ? 'none' : '';
                }
                const msg = document.getElementById('oobe-auth-message');
                if (msg) { msg.textContent = ''; msg.className = 'oobe-auth-message'; }
            });
        });

        /* Auth step is mandatory - no back button allowed */

        /* Login form */
        const loginForm = document.getElementById('oobe-login-form');
        if (loginForm && this.supabase) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = (document.getElementById('oobe-login-email')?.value || '').trim();
                const password = document.getElementById('oobe-login-password')?.value || '';
                if (!email || !password) return;
                const btn = loginForm.querySelector('.oobe-next-button');
                if (btn) { btn.disabled = true; btn.textContent = '登录中...'; }
                const msg = document.getElementById('oobe-auth-message');
                if (msg) { msg.textContent = ''; msg.className = 'oobe-auth-message'; }

                this.supabase.auth.signInWithPassword({ email, password })
                    .then((result) => {
                        if (result.error) {
                            if (msg) { msg.textContent = '登录失败: ' + result.error.message; msg.className = 'oobe-auth-message error'; }
                            if (btn) { btn.disabled = false; btn.textContent = '登录'; }
                            return;
                        }
                        if (msg) { msg.textContent = '登录成功！'; msg.className = 'oobe-auth-message success'; }
                        this.isAuthenticated = true;
                        // 从 Supabase 用户信息中自动填充用户名和邮箱
                        const user = result.data?.user;
                        let loginEmail = '';
                        if (user) {
                            loginEmail = user.email || '';
                            if (loginEmail && !this.selectedUserEmail) this.selectedUserEmail = loginEmail;
                            // 优先从 Supabase user_metadata.display_name 读取显示名称
                            const metaName = user.user_metadata?.display_name
                                || user.user_metadata?.user_name
                                || user.user_metadata?.full_name;
                            if (metaName && String(metaName).trim()) {
                                this.selectedUserName = String(metaName).trim();
                            } else if (!this.selectedUserName) {
                                const atIndex = loginEmail.indexOf('@');
                                this.selectedUserName = atIndex > 0 ? loginEmail.substring(0, atIndex) : loginEmail;
                            }
                            // 检测 root 权限
                            if (State && typeof State.checkRootPermission === 'function') {
                                State.checkRootPermission(this.selectedUserName);
                            }
                        }
                        if (State && typeof State.updateSession === 'function') {
                            State.updateSession({ isLoggedIn: true, userEmail: loginEmail });
                        }
                        // 从 localStorage 读取头像选择
                        const authAvatar = this._getAuthAvatar();
                        if (authAvatar && !this.selectedUserAvatar) {
                            this.selectedUserAvatar = authAvatar;
                        }
                        if (btn) { btn.disabled = false; btn.textContent = '登录'; }
                        // 登录成功后跳到 step 2（主题），跳过已完成的语言步骤
                        setTimeout(() => this._setStep(2), 600);
                    })
                    .catch((err) => {
                        if (msg) { msg.textContent = '登录失败: ' + (err.message || '未知错误'); msg.className = 'oobe-auth-message error'; }
                        if (btn) { btn.disabled = false; btn.textContent = '登录'; }
                    });
            });
        }

        /* Signup form */
        const signupForm = document.getElementById('oobe-signup-form');
        if (signupForm && this.supabase) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = (document.getElementById('oobe-signup-email')?.value || '').trim();
                const password = document.getElementById('oobe-signup-password')?.value || '';
                if (!email || !password) return;
                if (password.length < 6) {
                    const msg = document.getElementById('oobe-auth-message');
                    if (msg) { msg.textContent = '密码至少需要6位'; msg.className = 'oobe-auth-message error'; }
                    return;
                }
                const btn = signupForm.querySelector('.oobe-next-button');
                const msg = document.getElementById('oobe-auth-message');
                if (msg) { msg.textContent = ''; msg.className = 'oobe-auth-message'; }

                // 注册时把 display_name 一起传入 Supabase
                const displayName = String(this.selectedUserName || '').trim();

                // 保留名称检查（KevinAnanda 是允许的 owner 账号，不在此列）
                const RESERVED_NAMES = [
                    'Tim Cook', 'Apple', 'Microsoft', 'NyouOS',
                    'Administrator', 'admin', 'root', 'System', '系统',
                    'Steve Jobs', 'Bill Gates', 'Google', 'Android'
                ];
                if (RESERVED_NAMES.some(n => displayName.toLowerCase() === n.toLowerCase())) {
                    if (msg) { msg.textContent = '该名称为系统保留名称，无法使用。'; msg.className = 'oobe-auth-message error'; }
                    return;
                }

                // 通过 Supabase 检查名称唯一性
                if (btn) { btn.disabled = true; btn.textContent = '检查名称...'; }
                try {
                    // KevinAnanda 是 owner 专属账号，检查占位记录后允许通过
                    if (displayName === 'KevinAnanda') {
                        const { data: reserved } = await this.supabase
                            .from('profiles')
                            .select('id, email')
                            .eq('display_name', displayName)
                            .limit(1);
                        if (reserved && reserved.length > 0 && reserved[0].email !== 'reserved@nyouos.com') {
                            if (msg) { msg.textContent = '该名称已被使用，请更换。'; msg.className = 'oobe-auth-message error'; }
                            if (btn) { btn.disabled = false; btn.textContent = '注册'; }
                            return;
                        }
                    } else {
                        const { data: existing } = await this.supabase
                            .from('profiles')
                            .select('id')
                            .eq('display_name', displayName)
                            .limit(1);
                        if (existing && existing.length > 0) {
                            if (msg) { msg.textContent = '该名称已被使用，请更换。'; msg.className = 'oobe-auth-message error'; }
                            if (btn) { btn.disabled = false; btn.textContent = '注册'; }
                            return;
                        }
                    }
                } catch (err) {
                    console.warn('[OOBE] profiles 表查询失败，跳过唯一性检查:', err);
                }

                if (btn) { btn.disabled = true; btn.textContent = '注册中...'; }
                this.supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            display_name: displayName || undefined
                        }
                    }
                })
                    .then((result) => {
                        if (result.error) {
                            if (msg) { msg.textContent = '注册失败: ' + result.error.message; msg.className = 'oobe-auth-message error'; }
                            if (btn) { btn.disabled = false; btn.textContent = '注册'; }
                            return;
                        }
                        if (result.data && result.data.session) {
                            if (msg) { msg.textContent = '注册成功！已自动登录。'; msg.className = 'oobe-auth-message success'; }
                            this.isAuthenticated = true;
                            // 从 Supabase 用户信息中自动填充用户名和邮箱
                            const user = result.data.user;
                            let signupEmail = '';
                            if (user) {
                                signupEmail = user.email || '';
                                if (signupEmail && !this.selectedUserEmail) this.selectedUserEmail = signupEmail;
                                // 优先使用 Supabase 返回的 display_name
                                const metaName = user.user_metadata?.display_name
                                    || user.user_metadata?.user_name
                                    || user.user_metadata?.full_name;
                                if (metaName && String(metaName).trim()) {
                                    this.selectedUserName = String(metaName).trim();
                                } else if (!this.selectedUserName) {
                                    const atIndex = signupEmail.indexOf('@');
                                    this.selectedUserName = atIndex > 0 ? signupEmail.substring(0, atIndex) : signupEmail;
                                }
                            }
                            if (State && typeof State.updateSession === 'function') {
                                State.updateSession({ isLoggedIn: true, userEmail: signupEmail });
                            }
                            // 检测 root 权限
                            if (State && typeof State.checkRootPermission === 'function') {
                                State.checkRootPermission(this.selectedUserName);
                            }
                            // 注册成功后写入 profiles 表（用于名称唯一性检查）
                            if (user) {
                                try {
                                    // 如果是 KevinAnanda，先删除占位记录
                                    if (this.selectedUserName === 'KevinAnanda') {
                                        this.supabase.from('profiles').delete().eq('display_name', 'KevinAnanda');
                                    }
                                    this.supabase.from('profiles').upsert({
                                        id: user.id,
                                        display_name: this.selectedUserName,
                                        email: signupEmail
                                    }).then(() => {}).catch(() => {});
                                } catch (e) {}
                            }
                            // 从 localStorage 读取头像选择
                            const authAvatar2 = this._getAuthAvatar();
                            if (authAvatar2 && !this.selectedUserAvatar) {
                                this.selectedUserAvatar = authAvatar2;
                            }
                            if (btn) { btn.disabled = false; btn.textContent = '注册'; }
                            // 注册成功后跳到 step 2（主题），跳过已完成的语言步骤
                            setTimeout(() => this._setStep(2), 600);
                        } else {
                            // 需要邮箱验证的场景
                            if (msg) {
                                msg.innerHTML = '<strong>注册成功！</strong><br>我们已发送一个确认账户邮件到您的邮箱（' + email + '）中，请注意查收并点击邮件中的确认链接完成验证。验证完成后即可登录。';
                                msg.className = 'oobe-auth-message success';
                            }
                            if (btn) { btn.disabled = false; btn.textContent = '注册'; }
                            const loginTab = this.element.querySelector('.oobe-auth-tab[data-auth-tab="login"]');
                            if (loginTab) loginTab.click();
                        }
                    })
                    .catch((err) => {
                        if (msg) { msg.textContent = '注册失败: ' + (err.message || '未知错误'); msg.className = 'oobe-auth-message error'; }
                        if (btn) { btn.disabled = false; btn.textContent = '注册'; }
                    });
            });
        }

        const next1 = document.getElementById('oobe-next-1');
        const back1 = document.getElementById('oobe-back-1');
        const next2 = document.getElementById('oobe-next-2');
        const next3 = document.getElementById('oobe-next-3');
        const next4 = document.getElementById('oobe-next-4');
        const next5 = document.getElementById('oobe-next-5');
        const next6 = document.getElementById('oobe-next-6');
        const next7 = document.getElementById('oobe-next-7');
        const back2 = document.getElementById('oobe-back-2');
        const back3 = document.getElementById('oobe-back-3');
        const back4 = document.getElementById('oobe-back-4');
        const back5 = document.getElementById('oobe-back-5');
        const back6 = document.getElementById('oobe-back-6');
        const back7 = document.getElementById('oobe-back-7');
        const back8 = document.getElementById('oobe-back-8');
        const backAuth = document.getElementById('oobe-back-auth');
        const finish = document.getElementById('oobe-finish');
        const enterDesktop = document.getElementById('oobe-enter-desktop');

        if (next1) {
            next1.addEventListener('click', () => {
                if (!this.selectedLang) return;
                this._setStep('country');
            });
        }
        if (back1) back1.addEventListener('click', () => { this._setStep(0); this._startWelcomeAnimation(); });

        // Country step navigation
        const nextCountry = document.getElementById('oobe-next-country');
        const backCountry = document.getElementById('oobe-back-country');
        if (nextCountry) {
            nextCountry.addEventListener('click', () => {
                if (!this.selectedCountry) return;
                if (this.isAuthenticated) {
                    this._setStep(2);
                } else {
                    this._setStep('auth');
                }
            });
        }
        if (backCountry) backCountry.addEventListener('click', () => { this._setStep(1); });

        if (backAuth) backAuth.addEventListener('click', () => this._setStep('country'));
        if (next2) next2.addEventListener('click', () => this._setStep(3));
        if (next3) next3.addEventListener('click', () => this._setStep(4));
        if (next4) next4.addEventListener('click', () => this._setStep(5));
        if (next5) next5.addEventListener('click', () => this._setStep(6));
        if (next6) next6.addEventListener('click', () => {
            this._setStep(7);
        });
        if (back2) back2.addEventListener('click', () => this._setStep('auth'));
        if (back3) back3.addEventListener('click', () => this._setStep(2));
        if (back4) back4.addEventListener('click', () => this._setStep(3));
        if (back5) back5.addEventListener('click', () => this._setStep(4));
        if (back6) back6.addEventListener('click', () => this._setStep(5));
        if (back7) back7.addEventListener('click', () => this._setStep(6));
        if (finish) finish.addEventListener('click', () => this.completeAndEnterDesktop());
        if (enterDesktop) enterDesktop.addEventListener('click', () => this.enterDesktopFromCompletion());

        if (this.authUsernameInputEl) {
            this.authUsernameInputEl.addEventListener('input', () => {
                this.selectedUserName = String(this.authUsernameInputEl.value || '');
                this._syncLockPreviewProfile();
                if (this.supabase && this.isAuthenticated && this.selectedUserName) {
                    try {
                        this.supabase.auth.updateUser({
                            data: { user_name: this.selectedUserName }
                        }).catch(() => {});
                    } catch (e) {}
                }
            });
        }

        const deviceNameInput = document.getElementById('oobe-device-name-input');
        if (deviceNameInput) {
            deviceNameInput.value = this.deviceName;
            deviceNameInput.addEventListener('input', () => {
                this.deviceName = String(deviceNameInput.value || '').trim() || 'NyouOS-PC';
                const statusEl = document.getElementById('oobe-device-name-status');
                if (statusEl) statusEl.textContent = '';
            });
        }

        if (this.SurfInputEl) {
            this.SurfInputEl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                const text = String(this.SurfInputEl.value || '').trim();
                if (!text) return;
                this.SurfInputEl.value = '';
                this._enterTempSurfConversation();
                this._appendTempSurfMessage(text, 'user');
                this._buildTempSurfReply(text).then(reply => {
                    this._appendTempSurfMessage(reply, 'bot');
                });
            });
        }
    },

    _proceedFromWelcome() {
        // 直接进入语言选择步骤
        this._setStep(1);
    },

    _getAuthAvatar() {
        try {
            const saved = localStorage.getItem('nyouos_oobe_avatar');
            if (saved) return saved;
        } catch (e) {}
        return 'Theme/Profile_img/UserAva.jpg';
    },

    _setAuthAvatar(avatarPath) {
        try {
            localStorage.setItem('nyouos_oobe_avatar', avatarPath);
        } catch (e) {}
        this.selectedUserAvatar = avatarPath;
        const previewImg = document.getElementById('oobe-auth-avatar-img');
        if (previewImg) previewImg.src = avatarPath;
        const grid = document.getElementById('oobe-auth-avatar-grid');
        if (grid) {
            grid.querySelectorAll('.oobe-auth-avatar-item').forEach((btn) => {
                btn.classList.toggle('selected', btn.dataset.avatar === avatarPath);
            });
        }
        this._syncLockPreviewProfile();
    },

    _initAuthAvatars() {
        const grid = document.getElementById('oobe-auth-avatar-grid');
        const previewImg = document.getElementById('oobe-auth-avatar-img');
        if (!grid) return;
        if (grid.children.length > 0) return;

        const avatars = [
            'Theme/Profile_img/UserAva.jpg',
            ...Array.from({ length: 10 }, (_, i) => `Theme/Profile_img/${i + 1}.jpg`)
        ];
        const currentAvatar = this._getAuthAvatar();

        avatars.forEach((avatarPath) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `oobe-auth-avatar-item ${avatarPath === currentAvatar ? 'selected' : ''}`;
            btn.dataset.avatar = avatarPath;
            btn.innerHTML = `<img src="${avatarPath}" alt="avatar" loading="lazy" decoding="async">`;
            btn.addEventListener('click', () => {
                this._setAuthAvatar(avatarPath);
            });
            grid.appendChild(btn);
        });

        if (previewImg) previewImg.src = currentAvatar;
    },

    _initCountryStep() {
        const container = document.getElementById('oobe-country-groups');
        const searchInput = document.getElementById('oobe-country-search');
        const nextBtn = document.getElementById('oobe-next-country');
        if (!container) return;

        const lang = this.selectedLang === 'zh' ? 'zh' : 'en';
        const grouped = Countries.getGroupedList(lang);
        const useZh = this.selectedLang === 'zh';

        const renderList = (filter = '') => {
            container.innerHTML = '';
            const query = filter.trim().toLowerCase();

            Object.keys(grouped).forEach(regionKey => {
                const region = grouped[regionKey];
                const filtered = query
                    ? region.countries.filter(c =>
                        (useZh ? c.nameZh : c.nameEn).toLowerCase().includes(query) ||
                        c.code.toLowerCase().includes(query)
                    )
                    : region.countries;

                if (filtered.length === 0) return;

                const group = document.createElement('div');
                group.className = 'oobe-country-group';

                const title = document.createElement('div');
                title.className = 'oobe-country-group-title';
                title.textContent = region.name;
                group.appendChild(title);

                const list = document.createElement('div');
                list.className = 'oobe-country-list';

                filtered.forEach(country => {
                    const item = document.createElement('button');
                    item.className = 'oobe-country-item';
                    item.type = 'button';
                    item.dataset.code = country.code;

                    if (this.selectedCountry === country.code) {
                        item.classList.add('selected');
                    }

                    item.innerHTML = `
                        <span class="oobe-country-flag">${country.flag}</span>
                        <span class="oobe-country-name">${useZh ? country.nameZh : country.nameEn}</span>
                        <img class="oobe-country-check" src="Theme/Icon/Symbol_icon/stroke/Check.svg" alt="">
                    `;

                    item.addEventListener('click', () => {
                        this.selectedCountry = country.code;
                        this._updateCountrySelectionUI();
                        this._updateCountryNextButton();
                    });

                    list.appendChild(item);
                });

                group.appendChild(list);
                container.appendChild(group);
            });
        };

        this._updateCountrySelectionUI = () => {
            const items = container.querySelectorAll('.oobe-country-item');
            items.forEach(item => {
                item.classList.toggle('selected', item.dataset.code === this.selectedCountry);
            });
        };

        this._updateCountryNextButton = () => {
            if (!nextBtn) return;
            if (this.selectedCountry) {
                nextBtn.classList.remove('is-disabled');
                nextBtn.disabled = false;
            } else {
                nextBtn.classList.add('is-disabled');
                nextBtn.disabled = true;
            }
        };

        renderList(searchInput ? searchInput.value : '');
        this._updateCountryNextButton();

        if (searchInput && !searchInput._countryBound) {
            searchInput._countryBound = true;
            searchInput.addEventListener('input', () => {
                renderList(searchInput.value);
            });
        }
    },

    _initAuthStep() {
        const loginForm = document.getElementById('oobe-login-form');
        const signupForm = document.getElementById('oobe-signup-form');
        const msg = document.getElementById('oobe-auth-message');
        if (loginForm) loginForm.style.display = 'flex';
        if (signupForm) signupForm.style.display = 'none';
        if (msg) { msg.textContent = ''; msg.className = 'oobe-auth-message'; }
        const tabs = this.element.querySelectorAll('.oobe-auth-tab');
        tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-auth-tab') === 'login'));

        // 默认登录 tab 时隐藏"名称"输入框（从 Supabase 读取）
        const usernameBlock = this.authUsernameInputEl?.closest('.oobe-setting-block');
        if (usernameBlock) {
            usernameBlock.style.display = 'none';
        }

        this._initAuthAvatars();
    },

    _initPrivacyToggles() {
        if (this._privacyTogglesInitialized) return;
        const diag = document.getElementById('oobe-privacy-diagnostics-toggle');
        const tailored = document.getElementById('oobe-privacy-tailored-toggle');
        const ads = document.getElementById('oobe-privacy-ads-toggle');
        if (diag && window.FluentUI) {
            diag.innerHTML = '';
            diag.appendChild(FluentUI.Toggle({
                checked: this.privacyDiagnostics !== false,
                onChange: (v) => { this.privacyDiagnostics = v === true; }
            }));
        }
        if (tailored && window.FluentUI) {
            tailored.innerHTML = '';
            tailored.appendChild(FluentUI.Toggle({
                checked: this.privacyTailored !== false,
                onChange: (v) => { this.privacyTailored = v === true; }
            }));
        }
        if (ads && window.FluentUI) {
            ads.innerHTML = '';
            ads.appendChild(FluentUI.Toggle({
                checked: this.privacyAds === true,
                onChange: (v) => { this.privacyAds = v === true; }
            }));
        }
        this._privacyTogglesInitialized = true;
    },

    _setStep(step, immediate = false) {
        // 允许：0（欢迎）、1（语言选择）、'country'（国家地区）、'auth'（登录/注册）
        // 2-7（主题、颜色、Surf、隐私、设备名、PIN）需登录后才能访问
        if (step !== 0 && step !== 1 && step !== 'country' && step !== 'auth'
            && step !== 2 && step !== 3 && step !== 4 && step !== 5 && step !== 6 && step !== 7
            && !this.isAuthenticated) {
            this._setStep('auth');
            return;
        }

        this.currentStep = step;
        this.steps.forEach((section) => {
            const sectionStep = section.dataset.step;
            section.classList.toggle('active', sectionStep == step);
            if (immediate) {
                section.style.transition = 'none';
                requestAnimationFrame(() => {
                    section.style.transition = '';
                });
            }
        });

        if (step === 'country') {
            this._initCountryStep();
            return;
        }

        if (step === 'auth') {
            this._initAuthStep();
            return;
        }

        if (step === 4) {
            if (this.SurfInputEl) {
                setTimeout(() => this.SurfInputEl.focus(), 120);
            }
            this._renderSurfSettingsPanel();
            if (this.SurfSettingsScrollArea && typeof this.SurfSettingsScrollArea.refresh === 'function') {
                requestAnimationFrame(() => this.SurfSettingsScrollArea.refresh());
            }
        }

        if (step === 5) {
            this._initPrivacyToggles();
        }

        if (step === 7) {
            const pinInput = document.getElementById('oobe-pin-input');
            if (pinInput) {
                setTimeout(() => pinInput.focus(), 120);
            }
        }

        if (step === 2 || step === 3) {
            this._initSystemPreviews();
            this._syncDesktopPreviewState();
        }
    },

    _resetFlow() {
        this._resetCompletionScene();
        this.finishing = false;
        this.selectedLang = this._detectBrowserLanguage();
        this.selectedCountry = State?.settings?.countryRegion || null;
        this.selectedTheme = State?.settings?.theme === 'dark' ? 'dark' : 'light';
        this.selectedWallpaper = State?.settings?.wallpaperDesktop || 'Theme/Picture/Fluent-2.png';
        this.selectedWindowBlur = State?.settings?.enableWindowBlur === true;
        this.selectedAccentColor = State?.normalizeAccentColor
            ? State.normalizeAccentColor(State?.settings?.accentColor)
            : (State?.settings?.accentColor || '#0078d4');
        this.selectedAutoFullscreen = State?.settings?.autoEnterFullscreen !== false;
        this.selectedSurfMode = State?.settings?.SurfCustomMode ? 'custom' : 'local';
        this.privacyDiagnostics = State?.settings?.privacyDiagnostics !== false;
        this.privacyTailored = State?.settings?.privacyTailored !== false;
        this.privacyAds = State?.settings?.privacyAds === true;
        this.deviceName = State?.settings?.deviceName || 'NyouOS-PC';
        this._privacyTogglesInitialized = false;
        const draft = this._getInitialUserProfileDraft();
        this.selectedUserName = draft.name;
        this.selectedUserEmail = draft.email;
        this.selectedUserAvatar = draft.avatar;
        this.SurfModeAnimating = false;
        this.pendingSurfCustomEnter = false;

        const pinInput = document.getElementById('oobe-pin-input');
        if (pinInput) pinInput.value = '';

        const languageButtons = Array.from(this.element.querySelectorAll('.oobe-option-btn[data-lang]'));
        languageButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === this.selectedLang));

        this._initThemeControls();
        this._syncWallpaperSelection();
        this._syncAccentSelection();
        this._renderSurfSettingsPanel();
        this._syncUserProfileDraftToInputs();
        this._renderUserAvatarGrid();
        this._syncUserStepState();
        this._syncDesktopPreviewState();

        this._syncNextStep1State();
        this._resetTempSurfChat();
        this._updatePreloadStatusText();
    },

    _setChipGroupActive(selector, predicate) {
        const buttons = Array.from(this.element.querySelectorAll(selector));
        buttons.forEach((btn) => {
            btn.classList.toggle('active', predicate(btn));
        });
    },

    _syncNextStep1State() {
        const next = document.getElementById('oobe-next-1');
        if (!next) return;
        const enabled = Boolean(this.selectedLang);
        next.disabled = !enabled;
        next.classList.toggle('is-disabled', !enabled);
    },

    _syncBackgroundWithLockWallpaper() {
        const lockWallpaper = typeof State?.getResolvedWallpaper === 'function'
            ? State.getResolvedWallpaper('lock')
            : (State?.settings?.wallpaperLock || 'Theme/Picture/Fluent-1.png');
        const previewWallpaper = typeof BootScreen !== 'undefined' && typeof BootScreen.getOobeWallpaperPreview === 'function'
            ? BootScreen.getOobeWallpaperPreview(lockWallpaper)
            : lockWallpaper;

        if (this.backgroundElement) {
            this.backgroundElement.style.backgroundImage = `url('${previewWallpaper}')`;
        }
    },

    _syncDesktopPreviewState() {
        const isDark = this.selectedTheme === 'dark';
        this.element.classList.toggle('dark-mode', isDark);
        this.element.classList.toggle('oobe-theme-light', !isDark);
        document.body.classList.toggle('oobe-dark-dialog-mode', isDark && !this.element.classList.contains('hidden'));
        const accent = String(this.selectedAccentColor || '#0078d4');
        const selectedWallpaperPreview = typeof WallpaperStore !== 'undefined' && WallpaperStore.isReference(this.selectedWallpaper)
            ? State.getResolvedWallpaper('desktop')
            : this.selectedWallpaper;
        const previewWallpaper = typeof BootScreen !== 'undefined' && typeof BootScreen.getOobeWallpaperPreview === 'function'
            ? BootScreen.getOobeWallpaperPreview(selectedWallpaperPreview)
            : selectedWallpaperPreview;
        const rgb = State && typeof State.hexToRgb === 'function'
            ? State.hexToRgb(accent)
            : { r: 0, g: 120, b: 212 };
        this.element.style.setProperty('--accent', accent);
        this.element.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

        this.systemPreviewFrames.forEach(({ host, wallpaperEl, windowEl }) => {
            host.classList.toggle('is-dark', isDark);
            host.classList.toggle('window-blur-on', this.selectedWindowBlur);
            host.classList.toggle('window-blur-off', !this.selectedWindowBlur);
            host.style.setProperty('--oobe-preview-accent', accent);
            if (wallpaperEl) wallpaperEl.style.backgroundImage = `url('${previewWallpaper}')`;
            if (windowEl) windowEl.setAttribute('data-material', this.selectedWindowBlur ? 'glass' : 'solid');
        });

        const SurfPreview = this.element.querySelector('.oobe-live-Surf');
        if (SurfPreview) {
            SurfPreview.style.setProperty('--oobe-preview-bg', `url('${previewWallpaper}')`);
            SurfPreview.querySelector('.oobe-live-wallpaper')?.style.setProperty('background-image', `url('${previewWallpaper}')`);
        }
    },

    _tickPreviewClock() {
        // Kept for compatibility with older integrations; previews no longer show a clock.
    },

    _startPreviewClockTimer() {
        this._stopPreviewClockTimer();
        this.clockTimer = setInterval(() => this._tickPreviewClock(), 1000 * 30);
    },

    _stopPreviewClockTimer() {
        if (!this.clockTimer) return;
        clearInterval(this.clockTimer);
        this.clockTimer = null;
    },

    _startPreloadInBackground() {
        if (this.preloadingPromise) {
            this._updatePreloadStatusText();
            return;
        }

        this.preloadingPromise = (async () => {
            try {
                if (State && typeof State.ensureFSIntegrity === 'function') {
                    State.ensureFSIntegrity();
                }
                if (BootScreen && typeof BootScreen._preloadOobeDeferredResources === 'function') {
                    await BootScreen._preloadOobeDeferredResources();
                } else if (BootScreen && typeof BootScreen._preloadResourcePackByPriority === 'function') {
                    await BootScreen._preloadResourcePackByPriority();
                }
                if (BootScreen && BootScreen.CACHE_KEY) {
                    localStorage.setItem(BootScreen.CACHE_KEY, Date.now().toString());
                }
                this.preloadCompleted = true;
            } catch (_) {
                this.preloadFailed = true;
            } finally {
                this._updatePreloadStatusText();
            }
        })();

        this._updatePreloadStatusText();
    },

    _updatePreloadStatusText() {
        const el = document.getElementById('oobe-preload-status');
        if (!el) return;
        const d = this._dict();
        if (this.preloadCompleted) {
            el.textContent = d.preloadDone;
        } else if (this.preloadFailed) {
            el.textContent = d.preloadFail;
        } else {
            el.textContent = d.preloadRunning;
        }
    },

    _SurfText(key, fallbackZh = '', fallbackEn = '') {
        const lang = this._langCode() === 'en' ? 'en' : 'zh';
        const localized = I18n?.translations?.[lang]?.[key];
        if (typeof localized === 'string' && localized.trim()) return localized;
        if (typeof t === 'function') {
            const val = t(key);
            if (typeof val === 'string' && val !== key && val.trim()) return val;
        }
        return lang === 'en'
            ? (fallbackEn || fallbackZh || key)
            : (fallbackZh || fallbackEn || key);
    },

    _initSurfSettingsPanel() {
        if (!this.SurfSettingsHostEl) return;
        this.SurfSettingsHostEl.innerHTML = '';

        if (typeof FluentUI !== 'undefined' && FluentUI && typeof FluentUI.ScrollArea === 'function') {
            const scrollArea = FluentUI.ScrollArea({
                className: 'oobe-Surf-settings-scroll'
            });
            this.SurfSettingsHostEl.appendChild(scrollArea);
            this.SurfSettingsScrollArea = scrollArea;
            this.SurfSettingsViewportEl = typeof scrollArea.getViewport === 'function'
                ? scrollArea.getViewport()
                : scrollArea.querySelector('.fluent-scroll-viewport');
        } else {
            this.SurfSettingsScrollArea = null;
            this.SurfSettingsViewportEl = document.createElement('div');
            this.SurfSettingsHostEl.appendChild(this.SurfSettingsViewportEl);
        }

        this._renderSurfSettingsPanel();
    },

    _createSurfSettingSection(title) {
        const section = document.createElement('div');
        section.className = 'oobe-Surf-setting-section';

        const heading = document.createElement('div');
        heading.className = 'oobe-Surf-section-title';
        heading.textContent = title;
        section.appendChild(heading);

        return section;
    },

    _renderSurfSettingsPanel() {
        if (!this.SurfSettingsViewportEl || typeof FluentUI === 'undefined' || !FluentUI) return;

        this.SurfSettingsViewportEl.innerHTML = '';
        this.SurfCustomOptionsWrapEl = null;

        const root = document.createElement('div');
        root.className = 'oobe-Surf-settings-body';
        const customEnabled = this.selectedSurfMode === 'custom';

        const modeSection = this._createSurfSettingSection(
            this._SurfText('settings.Surf-mode', 'Conversation Mode', 'Conversation Mode')
        );
        modeSection.appendChild(FluentUI.SettingItem({
            label: this._SurfText('settings.Surf-custom', 'Custom Mode', 'Custom Mode'),
            description: this._SurfText('settings.Surf-custom-desc', 'Use your own API Key for LLM conversation.', 'Use your own API Key for LLM conversation.'),
            control: FluentUI.Toggle({
                checked: customEnabled,
                onChange: (v) => this._handleOobeSurfCustomModeToggle(v)
            })
        }));

        if (customEnabled) {
            const customWrap = this._renderOobeSurfCustomOptions();
            if (customWrap) modeSection.appendChild(customWrap);
        }
        root.appendChild(modeSection);

        const aboutSection = this._createSurfSettingSection(
            this._SurfText('settings.Surf-about', 'About Surf AI', 'About Surf AI')
        );
        const aboutCard = document.createElement('div');
        aboutCard.className = 'fluent-setting-item oobe-Surf-about-note';
        const aboutInfo = document.createElement('div');
        aboutInfo.className = 'fluent-setting-item-info';
        const aboutText = document.createElement('div');
        aboutText.className = 'fluent-setting-item-desc';
        aboutText.style.fontSize = '12px';
        aboutText.style.lineHeight = '1.6';
        aboutText.textContent = this._SurfText(
            'settings.Surf-about-text',
            'Surf can work in keyword mode by default, and in custom mode with your own API Key.',
            'Surf can work in keyword mode by default, and in custom mode with your own API Key.'
        );
        aboutInfo.appendChild(aboutText);
        aboutCard.appendChild(aboutInfo);
        aboutSection.appendChild(aboutCard);
        root.appendChild(aboutSection);

        this.SurfSettingsViewportEl.appendChild(root);

        if (customEnabled && this.pendingSurfCustomEnter && this.SurfCustomOptionsWrapEl) {
            this.pendingSurfCustomEnter = false;
            requestAnimationFrame(() => {
                this.SurfCustomOptionsWrapEl?.classList.add('anim-in');
                setTimeout(() => this.SurfCustomOptionsWrapEl?.classList.remove('anim-in'), 660);
            });
        }

        if (this.SurfSettingsScrollArea && typeof this.SurfSettingsScrollArea.refresh === 'function') {
            requestAnimationFrame(() => this.SurfSettingsScrollArea.refresh());
        }
    },

    _handleOobeSurfCustomModeToggle(enableCustom) {
        if (this.SurfModeAnimating) return;
        this.tempSurfPendingAction = null;

        if (enableCustom) {
            const enableWithSecurity = (enableStrictCsp) => {
                this.selectedSurfMode = 'custom';
                if (State && typeof State.updateSettings === 'function') {
                    const currentStrict = State?.settings?.strictCspEnabled === true;
                    State.updateSettings({
                        strictCspEnabled: enableStrictCsp === true || currentStrict,
                        SurfCustomMode: true
                    });
                }
                this.pendingSurfCustomEnter = true;
                this._renderSurfSettingsPanel();
            };

            const keepDisabled = () => {
                this.selectedSurfMode = 'local';
                if (State && typeof State.updateSettings === 'function') {
                    State.updateSettings({ SurfCustomMode: false });
                }
                this._renderSurfSettingsPanel();
            };
            this._showOobeSurfCustomRiskDialog().then((accepted) => {
                if (!accepted) {
                    keepDisabled();
                    return;
                }
                this._showOobeStrictCspChoiceDialog().then((enableStrictCsp) => {
                    enableWithSecurity(enableStrictCsp);
                });
            });
            return;
        }

        const finishDisable = () => {
            this.selectedSurfMode = 'local';
            if (State && typeof State.updateSettings === 'function') {
                State.updateSettings({ SurfCustomMode: false });
            }
            this._renderSurfSettingsPanel();
            this.SurfModeAnimating = false;
        };

        this.SurfModeAnimating = true;
        if (this.SurfCustomOptionsWrapEl) {
            this.SurfCustomOptionsWrapEl.classList.remove('anim-in');
            this.SurfCustomOptionsWrapEl.classList.add('anim-out');
            setTimeout(finishDisable, 430);
        } else {
            finishDisable();
        }
    },

    _showOobeSurfCustomRiskDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(false);
                return;
            }

            let timer = null;
            const dialogRef = FluentUI.Dialog({
                type: 'warning',
                title: this._SurfText(
                    'settings.Surf-custom-risk-title',
                    '启用自定义 API 模式风险提示',
                    'Custom API Mode Risk Notice'
                ),
                content: `<div class="Surf-custom-risk-content">${this._SurfText(
                    'settings.Surf-custom-risk-content',
                    '你正在启用自定义 API 模式。该模式会把请求发送到第三方服务，可能产生费用与数据外发风险。<br><br>建议：<br>1. 为 API 设置额度上限与告警。<br>2. 优先使用临时 Key 或低权限 Key，并定期轮换。<br>3. 不要在共享设备长期保存 Key。<br><br>Fluent Studio 仅提供本地工具，不托管第三方 API 服务，不对因密钥泄露、额度超支、账号封禁或第三方服务异常导致的损失承担责任。继续即表示你已理解并自行承担相关风险。',
                    'You are enabling custom API mode. Requests will be sent to third-party services, which may cause billing and data exposure risks.<br><br>Recommendations:<br>1. Set API budget limits and alerts.<br>2. Prefer temporary or low-privilege keys and rotate them regularly.<br>3. Avoid keeping keys on shared devices.<br><br>Fluent Studio only provides local tooling and does not host third-party API services. Fluent Studio is not responsible for losses caused by key leakage, quota overrun, account restrictions, or third-party service failures. Continuing means you understand and accept these risks.'
                )}</div>`,
                closeOnOverlay: false,
                buttons: [
                    { text: this._SurfText('cancel', '取消', 'Cancel'), variant: 'secondary', value: 'cancel' },
                    { text: this._SurfText('settings.Surf-custom-risk-ack', '我已知晓', 'I Understand'), variant: 'primary', value: 'confirm' }
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
            setConfirmText(this._SurfText(
                'settings.Surf-custom-risk-ack-countdown',
                '我已知晓（{seconds}s）',
                'I Understand ({seconds}s)'
            ).replace('{seconds}', remaining));

            timer = setInterval(() => {
                remaining -= 1;
                if (remaining > 0) {
                    setConfirmText(this._SurfText(
                        'settings.Surf-custom-risk-ack-countdown',
                        '我已知晓（{seconds}s）',
                        'I Understand ({seconds}s)'
                    ).replace('{seconds}', remaining));
                    return;
                }
                clearInterval(timer);
                confirmBtn.disabled = false;
                setConfirmText(this._SurfText('settings.Surf-custom-risk-ack', '我已知晓', 'I Understand'));
            }, 1000);
        });
    },

    _showOobeStrictCspChoiceDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(false);
                return;
            }

            FluentUI.Dialog({
                type: 'warning',
                title: this._SurfText(
                    'settings.strict-csp-optin-title',
                    '开启禁用内联脚本',
                    'Enable Inline Script Blocking'
                ),
                content: `<div class="Surf-custom-risk-content">${this._SurfText(
                    'settings.strict-csp-optin-content',
                    '是否同时开启「禁用内联脚本」？开启后会启用真实 CSP，可进一步增强 API Key 安全性。',
                    'Do you want to enable "Disable Inline Scripts" too? This will enable real CSP and further improve API key security.'
                )}</div>`,
                closeOnOverlay: false,
                buttons: [
                    { text: this._SurfText('settings.strict-csp-optin-skip', '暂不开启', 'Not Now'), variant: 'secondary', value: 'skip' },
                    { text: this._SurfText('settings.strict-csp-optin-enable', '立即开启', 'Enable Now'), variant: 'primary', value: 'enable' }
                ],
                onClose: (result) => {
                    resolve(result === 'enable');
                }
            });
        });
    },

    _renderOobeSurfCustomOptions() {
        const wrap = document.createElement('div');
        wrap.className = 'oobe-Surf-custom-options';

        const providerItem = FluentUI.SettingItem({
            label: this._SurfText('settings.Surf-provider', 'API Provider', 'API Provider'),
            control: FluentUI.Select({
                options: [
                    { value: 'openai', label: 'OpenAI' },
                    {
                        value: 'siliconflow',
                        label: this._langCode() === 'zh' ? '\u7845\u57fa\u6d41\u52a8 (SiliconFlow)' : 'SiliconFlow'
                    }
                ],
                value: State?.settings?.SurfProvider || 'openai',
                onChange: (v) => {
                    if (State && typeof State.updateSettings === 'function') {
                        State.updateSettings({ SurfProvider: v });
                    }
                }
            })
        });
        providerItem.style.setProperty('--Surf-stagger-index', '0');
        wrap.appendChild(providerItem);

        const saveModeItem = FluentUI.SettingItem({
            label: this._SurfText('settings.Surf-key-save-mode', 'API Key Save Mode', 'API Key Save Mode'),
            description: this._SurfText('settings.Surf-key-save-mode-desc', 'Temporary mode clears key after closing page.', 'Temporary mode clears key after closing page.'),
            control: FluentUI.Select({
                options: [
                    { value: 'temporary', label: this._SurfText('settings.Surf-key-mode-temporary', 'Temporary', 'Temporary') },
                    { value: 'permanent', label: this._SurfText('settings.Surf-key-mode-permanent', 'Permanent', 'Permanent') }
                ],
                value: State?.settings?.SurfApiSaveMode === 'permanent' ? 'permanent' : 'temporary',
                onChange: (v) => {
                    if (State && typeof State.updateSettings === 'function') {
                        State.updateSettings({ SurfApiSaveMode: v });
                    }
                }
            })
        });
        saveModeItem.style.setProperty('--Surf-stagger-index', '1');
        wrap.appendChild(saveModeItem);

        const keyWrapper = document.createElement('div');
        keyWrapper.className = 'fluent-setting-item oobe-Surf-key-item';
        keyWrapper.style.setProperty('--Surf-stagger-index', '2');

        const keyLabel = document.createElement('div');
        keyLabel.className = 'fluent-setting-item-label';
        keyLabel.textContent = this._SurfText('settings.Surf-apikey', 'API Key', 'API Key');

        const keyRow = document.createElement('div');
        keyRow.className = 'oobe-Surf-key-row';

        const currentStorageType = (typeof Surf !== 'undefined' && typeof Surf.getApiKeyStorageType === 'function')
            ? Surf.getApiKeyStorageType()
            : (State?.settings?.SurfApiStorageType || 'none');
        const sessionKey = (typeof Surf !== 'undefined' && typeof Surf.getSessionApiKey === 'function')
            ? (Surf.getSessionApiKey() || '')
            : '';
        const encryptedLocked = currentStorageType === 'permanent-encrypted' && !sessionKey;
        const uiKeyValue = (typeof Surf !== 'undefined' && typeof Surf.getSessionApiKey === 'function')
            ? (Surf.getSessionApiKey() || '')
            : '';

        const keyInput = FluentUI.Input({
            type: 'password',
            placeholder: encryptedLocked
                ? this._SurfText('settings.Surf-key-encrypted-placeholder', 'API Key is encrypted. Decrypt before use.', 'API Key is encrypted. Decrypt before use.')
                : this._SurfText('settings.Surf-apikey-placeholder', 'Enter your API Key', 'Enter your API Key'),
            value: uiKeyValue
        });

        const saveBtn = FluentUI.Button({
            text: this._SurfText('settings.Surf-save', 'Save', 'Save'),
            variant: 'primary',
            onClick: async () => {
                const val = String(keyInput.getValue ? keyInput.getValue() : '').trim();
                if (!val) {
                    if (encryptedLocked) {
                        FluentUI.Toast({
                            title: this._SurfText('settings.Surf', 'Surf AI', 'Surf AI'),
                            message: this._SurfText('settings.Surf-key-encrypted-use-tip', 'API Key is encrypted. Decrypt it or overwrite with a new key.', 'API Key is encrypted. Decrypt it or overwrite with a new key.'),
                            type: 'info'
                        });
                        return;
                    }
                    if (typeof Surf !== 'undefined' && typeof Surf.clearApiKey === 'function') {
                        Surf.clearApiKey();
                    } else if (State && typeof State.updateSettings === 'function') {
                        State.updateSettings({ SurfApiKey: '', SurfApiEncrypted: null, SurfApiStorageType: 'none' });
                    }
                    FluentUI.Toast({
                        title: this._SurfText('settings.Surf', 'Surf AI', 'Surf AI'),
                        message: this._SurfText('settings.Surf-key-cleared', 'API Key cleared.', 'API Key cleared.'),
                        type: 'success'
                    });
                    this._renderSurfSettingsPanel();
                    return;
                }

                const saveMode = State?.settings?.SurfApiSaveMode === 'permanent' ? 'permanent' : 'temporary';
                if (saveMode === 'temporary') {
                    if (typeof Surf !== 'undefined' && typeof Surf.saveApiKeyTemporary === 'function') {
                        Surf.saveApiKeyTemporary(val);
                    } else if (State && typeof State.updateSettings === 'function') {
                        State.updateSettings({ SurfApiKey: '', SurfApiEncrypted: null, SurfApiStorageType: 'session' });
                    }
                    FluentUI.Toast({
                        title: this._SurfText('settings.Surf', 'Surf AI', 'Surf AI'),
                        message: this._SurfText('settings.Surf-temp-saved', 'API Key saved temporarily.', 'API Key saved temporarily.'),
                        type: 'success'
                    });
                    this._renderSurfSettingsPanel();
                    return;
                }

                this._handleOobeSurfPermanentSave(val);
            }
        });

        const clearBtn = FluentUI.Button({
            text: this._SurfText('settings.Surf-clear-key', 'Clear API Key', 'Clear API Key'),
            variant: 'secondary',
            onClick: () => {
                if (typeof Surf !== 'undefined' && typeof Surf.clearApiKey === 'function') {
                    Surf.clearApiKey();
                } else if (State && typeof State.updateSettings === 'function') {
                    State.updateSettings({ SurfApiKey: '', SurfApiEncrypted: null, SurfApiStorageType: 'none' });
                }
                FluentUI.Toast({
                    title: this._SurfText('settings.Surf', 'Surf AI', 'Surf AI'),
                    message: this._SurfText('settings.Surf-key-cleared', 'API Key cleared.', 'API Key cleared.'),
                    type: 'success'
                });
                this._renderSurfSettingsPanel();
            }
        });

        keyRow.appendChild(keyInput);
        keyRow.appendChild(saveBtn);
        keyRow.appendChild(clearBtn);

        const keyStatus = document.createElement('div');
        keyStatus.className = 'fluent-setting-item-desc oobe-Surf-key-status';
        keyStatus.textContent = this._getSurfApiStorageStatusText(
            (typeof Surf !== 'undefined' && typeof Surf.getApiKeyStorageType === 'function')
                ? Surf.getApiKeyStorageType()
                : (State?.settings?.SurfApiStorageType || 'none')
        );

        keyWrapper.appendChild(keyLabel);
        keyWrapper.appendChild(keyRow);
        keyWrapper.appendChild(keyStatus);
        wrap.appendChild(keyWrapper);

        this.SurfCustomOptionsWrapEl = wrap;
        return wrap;
    },

    _getSurfApiStorageStatusText(type) {
        switch (type) {
            case 'session':
                return this._SurfText('settings.Surf-key-status-session', 'Current: temporary session storage.', 'Current: temporary session storage.');
            case 'permanent-plain':
                return this._SurfText('settings.Surf-key-status-plain', 'Current: permanently stored as plain text.', 'Current: permanently stored as plain text.');
            case 'permanent-encrypted':
                return this._SurfText('settings.Surf-key-status-encrypted', 'Current: encrypted via WebCrypto.', 'Current: encrypted via WebCrypto.');
            default:
                return this._SurfText('settings.Surf-key-status-none', 'No API Key stored.', 'No API Key stored.');
        }
    },

    _promptOobeSurfEncryptPassphrase() {
        return new Promise((resolve) => {
            FluentUI.InputDialog({
                title: this._SurfText('settings.Surf-encrypt-passphrase-title', 'Set Encryption Passphrase', 'Set Encryption Passphrase'),
                placeholder: this._SurfText('settings.Surf-encrypt-passphrase-placeholder', 'At least 8 characters', 'At least 8 characters'),
                inputType: 'password',
                minLength: 8,
                validateFn: (value) => value.length >= 8 || this._SurfText('settings.Surf-encrypt-passphrase-error', 'Passphrase must be at least 8 characters.', 'Passphrase must be at least 8 characters.'),
                confirmText: this._SurfText('ok', 'OK', 'OK'),
                cancelText: this._SurfText('cancel', 'Cancel', 'Cancel'),
                onConfirm: (passphrase) => resolve(passphrase),
                onCancel: () => resolve(null)
            });
        });
    },

    _handleOobeSurfPermanentSave(apiKey) {
        FluentUI.Dialog({
            type: 'warning',
            title: this._SurfText('settings.Surf-perm-save-title', 'Save API Key Permanently', 'Save API Key Permanently'),
            content: this._SurfText('settings.Surf-perm-save-content', 'Permanent API Key storage is risky. Only WebCrypto-encrypted storage is allowed now.', 'Permanent API Key storage is risky. Only WebCrypto-encrypted storage is allowed now.'),
            buttons: [
                { text: this._SurfText('cancel', 'Cancel', 'Cancel'), variant: 'secondary', value: 'cancel' },
                { text: this._SurfText('settings.Surf-perm-save-encrypted', 'Use WebCrypto Encryption', 'Use WebCrypto Encryption'), variant: 'primary', value: 'encrypted' }
            ],
            onClose: async (result) => {
                if (result !== 'encrypted') return;

                const passphrase = await this._promptOobeSurfEncryptPassphrase();
                if (!passphrase) return;

                try {
                    if (typeof Surf !== 'undefined' && typeof Surf.saveApiKeyPermanentEncrypted === 'function') {
                        await Surf.saveApiKeyPermanentEncrypted(apiKey, passphrase);
                    } else {
                        throw new Error(this._SurfText('settings.Surf-webcrypto-unavailable', 'WebCrypto is unavailable.', 'WebCrypto is unavailable.'));
                    }
                    FluentUI.Toast({
                        title: this._SurfText('settings.Surf', 'Surf AI', 'Surf AI'),
                        message: this._SurfText('settings.Surf-perm-encrypted-saved', 'API Key saved with encryption.', 'API Key saved with encryption.'),
                        type: 'success'
                    });
                    this._renderSurfSettingsPanel();
                } catch (error) {
                    FluentUI.Toast({
                        title: this._SurfText('settings.Surf', 'Surf AI', 'Surf AI'),
                        message: error?.message || this._SurfText('settings.Surf-webcrypto-unavailable', 'WebCrypto is unavailable.', 'WebCrypto is unavailable.'),
                        type: 'error'
                    });
                }
            }
        });
    },

    async _applySelections() {
        const { fallbackName, fallbackEmail } = this._getProfileFallbacks();
        const name = String(this.selectedUserName || '').trim();
        const email = String(this.selectedUserEmail || '').trim();
        const avatar = String(this.selectedUserAvatar || '').trim()
            || this._getAuthAvatar()
            || 'Theme/Profile_img/UserAva.jpg';

        const updates = {
            theme: this.selectedTheme,
            enableWindowBlur: this.selectedWindowBlur,
            accentColor: this.selectedAccentColor,
            accentColorAuto: false,
            autoEnterFullscreen: this.selectedAutoFullscreen,
            SurfCustomMode: this.selectedSurfMode === 'custom',
            userName: name || fallbackName,
            userEmail: this._isValidEmail(email) ? email : fallbackEmail,
            userAvatar: avatar,
            privacyDiagnostics: this.privacyDiagnostics !== false,
            privacyTailored: this.privacyTailored !== false,
            privacyAds: this.privacyAds === true,
            deviceName: this.deviceName || 'NyouOS-PC',
            countryRegion: this.selectedCountry || 'CN'
        };

        const pinInput = document.getElementById('oobe-pin-input');
        const pin = pinInput ? String(pinInput.value || '').trim() : '';
        if (pin && pin.length >= 4 && pin.length <= 10) {
            updates.pin = pin;
        }

        if (State && typeof State.updateSettings === 'function') {
            State.updateSettings(updates);
            if (typeof State.setWallpaper === 'function') {
                try {
                    await State.setWallpaper('desktop', this.selectedWallpaper, {
                        sourceType: /^https?:/i.test(String(this.selectedWallpaper || '')) ? 'bing' : 'oobe'
                    });
                } catch (error) {
                    console.warn('[OOBE] Wallpaper cache failed; using the built-in default.', error);
                    await State.setWallpaper('desktop', 'Theme/Picture/Fluent-2.png', { sourceType: 'built-in' });
                }
            } else {
                State.updateSettings({ wallpaperDesktop: this.selectedWallpaper });
            }
        }

        if (this.selectedLang && I18n && typeof I18n.setLanguage === 'function') {
            I18n.setLanguage(this.selectedLang);
        }

        // 同步用户名到 Supabase
        if (this.supabase && name) {
            try {
                this.supabase.auth.updateUser({
                    data: { display_name: name }
                }).catch(() => {});
            } catch (e) {}
        }
    },

    _resetTempSurfChat() {
        if (this.SurfMessagesEl) {
            this.SurfMessagesEl.innerHTML = '';
        }
        if (this.SurfHistoryEl) {
            this.SurfHistoryEl.innerHTML = '';
        }
        if (this.SurfPreviewContentEl) {
            this.SurfPreviewContentEl.classList.remove('Surf-expanding', 'Surf-collapsing');
            this.SurfPreviewContentEl.classList.add('Surf-empty');
        }
        this.SurfInputOnlyMode = true;
        this.tempSurfPendingAction = null;
        this.oobeForceRestarting = false;
        if (this.SurfInputEl) {
            this.SurfInputEl.value = '';
            this.SurfInputEl.placeholder = this._dict().SurfInputPlaceholder;
        }
    },

    _enterTempSurfConversation() {
        if (!this.SurfPreviewContentEl || !this.SurfInputOnlyMode) return;
        this.SurfInputOnlyMode = false;
        this.SurfPreviewContentEl.classList.remove('Surf-empty');

        if (this.SurfMessagesEl && !this.SurfMessagesEl.children.length) {
            this._appendTempSurfMessage(this._dict().SurfWelcome, 'bot');
        }
    },

    _appendTempSurfMessage(text, type) {
        if (!this.SurfMessagesEl || !text) return;
        const normalizedType = type === 'user' ? 'user' : 'bot';
        let msg = null;

        if (typeof Surf !== 'undefined' && Surf && typeof Surf._createMessageElement === 'function') {
            try {
                msg = Surf._createMessageElement.call(Surf, text, normalizedType);
            } catch (_) {
                msg = null;
            }
        }

        if (!msg) {
            msg = document.createElement('div');
            msg.className = `Surf-msg Surf-msg-${normalizedType}`;
            const textEl = document.createElement('div');
            textEl.className = 'Surf-msg-text';
            textEl.textContent = String(text);
            msg.appendChild(textEl);
        }

        this.SurfMessagesEl.appendChild(msg);
        this.SurfMessagesEl.scrollTop = this.SurfMessagesEl.scrollHeight;
    },

    _collectTempSurfHistory(limit = 8) {
        if (!this.SurfMessagesEl) return [];
        const nodes = Array.from(this.SurfMessagesEl.querySelectorAll('.Surf-msg'));
        const messages = [];

        nodes.forEach((node) => {
            const textEl = node.querySelector('.Surf-msg-text');
            const content = String(textEl?.textContent || '').trim();
            if (!content) return;
            const role = node.classList.contains('Surf-msg-user') ? 'user' : 'assistant';
            messages.push({ role, content });
        });

        if (!messages.length) return [];
        return messages.slice(-Math.max(0, limit));
    },

    /** Blocked OOBE command keys — these require the full system. */
    _OOBE_BLOCKED_COMMANDS: ['openApp', 'install', 'uninstall', 'repair'],

    async _buildTempSurfReply(rawText) {
        const text = String(rawText || '').trim();
        if (!text) return this._dict().SurfFallback;

        if (this._isOobeForceRestartIntent(text)) {
            this.tempSurfPendingAction = null;
            this._triggerOobeForceRestart();
            return this._langCode() === 'zh'
                ? '已触发彩蛋：正在强制重启，系统将再次进入 OOBE。'
                : 'Easter egg triggered: forcing restart. The system will enter OOBE again.';
        }

        const pendingReply = this._handleTempSurfPending(text);
        if (typeof pendingReply === 'string' && pendingReply.trim()) {
            return pendingReply;
        }

        const useCustomApi = this.selectedSurfMode === 'custom' || State?.settings?.SurfCustomMode === true;
        if (useCustomApi && typeof Surf !== 'undefined' && Surf) {
            try {
                const apiKey = typeof Surf.getApiKeyForRequest === 'function'
                    ? await Surf.getApiKeyForRequest()
                    : null;
                if (!apiKey) {
                    return this._langCode() === 'zh'
                        ? 'API 错误，请检查 API Key 是否正确。请先在 Surf AI 设置中填写有效 Key。'
                        : 'API error, please check your API Key. Set a valid key in Surf AI settings first.';
                }

                if (typeof Surf.requestCustomApiReply === 'function') {
                    const provider = State?.settings?.SurfProvider || 'openai';
                    const history = this._collectTempSurfHistory(8);
                    if (history.length > 0) {
                        const last = history[history.length - 1];
                        if (last.role === 'user' && last.content === text) {
                            history.pop();
                        }
                    }
                    const reply = await Surf.requestCustomApiReply(text, apiKey, {
                        provider,
                        history,
                        lang: this._langCode()
                    });
                    if (typeof reply === 'string' && reply.trim()) {
                        return reply;
                    }
                }
            } catch (error) {
                const fallback = this._langCode() === 'zh'
                    ? 'API 调用失败，请检查网络和 Key 配置。'
                    : 'API request failed, please check your network and API key.';
                return error?.message ? `${fallback}\n(${error.message})` : fallback;
            }
        }

        if (typeof Surf !== 'undefined' && Surf && typeof Surf.buildPreviewReply === 'function') {
            try {
                const fallbackText = this._resolveSurfPayload(typeof SurfData !== 'undefined' ? SurfData.fallback : null)
                    || this._dict().SurfFallback;
                return Surf.buildPreviewReply(text, {
                    lang: this._langCode(),
                    blockedKeys: this._OOBE_BLOCKED_COMMANDS,
                    blockedText: this._dict().SurfOobeBlocked,
                    fallbackText,
                    onAction: (action) => this._applyPreviewActionFromCommand(action)
                });
            } catch (_) {
                // fallback to local resolver below
            }
        }

        const commands = (typeof SurfData !== 'undefined' && SurfData && SurfData.commands)
            ? SurfData.commands
            : null;
        if (!commands) return this._dict().SurfFallback;

        const lower = text.toLowerCase();
        const normalized = this._normalizeSurfText(lower);
        const compact = this._compactSurfText(normalized);

        const keys = Object.keys(commands);
        for (const key of keys) {
            const cmd = commands[key];
            if (!cmd || !Array.isArray(cmd.keywords)) continue;
            for (const kw of cmd.keywords) {
                if (!this._SurfKeywordMatched(lower, normalized, compact, kw)) continue;

                /* Block certain commands in OOBE */
                if (this._OOBE_BLOCKED_COMMANDS.includes(key)) {
                    return this._dict().SurfOobeBlocked;
                }

                this._applyPreviewActionFromCommand(cmd.action);
                let reply = this._resolveSurfPayload(cmd.response);

                if ((!reply || !reply.trim()) && key === 'openApp') {
                    reply = this._resolveSurfPayload(cmd.responseNotFound) || this._dict().SurfFallback;
                }

                if (reply && reply.includes('{app}')) {
                    const appName = this._extractSurfAppName(text, cmd.keywords);
                    reply = reply.replace(/\{app\}/g, appName || 'App');
                }

                return reply || this._dict().SurfFallback;
            }
        }

        /* Try real Surf AI if available and API key is set */
        if (typeof Surf !== 'undefined' && Surf && typeof Surf.processInput === 'function') {
            try {
                const hasKey = Surf.getSessionApiKey && Surf.getSessionApiKey();
                if (hasKey) {
                    const result = await Surf.processInput(text);
                    if (result && typeof result === 'string' && result.trim()) {
                        return result;
                    }
                }
            } catch (_) { /* fall through */ }
        }

        return this._resolveSurfPayload(typeof SurfData !== 'undefined' ? SurfData.fallback : null) || this._dict().SurfFallback;
    },

    _matchTempConfirmIntent(text) {
        const lower = String(text || '').toLowerCase();
        const yesWords = Array.isArray(SurfData?.confirmYes) ? SurfData.confirmYes : ['是', 'yes', 'ok', 'confirm'];
        const noWords = Array.isArray(SurfData?.confirmNo) ? SurfData.confirmNo : ['否', '不', 'no', 'cancel'];
        const isYes = yesWords.some((w) => lower.includes(String(w || '').toLowerCase()));
        const isNo = noWords.some((w) => lower.includes(String(w || '').toLowerCase()));
        return { isYes, isNo };
    },

    _handleTempSurfPending(text) {
        const pa = this.tempSurfPendingAction;
        if (!pa || !pa.type) return null;

        const { isYes, isNo } = this._matchTempConfirmIntent(text);
        if (!isYes && !isNo) {
            if (pa.type === 'offerQuickStart') {
                // Greeting suggestion is optional; continue with normal intent parsing.
                this.tempSurfPendingAction = null;
                return null;
            }
            return this._langCode() === 'zh' ? '请回答「是」或「否」。' : 'Please answer "yes" or "no".';
        }

        this.tempSurfPendingAction = null;

        if (isNo) {
            return this._langCode() === 'zh'
                ? '好的，已取消操作。'
                : 'OK, operation cancelled.';
        }

        if (pa.type === 'offerQuickStart') {
            return this._langCode() === 'zh'
                ? '太好了，给你一份超快上手指南：\n1. 按 Alt 打开开始菜单\n2. 按 Alt+I 打开设置\n3. 按 Alt+W 打开任务视图\n4. 想固定应用到任务栏：在开始菜单中右键应用，选「固定到任务栏」\n\n你也可以直接问我：「怎么分屏」「怎么切换语言」「怎么安装应用」。'
                : 'Great. Here is a quick-start guide:\n1. Press Alt to open Start Menu\n2. Press Alt+I to open Settings\n3. Press Alt+W to open Task View\n4. To pin an app: right-click it in Start Menu, then choose "Pin to taskbar"\n\nYou can also ask me directly: "how to snap windows", "how to change language", or "how to install apps".';
        }

        if (pa.type === 'disableAutoFullscreen') {
            this.selectedAutoFullscreen = false;
            this._initThemeControls();
            return this._langCode() === 'zh'
                ? '已关闭开机自动网页全屏。'
                : 'Auto web fullscreen on boot is now disabled.';
        }

        return null;
    },

    _isOobeForceRestartIntent(text) {
        const lower = String(text || '').toLowerCase();
        const normalized = this._normalizeSurfText(lower);
        const compact = this._compactSurfText(normalized);
        const keywords = [
            '强制退出/关闭oobe',
            '强制退出或关闭oobe',
            '强制退出oobe',
            '强制关闭oobe',
            '关闭oobe',
            '退出oobe',
            '强制退出引导',
            '强制关闭引导',
            '关闭新手引导',
            '退出新手引导',
            'force exit oobe',
            'force close oobe',
            'force quit oobe',
            'close oobe',
            'exit oobe',
            'quit oobe',
            'restart oobe'
        ];

        return keywords.some((kw) => this._SurfKeywordMatched(lower, normalized, compact, kw));
    },

    _triggerOobeForceRestart() {
        if (this.oobeForceRestarting) return;
        this.oobeForceRestarting = true;
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (_) {
            // ignore storage errors
        }

        setTimeout(() => {
            if (State && typeof State.restart === 'function') {
                State.restart();
            } else {
                window.location.reload();
            }
        }, 320);
    },

    _applyPreviewActionFromCommand(action) {
        if (typeof action !== 'string') return;

        if (action === 'offerQuickStart') {
            this.tempSurfPendingAction = { type: 'offerQuickStart' };
            return;
        }

        if (action === 'setTheme:dark') {
            this.selectedTheme = 'dark';
            this._initThemeControls();
            this._syncDesktopPreviewState();
            return;
        }

        if (action === 'setTheme:light') {
            this.selectedTheme = 'light';
            this._initThemeControls();
            this._syncDesktopPreviewState();
            return;
        }

        if (action === 'setTheme:auto') {
            const hour = new Date().getHours();
            this.selectedTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
            this._initThemeControls();
            this._syncDesktopPreviewState();
            return;
        }

        if (action === 'confirmAutoFullscreen:disable') {
            this.tempSurfPendingAction = { type: 'disableAutoFullscreen' };
            return;
        }

        if (action === 'setAutoFullscreen:false') {
            this.selectedAutoFullscreen = false;
            this._initThemeControls();
            return;
        }

        if (action === 'setAutoFullscreen:true') {
            this.selectedAutoFullscreen = true;
            this._initThemeControls();
            return;
        }

        if (action === 'openSettings:time-language') {
            this._setStep(1);
            return;
        }

        if (action === 'openSettings:Surf') {
            this._setStep(4);
            return;
        }

        if (action === 'openSettings:privacy') {
            this._setStep(5);
        }
    },

    _resolveSurfPayload(payload) {
        if (!payload) return '';

        if (typeof Surf !== 'undefined' && Surf && typeof Surf._resolveResponse === 'function') {
            try {
                const text = Surf._resolveResponse.call(Surf, payload);
                if (typeof text === 'string' && text.trim()) {
                    return text;
                }
            } catch (_) {
                // fallback to local resolver
            }
        }

        const lang = this._langCode();
        if (typeof payload === 'string') return payload;
        if (Array.isArray(payload)) {
            if (!payload.length) return '';
            return payload[Math.floor(Math.random() * payload.length)] || '';
        }
        if (typeof payload === 'object') {
            const localized = payload[lang] ?? payload.zh ?? payload.en ?? '';
            if (Array.isArray(localized)) {
                if (!localized.length) return '';
                return localized[Math.floor(Math.random() * localized.length)] || '';
            }
            if (typeof localized === 'string') return localized;
        }
        return '';
    },

    _extractSurfAppName(text, keywords) {
        let content = String(text || '');
        const sortedKeywords = Array.isArray(keywords)
            ? [...keywords].sort((a, b) => String(b).length - String(a).length)
            : [];

        for (const kw of sortedKeywords) {
            const idx = content.toLowerCase().indexOf(String(kw).toLowerCase());
            if (idx >= 0) {
                content = `${content.slice(0, idx)} ${content.slice(idx + String(kw).length)}`;
                break;
            }
        }

        const app = content.replace(/[.,!?，。！？]/g, ' ').trim();
        return app || (this._langCode() === 'zh' ? '应用' : 'app');
    },

    _normalizeSurfText(text) {
        if (typeof Surf !== 'undefined' && Surf && typeof Surf._normalizeInputText === 'function') {
            try {
                return Surf._normalizeInputText.call(Surf, text);
            } catch (_) {
                return text;
            }
        }
        return text;
    },

    _compactSurfText(text) {
        const punctRegex = /[\s.,!?，。！？:;；：“”"'`~()\[\]{}<>《》、/\\|_-]+/g;
        if (typeof Surf !== 'undefined' && Surf && typeof Surf._compactText === 'function') {
            try {
                return Surf._compactText.call(Surf, text);
            } catch (_) {
                return String(text || '').replace(punctRegex, '');
            }
        }
        return String(text || '').replace(punctRegex, '');
    },

    _SurfKeywordMatched(lower, normalized, compact, keyword) {
        if (typeof Surf !== 'undefined' && Surf && typeof Surf._keywordMatched === 'function') {
            try {
                return Surf._keywordMatched.call(Surf, lower, normalized, compact, keyword);
            } catch (_) {
                // fallback below
            }
        }
        const kw = String(keyword || '').toLowerCase().trim();
        if (!kw) return false;
        const compactKw = kw.replace(/[\s.,!?，。！？:;；：“”"'`~()\[\]{}<>《》、/\\|_-]+/g, '');
        return lower.includes(kw) || normalized.includes(kw) || compact.includes(compactKw);
    },

    _refreshTexts() {
        if (!this.element) return;
        const d = this._dict();

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setText('oobe-title-language', d.languageTitle);
        setText('oobe-subtitle-language', d.languageSubtitle);
        setText('oobe-title-theme', d.themePageTitle);
        setText('oobe-subtitle-theme', d.themePageSubtitle);
        setText('oobe-theme-title', d.themeTitle);
        setText('oobe-wallpaper-title', d.wallpaperTitle);
        setText('oobe-window-blur-title', d.windowBlurTitle);
        setText('oobe-window-blur-desc', d.windowBlurDesc);
        setText('oobe-auto-fullscreen-title', d.autoFullscreenTitle);
        setText('oobe-auto-fullscreen-desc', d.autoFullscreenDesc);
        setText('oobe-title-accent', d.accentPageTitle);
        setText('oobe-subtitle-accent', d.accentPageSubtitle);
        setText('oobe-accent-current-title', d.accentCurrentTitle);
        setText('oobe-custom-color-title', d.customColorTitle);
        setText('oobe-custom-color-desc', d.customColorDesc);
        setText('oobe-title-Surf', d.SurfPageTitle);
        setText('oobe-subtitle-Surf', d.SurfPageSubtitle);
        setText('oobe-Surf-title', this._SurfText('settings.Surf-title', 'Surf AI', 'Surf AI'));
        setText('oobe-title-user', d.userPageTitle);
        setText('oobe-subtitle-user', d.userPageSubtitle);
        setText('oobe-user-avatar-title', d.userAvatarTitle);
        setText('oobe-user-name-title', d.userNameTitle);
        setText('oobe-user-email-title', d.userEmailTitle);
        setText('oobe-title-password', d.passwordPageTitle);
        setText('oobe-subtitle-password', d.passwordPageSubtitle);
        setText('oobe-pin-title', d.pinTitle);
        setText('oobe-completion-title', d.completionTitle);
        setText('oobe-enter-desktop', d.enterDesktop);

        setText('oobe-title-auth', d.authPageTitle);
        setText('oobe-subtitle-auth', d.authPageSubtitle);
        setText('oobe-auth-username-title', d.authUsernameTitle);
        const authUsernameInput = document.getElementById('oobe-auth-username-input');
        if (authUsernameInput) authUsernameInput.placeholder = d.authUsernamePlaceholder;

        setText('oobe-title-privacy', d.privacyPageTitle);
        setText('oobe-subtitle-privacy', d.privacyPageSubtitle);
        setText('oobe-privacy-diagnostics-title', d.privacyDiagnosticsTitle);
        setText('oobe-privacy-diagnostics-desc', d.privacyDiagnosticsDesc);
        setText('oobe-privacy-tailored-title', d.privacyTailoredTitle);
        setText('oobe-privacy-tailored-desc', d.privacyTailoredDesc);
        setText('oobe-privacy-ads-title', d.privacyAdsTitle);
        setText('oobe-privacy-ads-desc', d.privacyAdsDesc);

        setText('oobe-title-device', d.devicePageTitle);
        setText('oobe-subtitle-device', d.devicePageSubtitle);
        setText('oobe-device-name-title', d.deviceNameTitle);

        setText('oobe-title-country', d.countryPageTitle);
        setText('oobe-subtitle-country', d.countryPageSubtitle);
        const countrySearch = document.getElementById('oobe-country-search');
        if (countrySearch) countrySearch.placeholder = d.countrySearchPlaceholder;

        const pinInput = document.getElementById('oobe-pin-input');
        if (pinInput) pinInput.placeholder = d.pinPlaceholder;
        if (this.userNameInputEl) this.userNameInputEl.placeholder = d.userNamePlaceholder;
        if (this.userEmailInputEl) this.userEmailInputEl.placeholder = d.userEmailPlaceholder;

        const authLoginTab = this.element?.querySelector('.oobe-auth-tab[data-auth-tab="login"]');
        if (authLoginTab) authLoginTab.textContent = d.authLoginTab;
        const authSignupTab = this.element?.querySelector('.oobe-auth-tab[data-auth-tab="signup"]');
        if (authSignupTab) authSignupTab.textContent = d.authSignupTab;
        const authLoginEmail = document.getElementById('oobe-login-email');
        if (authLoginEmail) authLoginEmail.placeholder = d.authEmailPlaceholder;
        const authLoginPassword = document.getElementById('oobe-login-password');
        if (authLoginPassword) authLoginPassword.placeholder = d.authPasswordPlaceholder;
        const authSignupEmail = document.getElementById('oobe-signup-email');
        if (authSignupEmail) authSignupEmail.placeholder = d.authEmailPlaceholder;
        const authSignupPassword = document.getElementById('oobe-signup-password');
        if (authSignupPassword) authSignupPassword.placeholder = d.authPasswordPlaceholder;
        const authLoginBtn = document.getElementById('oobe-login-submit');
        if (authLoginBtn) authLoginBtn.textContent = d.authLoginBtn;
        const authSignupBtn = document.getElementById('oobe-signup-submit');
        if (authSignupBtn) authSignupBtn.textContent = d.authSignupBtn;
        if (this.userAvatarUploadBtnEl) this.userAvatarUploadBtnEl.textContent = d.userUploadAvatar;
        if (this.userAvatarResetBtnEl) this.userAvatarResetBtnEl.textContent = d.userResetAvatar;
        const uploadWallpaperText = document.querySelector('#oobe-upload-wallpaper .fluent-btn-text');
        if (uploadWallpaperText) uploadWallpaperText.textContent = d.wallpaperUpload;

        const langMap = {
            zh: { titleKey: 'langZhTitle', descKey: 'langZhDesc' },
            en: { titleKey: 'langEnTitle', descKey: 'langEnDesc' },
            ja: { titleKey: 'langJaTitle', descKey: 'langJaDesc' },
            th: { titleKey: 'langThTitle', descKey: 'langThDesc' },
            de: { titleKey: 'langDeTitle', descKey: 'langDeDesc' }
        };
        Object.keys(langMap).forEach((langCode) => {
            const titleEl = this.element.querySelector(`[data-lang="${langCode}"] .oobe-option-title`);
            const descEl = this.element.querySelector(`[data-lang="${langCode}"] .oobe-option-desc`);
            const mapping = langMap[langCode];
            if (titleEl && d[mapping.titleKey]) titleEl.textContent = d[mapping.titleKey];
            if (descEl && d[mapping.descKey]) descEl.textContent = d[mapping.descKey];
        });

        this._initThemeControls();
        ['oobe-next-1', 'oobe-next-2', 'oobe-next-3', 'oobe-next-4', 'oobe-next-5'].forEach((id) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.title = d.next;
            button.setAttribute('aria-label', d.next);
        });
        ['oobe-back-1', 'oobe-back-2', 'oobe-back-3', 'oobe-back-4', 'oobe-back-5', 'oobe-back-6'].forEach((id) => {
            const button = document.getElementById(id);
            if (button) button.title = d.back;
        });
        const finishButton = document.getElementById('oobe-finish');
        if (finishButton) {
            finishButton.title = d.finish;
            finishButton.setAttribute('aria-label', d.finish);
        }
        const enterDesktopButton = document.getElementById('oobe-enter-desktop');
        if (enterDesktopButton) {
            enterDesktopButton.disabled = false;
            enterDesktopButton.setAttribute('aria-label', d.enterDesktop);
        }

        if (this.welcomeBrandTextEl) {
            this.welcomeBrandTextEl.textContent = this._langCode() === 'zh'
                ? 'NyouOS 文澜江'
                : 'NyouOS Wenlan River';
        }
        this.welcomeCopyEl?.classList.toggle('is-english', this._langCode() !== 'zh');
        if (this.welcomeNextEl) {
            this.welcomeNextEl.textContent = this._langCode() === 'zh'
                ? '单击任意位置以继续'
                : 'Click anywhere to continue';
        }

        if (this.SurfInputEl) {
            this.SurfInputEl.placeholder = d.SurfInputPlaceholder;
        }

        this.element.querySelectorAll('.oobe-live-login-card .login-submit').forEach((btn) => {
            btn.textContent = d.previewLogin;
        });

        this._renderSurfSettingsPanel();
        this._syncUserStepState();
        this._syncDesktopPreviewState();
        this._updatePreloadStatusText();
    },

    _markCompleted() {
        try {
            localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
        } catch (_) {
            // ignore
        }
    },

    _langCode() {
        return this.selectedLang || State?.settings?.language || 'zh';
    },

    _dict() {
        const lang = this._langCode();
        const base = lang === 'en'
            ? {
                userPageTitle: 'User',
                userPageSubtitle: 'Set your avatar, user name and email.',
                userAvatarTitle: 'Avatar',
                userUploadAvatar: 'Upload Custom Avatar',
                userResetAvatar: 'Restore Default Avatar',
                userNameTitle: 'User Name',
                userNamePlaceholder: 'Enter user name',
                userEmailTitle: 'Email',
                userEmailPlaceholder: 'Enter email',
                userNameRequired: 'User name cannot be empty.',
                userEmailInvalid: 'Invalid email format.'
            }
            : {
                userPageTitle: '\u7528\u6237',
                userPageSubtitle: '\u8bbe\u7f6e\u5934\u50cf\u3001\u7528\u6237\u540d\u548c\u90ae\u7bb1\u3002',
                userAvatarTitle: '\u5934\u50cf',
                userUploadAvatar: '\u4e0a\u4f20\u81ea\u5b9a\u4e49\u5934\u50cf',
                userResetAvatar: '\u6062\u590d\u9ed8\u8ba4\u5934\u50cf',
                userNameTitle: '\u7528\u6237\u540d',
                userNamePlaceholder: '\u8bf7\u8f93\u5165\u7528\u6237\u540d',
                userEmailTitle: '\u90ae\u7bb1',
                userEmailPlaceholder: '\u8bf7\u8f93\u5165\u90ae\u7bb1',
                userNameRequired: '\u7528\u6237\u540d\u4e0d\u80fd\u4e3a\u7a7a',
                userEmailInvalid: '\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e'
            };
        return { ...base, ...(this.i18n[lang] || this.i18n.zh) };
    },

    /* ===== Welcome animation (Step 0) ===== */

    _startWelcomeAnimationFromBootLogo(bootLogoEl) {
        if (!this.welcomeLogoEl || !bootLogoEl || typeof bootLogoEl.getBoundingClientRect !== 'function') {
            this._startWelcomeAnimation();
            return;
        }

        const startRect = bootLogoEl.getBoundingClientRect();
        if (!startRect.width || !startRect.height) {
            this._startWelcomeAnimation();
            return;
        }

        this._stopWelcomeAnimation();
        this.welcomeAnimStarted = false;
        this.welcomeTextIndex = 0;
        this.bridgeBootLogoEl = bootLogoEl;
        this.bridgeBootLogoEl.style.opacity = '0';
        this.bridgeBootLogoEl.style.visibility = 'hidden';

        this.welcomeLogoEl.classList.remove('oobe-logo-bridged');
        this.welcomeLogoEl.classList.remove('oobe-logo-shift-left', 'oobe-logo-welcome-position');
        this.welcomeLogoEl.classList.add('oobe-logo-bridging');
        this.welcomeLogoEl.classList.add('oobe-logo-bridge-target');
        const targetRect = this.welcomeLogoEl.getBoundingClientRect();
        this.welcomeLogoEl.classList.remove('oobe-logo-bridge-target');

        if (!targetRect.width || !targetRect.height) {
            this._startWelcomeAnimation();
            return;
        }

        const bridge = document.createElement('img');
        bridge.className = 'oobe-logo-bridge';
        bridge.src = bootLogoEl.currentSrc || bootLogoEl.src || this.welcomeLogoEl.currentSrc || this.welcomeLogoEl.src;
        bridge.alt = 'Fluent OS';
        bridge.style.left = `${startRect.left}px`;
        bridge.style.top = `${startRect.top}px`;
        bridge.style.width = `${startRect.width}px`;
        bridge.style.height = `${startRect.height}px`;
        document.body.appendChild(bridge);
        this.logoBridgeEl = bridge;

        if (this.welcomeTextEl) {
            this.welcomeTextEl.innerHTML = '';
            this.welcomeTextEl.classList.remove('oobe-welcome-text-show');
        }
        this.welcomeNextEl?.classList.remove('is-visible');

        const animation = bridge.animate([
            {
                left: `${startRect.left}px`,
                top: `${startRect.top}px`,
                width: `${startRect.width}px`,
                height: `${startRect.height}px`,
                opacity: 1
            },
            {
                left: `${startRect.left + ((targetRect.left - startRect.left) * 0.62)}px`,
                top: `${startRect.top + ((targetRect.top - startRect.top) * 0.38) - 18}px`,
                width: `${startRect.width + ((targetRect.width - startRect.width) * 0.58)}px`,
                height: `${startRect.height + ((targetRect.height - startRect.height) * 0.58)}px`,
                opacity: 1,
                offset: 0.56
            },
            {
                left: `${targetRect.left}px`,
                top: `${targetRect.top}px`,
                width: `${targetRect.width}px`,
                height: `${targetRect.height}px`,
                opacity: 1
            }
        ], {
            duration: 900,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });

        const onDone = () => {
            this._clearWelcomeLogoBridge();
            if (this.currentStep !== 0) return;
            if (this.welcomeLogoEl) {
                this.welcomeLogoEl.classList.remove('oobe-logo-bridging');
                this.welcomeLogoEl.classList.add('oobe-logo-bridged');
            }
            this._startWelcomeBrandSequence(160);
        };

        if (animation && animation.finished && typeof animation.finished.then === 'function') {
            animation.finished.then(onDone).catch(onDone);
        } else {
            this.logoBridgeTimer = setTimeout(onDone, 920);
        }
    },

    _clearWelcomeLogoBridge() {
        if (this.logoBridgeTimer) {
            clearTimeout(this.logoBridgeTimer);
            this.logoBridgeTimer = null;
        }
        if (this.logoBridgeEl && this.logoBridgeEl.parentNode) {
            this.logoBridgeEl.parentNode.removeChild(this.logoBridgeEl);
        }
        this.logoBridgeEl = null;
        this.bridgeBootLogoEl = null;
        if (this.welcomeLogoEl) {
            this.welcomeLogoEl.classList.remove('oobe-logo-bridge-target', 'oobe-logo-bridging');
        }
    },

    _startWelcomeAnimation(fromBridge = false) {
        this._stopWelcomeAnimation();
        this.welcomeAnimStarted = false;
        this.welcomeTextIndex = 0;

        /* Keep the continuation hint hidden until the first welcome word. */
        if (this.welcomeNextEl) {
            this.welcomeNextEl.classList.remove('is-visible');
        }

        /* Phase 1: logo animates in (CSS handles initial positioning) */
        if (this.welcomeLogoEl) {
            this.welcomeLogoEl.classList.remove('oobe-logo-bridging');
            this.welcomeLogoEl.classList.remove('oobe-logo-shift-left', 'oobe-logo-welcome-position');
            this.welcomeLogoEl.classList.toggle('oobe-logo-bridged', fromBridge);
            void this.welcomeLogoEl.offsetWidth;
        }
        if (this.welcomeTextEl) {
            this.welcomeTextEl.innerHTML = '';
            this.welcomeTextEl.classList.remove('oobe-welcome-text-show');
        }
        this.welcomePhaseTimer = setTimeout(() => {
            if (this.currentStep === 0) this._startWelcomeBrandSequence(160);
        }, fromBridge ? 120 : 900);
    },

    _syncWelcomeLogoPositions() {
        if (!this.welcomeLogoEl || !this.welcomeCopyEl || !this.welcomeBrandEl || !this.welcomeBrandTextEl || !this.element) return;
        const stage = this.element.querySelector('.oobe-welcome-layout');
        if (!stage) return;

        const stageRect = stage.getBoundingClientRect();
        const logoRect = this.welcomeLogoEl.getBoundingClientRect();
        if (!stageRect.width || !logoRect.width) return;

        this.welcomeBrandEl.style.width = 'max-content';
        const brandWidth = Math.ceil(this.welcomeBrandTextEl.getBoundingClientRect().width);
        this.welcomeBrandEl.style.width = '100%';
        if (!brandWidth) return;

        const brandGap = Math.max(48, Math.min(78, stageRect.width * 0.045));
        const welcomeGap = Math.max(32, Math.min(42, stageRect.width * 0.028));
        const groupWidth = logoRect.width + brandGap + brandWidth;
        const groupLeft = stageRect.left + ((stageRect.width - groupWidth) / 2);
        const copyLeft = groupLeft + logoRect.width + brandGap;
        const centeredLogoLeft = stageRect.left + ((stageRect.width - logoRect.width) / 2);
        const brandShift = groupLeft - centeredLogoLeft;

        const welcomeStyle = getComputedStyle(this.welcomeTextEl);
        const canvas = this._welcomeMeasureCanvas || (this._welcomeMeasureCanvas = document.createElement('canvas'));
        const context = canvas.getContext('2d');
        let welcomeWidth = Math.min(brandWidth, 430);
        if (context) {
            context.font = `${welcomeStyle.fontWeight} ${welcomeStyle.fontSize} ${welcomeStyle.fontFamily}`;
            welcomeWidth = Math.max(
                context.measureText('Welcome').width,
                context.measureText('欢\u00a0迎').width
            );
        }
        const welcomeLeft = copyLeft + ((brandWidth - welcomeWidth) / 2);
        const centeredLogoRight = centeredLogoLeft + logoRect.width;
        const welcomeShift = welcomeLeft - welcomeGap - centeredLogoRight;

        this.welcomeCopyEl.style.left = `${(copyLeft - stageRect.left).toFixed(2)}px`;
        this.welcomeCopyEl.style.width = `${brandWidth}px`;

        this.welcomeLogoEl.style.setProperty('--oobe-logo-brand-shift', `${brandShift.toFixed(2)}px`);
        this.welcomeLogoEl.style.setProperty('--oobe-logo-welcome-shift', `${welcomeShift.toFixed(2)}px`);
    },

    _startWelcomeBrandSequence(delay = 320) {
        if (this.welcomeBrandTextEl) {
            this.welcomeBrandTextEl.textContent = this._langCode() === 'zh'
                ? 'NyouOS 文澜江'
                : 'NyouOS Wenlan River';
        }
        this.welcomeCopyEl?.classList.toggle('is-english', this._langCode() !== 'zh');
        if (this.welcomeBrandEl) {
            this.welcomeBrandEl.classList.remove('is-revealing', 'is-transforming', 'is-finished');
            this.welcomeBrandEl.classList.toggle('is-english', this._langCode() !== 'zh');
            void this.welcomeBrandEl.offsetWidth;
        }

        this._syncWelcomeLogoPositions();
        this.welcomeLogoEl?.classList.remove('oobe-logo-welcome-position');
        this.welcomeLogoEl?.classList.add('oobe-logo-shift-left');

        this.welcomeBrandTimer = setTimeout(() => {
            if (this.currentStep !== 0) return;
            this.welcomeBrandEl?.classList.add('is-revealing');
        }, delay);

        this.welcomeTransformTimer = setTimeout(() => {
            if (this.currentStep !== 0) return;
            this.welcomeBrandEl?.classList.add('is-transforming');
            this._syncWelcomeLogoPositions();
            this.welcomeLogoEl?.classList.add('oobe-logo-welcome-position');
            this.welcomeLogoTextTimer = setTimeout(() => {
                if (this.currentStep === 0) this._cycleWelcomeText();
            }, 240);
        }, delay + 1420);
    },

    _cycleWelcomeText() {
        if (!this.welcomeTextEl || this.currentStep !== 0) return;

        const texts = this._langCode() === 'zh'
            ? ['欢\u00a0迎', 'Welcome']
            : ['Welcome', '欢\u00a0迎'];
        const text = texts[this.welcomeTextIndex % texts.length];
        this.welcomeBrandEl?.classList.add('is-finished');

        /* Build letter spans for Q-bounce animation */
        this.welcomeTextEl.innerHTML = '';
        this.welcomeTextEl.classList.add('oobe-welcome-text-show');

        const chars = text.split('');
        chars.forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'oobe-welcome-letter';
            span.textContent = char;
            span.style.animationDelay = `${i * 60}ms`;
            this.welcomeTextEl.appendChild(span);
        });

        /* Reveal the card-wide continuation hint with the first welcome word. */
        if (!this.welcomeAnimStarted && this.welcomeNextEl) {
            this.welcomeAnimStarted = true;
            this.welcomeNextEl.classList.add('is-visible');
        }

        this.welcomeAnimTimer = setTimeout(() => {
            if (this.currentStep !== 0 || !this.welcomeTextEl) return;
            const letters = this.welcomeTextEl.querySelectorAll('.oobe-welcome-letter');
            letters.forEach((letter, index) => {
                letter.classList.add('oobe-welcome-letter-out');
                letter.style.animationDelay = `${index * 40}ms`;
            });
            this.welcomeSwapTimer = setTimeout(() => {
                if (this.currentStep !== 0) return;
                this.welcomeTextIndex = (this.welcomeTextIndex + 1) % texts.length;
                this._cycleWelcomeText();
            }, (letters.length * 40) + 320);
        }, 2500);
    },

    _stopWelcomeAnimation() {
        if (this.welcomeAnimTimer) {
            clearTimeout(this.welcomeAnimTimer);
            this.welcomeAnimTimer = null;
        }
        if (this.welcomePhaseTimer) {
            clearTimeout(this.welcomePhaseTimer);
            this.welcomePhaseTimer = null;
        }
        if (this.welcomeLogoTextTimer) {
            clearTimeout(this.welcomeLogoTextTimer);
            this.welcomeLogoTextTimer = null;
        }
        if (this.welcomeBrandTimer) {
            clearTimeout(this.welcomeBrandTimer);
            this.welcomeBrandTimer = null;
        }
        if (this.welcomeTransformTimer) {
            clearTimeout(this.welcomeTransformTimer);
            this.welcomeTransformTimer = null;
        }
        if (this.welcomeSwapTimer) {
            clearTimeout(this.welcomeSwapTimer);
            this.welcomeSwapTimer = null;
        }
        if (this.welcomeBrandEl) {
            this.welcomeBrandEl.classList.remove('is-revealing', 'is-transforming', 'is-finished');
        }
        this._clearWelcomeLogoBridge();
    },

    /* ===== Language preview text sync ===== */

    _syncLangPreviewText() {
        if (!this.langPreviewTextEl) return;
        const lang = this.selectedLang || 'zh';
        this.langPreviewTextEl.textContent = lang === 'zh' ? '简体' : 'Aa';
    }
};

