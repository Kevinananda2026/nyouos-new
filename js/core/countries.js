/**
 * NyouOS 国家/地区数据
 * 包含国家列表、地区推荐应用（网页套壳）、以及应用可用性限制
 */

var Countries = {
    // 国家列表：code, 名称（中文/英文），图标 flag emoji
    list: [
        { code: 'CN', nameZh: '中国大陆', nameEn: 'China', flag: '🇨🇳', region: 'asia' },
        { code: 'HK', nameZh: '中国香港', nameEn: 'Hong Kong', flag: '🇭🇰', region: 'asia' },
        { code: 'TW', nameZh: '中国台湾', nameEn: 'Taiwan', flag: '🇹🇼', region: 'asia' },
        { code: 'JP', nameZh: '日本', nameEn: 'Japan', flag: '🇯🇵', region: 'asia' },
        { code: 'KR', nameZh: '韩国', nameEn: 'South Korea', flag: '🇰🇷', region: 'asia' },
        { code: 'SG', nameZh: '新加坡', nameEn: 'Singapore', flag: '🇸🇬', region: 'asia' },
        { code: 'MY', nameZh: '马来西亚', nameEn: 'Malaysia', flag: '🇲🇾', region: 'asia' },
        { code: 'TH', nameZh: '泰国', nameEn: 'Thailand', flag: '🇹🇭', region: 'asia' },
        { code: 'VN', nameZh: '越南', nameEn: 'Vietnam', flag: '🇻🇳', region: 'asia' },
        { code: 'ID', nameZh: '印度尼西亚', nameEn: 'Indonesia', flag: '🇮🇩', region: 'asia' },
        { code: 'IN', nameZh: '印度', nameEn: 'India', flag: '🇮🇳', region: 'asia' },
        { code: 'PH', nameZh: '菲律宾', nameEn: 'Philippines', flag: '🇵🇭', region: 'asia' },
        { code: 'US', nameZh: '美国', nameEn: 'United States', flag: '🇺🇸', region: 'america' },
        { code: 'CA', nameZh: '加拿大', nameEn: 'Canada', flag: '🇨🇦', region: 'america' },
        { code: 'MX', nameZh: '墨西哥', nameEn: 'Mexico', flag: '🇲🇽', region: 'america' },
        { code: 'BR', nameZh: '巴西', nameEn: 'Brazil', flag: '🇧🇷', region: 'america' },
        { code: 'AR', nameZh: '阿根廷', nameEn: 'Argentina', flag: '🇦🇷', region: 'america' },
        { code: 'GB', nameZh: '英国', nameEn: 'United Kingdom', flag: '🇬🇧', region: 'europe' },
        { code: 'DE', nameZh: '德国', nameEn: 'Germany', flag: '🇩🇪', region: 'europe' },
        { code: 'FR', nameZh: '法国', nameEn: 'France', flag: '🇫🇷', region: 'europe' },
        { code: 'IT', nameZh: '意大利', nameEn: 'Italy', flag: '🇮🇹', region: 'europe' },
        { code: 'ES', nameZh: '西班牙', nameEn: 'Spain', flag: '🇪🇸', region: 'europe' },
        { code: 'RU', nameZh: '俄罗斯', nameEn: 'Russia', flag: '🇷🇺', region: 'europe' },
        { code: 'NL', nameZh: '荷兰', nameEn: 'Netherlands', flag: '🇳🇱', region: 'europe' },
        { code: 'SE', nameZh: '瑞典', nameEn: 'Sweden', flag: '🇸🇪', region: 'europe' },
        { code: 'AU', nameZh: '澳大利亚', nameEn: 'Australia', flag: '🇦🇺', region: 'oceania' },
        { code: 'NZ', nameZh: '新西兰', nameEn: 'New Zealand', flag: '🇳🇿', region: 'oceania' },
        { code: 'AE', nameZh: '阿联酋', nameEn: 'UAE', flag: '🇦🇪', region: 'middle_east' },
        { code: 'SA', nameZh: '沙特阿拉伯', nameEn: 'Saudi Arabia', flag: '🇸🇦', region: 'middle_east' },
        { code: 'ZA', nameZh: '南非', nameEn: 'South Africa', flag: '🇿🇦', region: 'africa' },
    ],

    // 地区推荐应用（网页套壳）
    // 每个 app 对象定义：id, name, category, icon, developer, rating, url, themeColor, desc, availableIn
    // availableIn: 允许的国家代码列表（空数组表示所有国家可用）
    regionApps: {
        // === 中国大陆 ===
        CN: [
            { id: 'wechat', name: '微信', category: 'social', icon: 'wechat.png', developer: 'Tencent', rating: 4.8, downloads: '10亿+', isPWA: true, url: 'https://weixin.qq.com/', themeColor: '#07C160', desc: '微信是中国最大的即时通讯和社交媒体平台。' },
            { id: 'taobao', name: '淘宝', category: 'shopping', icon: 'taobao.png', developer: 'Alibaba', rating: 4.5, downloads: '10亿+', isPWA: true, url: 'https://www.taobao.com/', themeColor: '#ff5000', desc: '淘宝网是中国最大的网络零售平台。' },
            { id: 'jd', name: '京东', category: 'shopping', icon: 'jingdong.png', developer: 'JD.com', rating: 4.6, downloads: '5亿+', isPWA: true, url: 'https://www.jd.com/', themeColor: '#e2231a', desc: '京东是中国自营式电商企业。' },
            { id: 'bilibili', name: '哔哩哔哩', category: 'video', icon: 'bilibili.png', developer: 'Bilibili', rating: 4.6, downloads: '3亿+', isPWA: true, url: 'https://www.bilibili.com/', themeColor: '#fb7299', desc: '哔哩哔哩是中国年轻人高度聚集的视频平台。' },
            { id: 'douyin', name: '抖音', category: 'video', icon: 'douyin.png', developer: 'ByteDance', rating: 4.5, downloads: '7亿+', isPWA: true, url: 'https://www.douyin.com/', themeColor: '#000000', desc: '抖音是中国领先的短视频社交平台。' },
            { id: 'netease-music', name: '网易云音乐', category: 'music', icon: 'wangyiyun_music.png', developer: 'NetEase', rating: 4.7, downloads: '5亿+', isPWA: true, url: 'https://music.163.com/', themeColor: '#e60026', desc: '网易云音乐专注于发现与分享的音乐产品。' },
            { id: 'qq-music', name: 'QQ音乐', category: 'music', icon: 'qqmusic.png', developer: 'Tencent', rating: 4.6, downloads: '8亿+', isPWA: true, url: 'https://y.qq.com/', themeColor: '#31c27c', desc: 'QQ音乐是腾讯推出的网络音乐服务。' },
            { id: 'meituan', name: '美团', category: 'lifestyle', icon: 'meituan.png', developer: 'Meituan', rating: 4.5, downloads: '5亿+', isPWA: true, url: 'https://www.meituan.com/', themeColor: '#ffc300', desc: '美团是中国领先的生活服务电子商务平台。' },
            { id: 'eleme', name: '饿了么', category: 'lifestyle', icon: 'meituan.png', developer: 'Alibaba', rating: 4.4, downloads: '3亿+', isPWA: true, url: 'https://www.ele.me/', themeColor: '#0097ff', desc: '饿了么是中国专业的本地生活平台。' },
            { id: 'amap', name: '高德地图', category: 'tools', icon: 'gaode.png', developer: 'Alibaba', rating: 4.6, downloads: '8亿+', isPWA: true, url: 'https://www.amap.com/', themeColor: '#0091ff', desc: '高德地图是中国领先的数字地图内容提供商。' },
            { id: 'baidu', name: '百度', category: 'tools', icon: 'baidu.png', developer: 'Baidu', rating: 4.5, downloads: '10亿+', isPWA: true, url: 'https://www.baidu.com/', themeColor: '#2319DC', desc: '百度是中国最大的搜索引擎。' },
            { id: 'alipay', name: '支付宝', category: 'tools', icon: 'alipay.png', developer: 'Ant Group', rating: 4.7, downloads: '10亿+', isPWA: true, url: 'https://www.alipay.com/', themeColor: '#1677ff', desc: '支付宝是全球领先的独立第三方支付平台。' },
            { id: 'weibo', name: '微博', category: 'social', icon: 'WB.png', developer: 'Sina', rating: 4.4, downloads: '5亿+', isPWA: true, url: 'https://weibo.com/', themeColor: '#e6162d', desc: '微博是基于用户关系的社交媒体平台。' },
            { id: 'baidu-netdisk', name: '百度网盘', category: 'tools', icon: 'baidudisk.png', developer: 'Baidu', rating: 4.2, downloads: '3亿+', isPWA: true, url: 'https://pan.baidu.com/', themeColor: '#06a7ff', desc: '百度网盘是百度推出的云存储服务。' },
            { id: 'zhihu', name: '知乎', category: 'social', icon: 'zhihu.png', developer: 'Zhihu', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.zhihu.com/', themeColor: '#0084ff', desc: '知乎是中文互联网高质量的问答社区。' },
            { id: 'douban', name: '豆瓣', category: 'lifestyle', icon: 'douban.png', developer: 'Douban', rating: 4.7, downloads: '5000万+', isPWA: true, url: 'https://www.douban.com/', themeColor: '#42AC51', desc: '豆瓣提供书籍、电影、音乐等文化产品的信息服务。' },
            { id: 'xiaohongshu', name: '小红书', category: 'social', icon: 'xiaohongshu.png', developer: 'Xiaohongshu', rating: 4.5, downloads: '3亿+', isPWA: true, url: 'https://www.xiaohongshu.com/', themeColor: '#ff2442', desc: '小红书是年轻人的生活方式平台和消费决策入口。' },
            { id: 'iqiyi', name: '爱奇艺', category: 'video', icon: 'iqiyi.png', developer: 'iQIYI', rating: 4.3, downloads: '5亿+', isPWA: true, url: 'https://www.iqiyi.com/', themeColor: '#00BE06', desc: '爱奇艺是中国领先的在线视频网站。' },
            { id: 'tencent-video', name: '腾讯视频', category: 'video', icon: 'tencent-video.png', developer: 'Tencent', rating: 4.4, downloads: '5亿+', isPWA: true, url: 'https://v.qq.com/', themeColor: '#FF6A00', desc: '腾讯视频是中国领先的在线视频播放平台。' },
            { id: 'youku', name: '优酷', category: 'video', icon: 'youku.png', developer: 'Alibaba', rating: 4.2, downloads: '5亿+', isPWA: true, url: 'https://www.youku.com/', themeColor: '#1FBBFF', desc: '优酷是中国领先的视频分享网站。' },
            { id: 'feishu', name: '飞书', category: 'office', icon: 'feishu.png', developer: 'ByteDance', rating: 4.6, downloads: '5000万+', isPWA: true, url: 'https://www.feishu.cn/', themeColor: '#3370FF', desc: '飞书是新一代企业协作与知识管理平台。' },
            { id: 'dingding', name: '钉钉', category: 'office', icon: 'dingding.png', developer: 'Alibaba', rating: 4.3, downloads: '5亿+', isPWA: true, url: 'https://www.dingtalk.com/', themeColor: '#1296DB', desc: '钉钉是阿里巴巴推出的企业协作平台。' },
            { id: 'doubao', name: '豆包', category: 'tools', icon: 'doubao.png', developer: 'ByteDance', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.doubao.com/', themeColor: '#4F46E5', desc: '豆包是字节跳动推出的AI助手。' },
            { id: 'deepseek', name: '深度求索', category: 'tools', icon: 'deepseek.png', developer: 'DeepSeek', rating: 4.5, downloads: '1000万+', isPWA: true, url: 'https://chat.deepseek.com/', themeColor: '#4B7BEC', desc: '深度求索是中国AI大模型公司。' },
            { id: '36kr', name: '36氪', category: 'news', icon: '36kr.png', developer: '36Kr', rating: 4.5, downloads: '1000万+', isPWA: true, url: 'https://www.36kr.com/', themeColor: '#FF4D4F', desc: '36氪是中国科技创业媒体。' },
            { id: 'thepaper', name: '澎湃新闻', category: 'news', icon: 'thepaper.png', developer: 'The Paper', rating: 4.5, downloads: '5000万+', isPWA: true, url: 'https://www.thepaper.cn/', themeColor: '#FF6A00', desc: '澎湃新闻是中国主流时政大报。' },
            { id: 'chinadaily', name: '中国日报', category: 'news', icon: 'chinadaily.png', developer: 'China Daily', rating: 4.3, downloads: '1000万+', isPWA: true, url: 'https://www.chinadaily.com.cn/', themeColor: '#C71585', desc: '中国日报是国家级英语日报。' },
        ],

        // === 香港 ===
        HK: [
            { id: 'wechat', name: '微信', category: 'social', icon: 'wechat.png', developer: 'Tencent', rating: 4.8, downloads: '10亿+', isPWA: true, url: 'https://weixin.qq.com/', themeColor: '#07C160', desc: '微信即时通讯。' },
            { id: 'taobao', name: '淘宝', category: 'shopping', icon: 'taobao.png', developer: 'Alibaba', rating: 4.5, downloads: '10亿+', isPWA: true, url: 'https://www.taobao.com/', themeColor: '#ff5000', desc: '淘宝网。' },
            { id: 'bilibili', name: '哔哩哔哩', category: 'video', icon: 'bilibili.png', developer: 'Bilibili', rating: 4.6, downloads: '3亿+', isPWA: true, url: 'https://www.bilibili.com/', themeColor: '#fb7299', desc: 'B站视频。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '全球最大视频平台。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '全球社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片与视频分享。' },
            { id: 'netease-music', name: '网易云音乐', category: 'music', icon: 'wangyiyun_music.png', developer: 'NetEase', rating: 4.7, downloads: '5亿+', isPWA: true, url: 'https://music.163.com/', themeColor: '#e60026', desc: '网易云音乐。' },
            { id: 'amap', name: '高德地图', category: 'tools', icon: 'gaode.png', developer: 'Alibaba', rating: 4.6, downloads: '8亿+', isPWA: true, url: 'https://www.amap.com/', themeColor: '#0091ff', desc: '高德地图。' },
            { id: 'openrice', name: 'OpenRice 开饭喇', category: 'lifestyle', icon: 'openrice.png', developer: 'OpenRice', rating: 4.3, downloads: '500万+', isPWA: true, url: 'https://www.openrice.com/', themeColor: '#E60026', desc: '香港美食资讯平台。' },
            { id: 'hket', name: 'HKET', category: 'news', icon: 'hket.png', developer: 'HKET', rating: 4.4, downloads: '100万+', isPWA: true, url: 'https://www.hket.com/', themeColor: '#D32F2F', desc: '香港经济日报。' },
        ],

        // === 日本 ===
        JP: [
            { id: 'line', name: 'LINE', category: 'social', icon: 'line.png', developer: 'LINE Corp', rating: 4.6, downloads: '5亿+', isPWA: true, url: 'https://line.me/', themeColor: '#06C755', desc: '日本最受欢迎的即时通讯应用。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '全球最大视频平台。' },
            { id: 'amazon-jp', name: 'Amazon.co.jp', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '5亿+', isPWA: true, url: 'https://www.amazon.co.jp/', themeColor: '#FF9900', desc: '日本亚马逊购物。' },
            { id: 'twitter', name: 'X (Twitter)', category: 'social', icon: 'twitter.png', developer: 'X Corp', rating: 4.3, downloads: '数十亿+', isPWA: true, url: 'https://x.com/', themeColor: '#000000', desc: '全球社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片与视频分享。' },
            { id: 'goo', name: 'goo', category: 'portal', icon: 'goo.png', developer: 'goo', rating: 4.2, downloads: '1000万+', isPWA: true, url: 'https://www.goo.ne.jp/', themeColor: '#0066CC', desc: '日本门户网站。' },
            { id: 'yahoo-jp', name: 'Yahoo! Japan', category: 'portal', icon: 'yahoo.png', developer: 'Yahoo', rating: 4.4, downloads: '5000万+', isPWA: true, url: 'https://www.yahoo.co.jp/', themeColor: '#6001D2', desc: '日本雅虎门户。' },
            { id: 'rakuten', name: 'Rakuten', category: 'shopping', icon: 'rakuten.png', developer: 'Rakuten', rating: 4.3, downloads: '5000万+', isPWA: true, url: 'https://www.rakuten.co.jp/', themeColor: '#FF6A00', desc: '乐天购物。' },
            { id: 'niwango', name: 'niconico', category: 'video', icon: 'niwango.png', developer: 'DWANGO', rating: 4.3, downloads: '1000万+', isPWA: true, url: 'https://www.nicovideo.jp/', themeColor: '#E8244B', desc: '日本弹幕视频网站。' },
            { id: 'music-jp', name: 'LINE MUSIC', category: 'music', icon: 'line-music.png', developer: 'LINE Corp', rating: 4.5, downloads: '1000万+', isPWA: true, url: 'https://music.line.me/', themeColor: '#06C755', desc: 'LINE 音乐服务。' },
            { id: 'maps-jp', name: 'Google Maps', category: 'tools', icon: 'map.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://maps.google.co.jp/', themeColor: '#4285F4', desc: '谷歌地图日本。' },
        ],

        // === 韩国 ===
        KR: [
            { id: 'kakao', name: 'KakaoTalk', category: 'social', icon: 'kakao.png', developer: 'Kakao Corp', rating: 4.6, downloads: '1亿+', isPWA: true, url: 'https://www.kakao.com/', themeColor: '#FEE500', desc: '韩国最受欢迎的即时通讯应用。' },
            { id: 'naver', name: 'NAVER', category: 'portal', icon: 'naver.png', developer: 'NAVER Corp', rating: 4.4, downloads: '5000万+', isPWA: true, url: 'https://www.naver.com/', themeColor: '#03C75A', desc: '韩国最大搜索门户。' },
            { id: 'daum', name: 'Daum', category: 'portal', icon: 'daum.png', developer: 'Daum Corp', rating: 4.2, downloads: '1000万+', isPWA: true, url: 'https://www.daum.net/', themeColor: '#0054C6', desc: '韩国门户网站。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '全球最大视频平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片与视频分享。' },
            { id: 'coupang', name: 'Coupang', category: 'shopping', icon: 'coupang.png', developer: 'Coupang', rating: 4.4, downloads: '5000万+', isPWA: true, url: 'https://www.coupang.com/', themeColor: '#EE2737', desc: '韩国电商平台。' },
            { id: 'melon', name: 'Melon', category: 'music', icon: 'melon.png', developer: 'SM Entertainment', rating: 4.5, downloads: '1000万+', isPWA: true, url: 'https://www.melon.com/', themeColor: '#0095FF', desc: '韩国音乐平台。' },
            { id: 'tmap', name: 'Tmap', category: 'tools', icon: 'tmap.png', developer: 'SKT', rating: 4.3, downloads: '5000万+', isPWA: true, url: 'https://tmap.tistory.com/', themeColor: '#003876', desc: '韩国地图导航。' },
        ],

        // === 美国 ===
        US: [
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.com/', themeColor: '#4285F4', desc: '全球搜索引擎。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '全球最大视频平台。' },
            { id: 'gmail', name: 'Gmail', category: 'office', icon: 'email.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://mail.google.com/', themeColor: '#EA4335', desc: '谷歌邮件。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '全球社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片与视频分享。' },
            { id: 'twitter', name: 'X (Twitter)', category: 'social', icon: 'twitter.png', developer: 'X Corp', rating: 4.3, downloads: '数十亿+', isPWA: true, url: 'https://x.com/', themeColor: '#000000', desc: '全球社交平台。' },
            { id: 'amazon', name: 'Amazon', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.amazon.com/', themeColor: '#FF9900', desc: '全球电商平台。' },
            { id: 'netflix', name: 'Netflix', category: 'video', icon: 'netflix.png', developer: 'Netflix', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.netflix.com/', themeColor: '#E50914', desc: '全球流媒体平台。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '全球音乐流媒体。' },
            { id: 'apple-music', name: 'Apple Music', category: 'music', icon: 'apple-music.png', developer: 'Apple', rating: 4.6, downloads: '1亿+', isPWA: true, url: 'https://www.apple.com/apple-music/', themeColor: '#FA243C', desc: '苹果音乐服务。' },
            { id: 'maps', name: 'Google Maps', category: 'tools', icon: 'map.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://maps.google.com/', themeColor: '#4285F4', desc: '谷歌地图。' },
            { id: 'chatgpt', name: 'ChatGPT', category: 'tools', icon: 'chatgpt.png', developer: 'OpenAI', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://chatgpt.com/', themeColor: '#10A37F', desc: 'OpenAI 聊天机器人。' },
            { id: 'github', name: 'GitHub', category: 'developer', icon: 'github.png', developer: 'GitHub', rating: 4.7, downloads: '1000万+', isPWA: true, url: 'https://github.com/', themeColor: '#181717', desc: '全球代码托管平台。' },
            { id: 'stackoverflow', name: 'Stack Overflow', category: 'developer', icon: 'stackoverflow.png', developer: 'Stack Exchange', rating: 4.6, downloads: '1000万+', isPWA: true, url: 'https://stackoverflow.com/', themeColor: '#F48024', desc: '开发者问答社区。' },
            { id: 'wikipedia', name: 'Wikipedia', category: 'tools', icon: 'wikipedia.png', developer: 'Wikimedia', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://en.wikipedia.org/', themeColor: '#333333', desc: '免费百科全书。' },
            { id: 'reddit', name: 'Reddit', category: 'social', icon: 'reddit.png', developer: 'Reddit Inc', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.reddit.com/', themeColor: '#FF4500', desc: '全球社区论坛。' },
            { id: 'notion', name: 'Notion', category: 'office', icon: 'notion.png', developer: 'Notion Labs', rating: 4.7, downloads: '1000万+', isPWA: true, url: 'https://www.notion.so/', themeColor: '#000000', desc: '协作与知识管理。' },
            { id: 'canva', name: 'Canva', category: 'tools', icon: 'canva.png', developer: 'Canva', rating: 4.6, downloads: '1亿+', isPWA: true, url: 'https://www.canva.com/', themeColor: '#00C4CC', desc: '在线设计工具。' },
            { id: 'ebay', name: 'eBay', category: 'shopping', icon: 'ebay.png', developer: 'eBay', rating: 4.3, downloads: '1亿+', isPWA: true, url: 'https://www.ebay.com/', themeColor: '#E53238', desc: '全球在线拍卖网站。' },
            { id: 'paypal', name: 'PayPal', category: 'tools', icon: 'paypal.png', developer: 'PayPal', rating: 4.4, downloads: '1亿+', isPWA: true, url: 'https://www.paypal.com/', themeColor: '#003087', desc: '全球在线支付。' },
        ],

        // === 英国 ===
        GB: [
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.co.uk/', themeColor: '#4285F4', desc: '搜索引擎。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '视频平台。' },
            { id: 'bbc', name: 'BBC', category: 'news', icon: 'bbc.png', developer: 'BBC', rating: 4.5, downloads: '1000万+', isPWA: true, url: 'https://www.bbc.co.uk/', themeColor: '#BB1919', desc: '英国广播公司。' },
            { id: 'amazon-uk', name: 'Amazon.co.uk', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.amazon.co.uk/', themeColor: '#FF9900', desc: '英国亚马逊。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片分享。' },
            { id: 'twitter', name: 'X (Twitter)', category: 'social', icon: 'twitter.png', developer: 'X Corp', rating: 4.3, downloads: '数十亿+', isPWA: true, url: 'https://x.com/', themeColor: '#000000', desc: '社交平台。' },
            { id: 'netflix', name: 'Netflix', category: 'video', icon: 'netflix.png', developer: 'Netflix', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.netflix.com/uk', themeColor: '#E50914', desc: '流媒体。' },
            { id: 'maps', name: 'Google Maps', category: 'tools', icon: 'map.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://maps.google.co.uk/', themeColor: '#4285F4', desc: '地图。' },
        ],

        // === 德国 ===
        DE: [
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.de/', themeColor: '#4285F4', desc: '搜索引擎。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '视频平台。' },
            { id: 'amazon-de', name: 'Amazon.de', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.amazon.de/', themeColor: '#FF9900', desc: '德国亚马逊。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片分享。' },
            { id: 'netflix', name: 'Netflix', category: 'video', icon: 'netflix.png', developer: 'Netflix', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.netflix.com/de', themeColor: '#E50914', desc: '流媒体。' },
            { id: 'wikipedia-de', name: 'Wikipedia DE', category: 'tools', icon: 'wikipedia.png', developer: 'Wikimedia', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://de.wikipedia.org/', themeColor: '#333333', desc: '德语百科。' },
        ],

        // === 法国 ===
        FR: [
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.fr/', themeColor: '#4285F4', desc: '搜索引擎。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '视频平台。' },
            { id: 'amazon-fr', name: 'Amazon.fr', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.amazon.fr/', themeColor: '#FF9900', desc: '法国亚马逊。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片分享。' },
            { id: 'lemonde', name: 'Le Monde', category: 'news', icon: 'lemonde.png', developer: 'Le Monde', rating: 4.4, downloads: '1000万+', isPWA: true, url: 'https://www.lemonde.fr/', themeColor: '#1A3A6C', desc: '法国世界报。' },
        ],

        // === 澳大利亚 ===
        AU: [
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.com.au/', themeColor: '#4285F4', desc: '搜索引擎。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '视频平台。' },
            { id: 'amazon-au', name: 'Amazon.com.au', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.amazon.com.au/', themeColor: '#FF9900', desc: '澳洲亚马逊。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片分享。' },
            { id: 'abc-au', name: 'ABC News', category: 'news', icon: 'abc.png', developer: 'ABC', rating: 4.5, downloads: '1000万+', isPWA: true, url: 'https://www.abc.net.au/news/', themeColor: '#F04E23', desc: '澳洲广播公司新闻。' },
            { id: 'maps', name: 'Google Maps', category: 'tools', icon: 'map.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://maps.google.com.au/', themeColor: '#4285F4', desc: '地图。' },
        ],

        // === 印度 ===
        IN: [
            { id: 'whatsapp', name: 'WhatsApp', category: 'social', icon: 'whatsapp.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.whatsapp.com/', themeColor: '#25D366', desc: '全球即时通讯。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '视频平台。' },
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.co.in/', themeColor: '#4285F4', desc: '搜索引擎。' },
            { id: 'flipkart', name: 'Flipkart', category: 'shopping', icon: 'flipkart.png', developer: 'Flipkart', rating: 4.4, downloads: '1亿+', isPWA: true, url: 'https://www.flipkart.com/', themeColor: '#2874F0', desc: '印度电商平台。' },
            { id: 'amazon-in', name: 'Amazon.in', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.amazon.in/', themeColor: '#FF9900', desc: '印度亚马逊。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片分享。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '社交平台。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
        ],

        // === 新加坡 ===
        SG: [
            { id: 'whatsapp', name: 'WhatsApp', category: 'social', icon: 'whatsapp.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.whatsapp.com/', themeColor: '#25D366', desc: '即时通讯。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '视频平台。' },
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.com.sg/', themeColor: '#4285F4', desc: '搜索引擎。' },
            { id: 'amazon-sg', name: 'Amazon.sg', category: 'shopping', icon: 'amazon.png', developer: 'Amazon', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.amazon.sg/', themeColor: '#FF9900', desc: '新加坡亚马逊。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片分享。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '社交平台。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
        ],

        // 默认/全球通用应用（用于未在上面定义的国家）
        _default: [
            { id: 'google', name: 'Google', category: 'tools', icon: 'google.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.google.com/', themeColor: '#4285F4', desc: '全球搜索引擎。' },
            { id: 'youtube', name: 'YouTube', category: 'video', icon: 'youtube.png', developer: 'Google', rating: 4.8, downloads: '数十亿+', isPWA: true, url: 'https://www.youtube.com/', themeColor: '#FF0000', desc: '全球最大视频平台。' },
            { id: 'gmail', name: 'Gmail', category: 'office', icon: 'email.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://mail.google.com/', themeColor: '#EA4335', desc: '谷歌邮件。' },
            { id: 'facebook', name: 'Facebook', category: 'social', icon: 'facebook.png', developer: 'Meta', rating: 4.5, downloads: '数十亿+', isPWA: true, url: 'https://www.facebook.com/', themeColor: '#1877F2', desc: '全球社交平台。' },
            { id: 'instagram', name: 'Instagram', category: 'social', icon: 'instagram.png', developer: 'Meta', rating: 4.6, downloads: '数十亿+', isPWA: true, url: 'https://www.instagram.com/', themeColor: '#E4405F', desc: '图片与视频分享。' },
            { id: 'twitter', name: 'X (Twitter)', category: 'social', icon: 'twitter.png', developer: 'X Corp', rating: 4.3, downloads: '数十亿+', isPWA: true, url: 'https://x.com/', themeColor: '#000000', desc: '全球社交平台。' },
            { id: 'wikipedia', name: 'Wikipedia', category: 'tools', icon: 'wikipedia.png', developer: 'Wikimedia', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://en.wikipedia.org/', themeColor: '#333333', desc: '免费百科全书。' },
            { id: 'github', name: 'GitHub', category: 'developer', icon: 'github.png', developer: 'GitHub', rating: 4.7, downloads: '1000万+', isPWA: true, url: 'https://github.com/', themeColor: '#181717', desc: '代码托管平台。' },
            { id: 'maps', name: 'Google Maps', category: 'tools', icon: 'map.png', developer: 'Google', rating: 4.7, downloads: '数十亿+', isPWA: true, url: 'https://maps.google.com/', themeColor: '#4285F4', desc: '谷歌地图。' },
            { id: 'translate', name: 'Google Translate', category: 'tools', icon: 'translate.png', developer: 'Google', rating: 4.6, downloads: '1亿+', isPWA: true, url: 'https://translate.google.com/', themeColor: '#4285F4', desc: '谷歌翻译。' },
            { id: 'drive', name: 'Google Drive', category: 'tools', icon: 'drive.png', developer: 'Google', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://drive.google.com/', themeColor: '#0080D0', desc: '云存储。' },
            { id: 'calendar', name: 'Google Calendar', category: 'office', icon: 'calendar.png', developer: 'Google', rating: 4.6, downloads: '1亿+', isPWA: true, url: 'https://calendar.google.com/', themeColor: '#4285F4', desc: '日历服务。' },
            { id: 'notion', name: 'Notion', category: 'office', icon: 'notion.png', developer: 'Notion Labs', rating: 4.7, downloads: '1000万+', isPWA: true, url: 'https://www.notion.so/', themeColor: '#000000', desc: '协作与知识管理。' },
            { id: 'canva', name: 'Canva', category: 'tools', icon: 'canva.png', developer: 'Canva', rating: 4.6, downloads: '1亿+', isPWA: true, url: 'https://www.canva.com/', themeColor: '#00C4CC', desc: '在线设计。' },
            { id: 'spotify', name: 'Spotify', category: 'music', icon: 'spotify.png', developer: 'Spotify', rating: 4.7, downloads: '1亿+', isPWA: true, url: 'https://open.spotify.com/', themeColor: '#1DB954', desc: '音乐流媒体。' },
            { id: 'netflix', name: 'Netflix', category: 'video', icon: 'netflix.png', developer: 'Netflix', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.netflix.com/', themeColor: '#E50914', desc: '流媒体。' },
            { id: 'reddit', name: 'Reddit', category: 'social', icon: 'reddit.png', developer: 'Reddit Inc', rating: 4.5, downloads: '1亿+', isPWA: true, url: 'https://www.reddit.com/', themeColor: '#FF4500', desc: '社区论坛。' },
        ],
    },

    // 获取指定国家的推荐应用
    getAppsForCountry(countryCode) {
        const code = (countryCode || '').toUpperCase();
        return this.regionApps[code] || this.regionApps._default;
    },

    // 获取国家信息
    getCountryInfo(countryCode) {
        const code = (countryCode || '').toUpperCase();
        return this.list.find(c => c.code === code) || null;
    },

    // 获取地区分组的国家列表
    getGroupedList(lang = 'zh') {
        const groups = {};
        const regionNames = {
            asia: { zh: '亚洲', en: 'Asia' },
            america: { zh: '美洲', en: 'Americas' },
            europe: { zh: '欧洲', en: 'Europe' },
            oceania: { zh: '大洋洲', en: 'Oceania' },
            middle_east: { zh: '中东', en: 'Middle East' },
            africa: { zh: '非洲', en: 'Africa' },
        };
        this.list.forEach(country => {
            if (!groups[country.region]) groups[country.region] = { name: regionNames[country.region][lang] || country.region, countries: [] };
            groups[country.region].countries.push(country);
        });
        return groups;
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Countries;
}
