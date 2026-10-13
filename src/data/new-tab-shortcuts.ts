export interface NewTabShortcut {
  title: string;
  url: string;
  description?: string;
  logo?: string;
}

export interface NewTabShortcutGroup {
  title: string;
  shortcuts: NewTabShortcut[];
}

export interface NewTabSearchEngine {
  id: string;
  label: string;
  searchUrl: string;
}

export interface NewTabHomeLink {
  label: string;
  href: string;
}

export interface NewTabConfig {
  title: string;
  description: string;
  heading: string;
  userName: string;
  storageKey: string;
  homeLink: NewTabHomeLink;
  greetings: NewTabGreeting[];
  search: {
    defaultEngineId: string;
    placeholder: string;
    submitLabel: string;
  };
  settings: {
    openLabel: string;
    panelTitle: string;
    closeLabel: string;
    generalLabel: string;
    shortcutsLabel: string;
    nameLabel: string;
    homeLinkLabel: string;
    homeHrefLabel: string;
    shortcutOpenModeLabel: string;
    shortcutOpenModeCurrentLabel: string;
    shortcutOpenModeNewTabLabel: string;
    searchEngineLabel: string;
    backgroundUrlLabel: string;
    backgroundFileLabel: string;
    backgroundOpacityLabel: string;
    textColorLabel: string;
    textColorModeLabel: string;
    textColorDefaultLabel: string;
    textColorLightLabel: string;
    textColorDarkLabel: string;
    backgroundPlaceholder: string;
    backgroundEmptyLabel: string;
    backgroundUploadedLabel: string;
    backgroundUrlStatusLabel: string;
    clearBackgroundLabel: string;
    importLabel: string;
    exportLabel: string;
    resetLabel: string;
    statusReady: string;
    addGroupLabel: string;
    addShortcutLabel: string;
    removeGroupLabel: string;
    removeShortcutLabel: string;
    editShortcutLabel: string;
    groupTitleLabel: string;
    shortcutTitleLabel: string;
    shortcutUrlLabel: string;
    shortcutDescriptionLabel: string;
    shortcutLogoLabel: string;
    fileLabel: string;
  };
}

export interface NewTabGreeting {
  label: string;
  from: number;
  to: number;
}

export const newTabConfig: NewTabConfig = {
  title: "New Tab",
  description: "搜索、打开常用入口。",
  heading: "快捷搜索",
  userName: "Ethanz888",
  storageKey: "ethanz-new-tab-config",
  homeLink: {
    label: "资料卡首页",
    href: "/",
  },
  greetings: [
    { label: "早上好", from: 5, to: 11 },
    { label: "中午好", from: 11, to: 14 },
    { label: "下午好", from: 14, to: 18 },
    { label: "晚上好", from: 18, to: 5 },
  ],
  search: {
    defaultEngineId: "google",
    placeholder: "输入关键词搜索",
    submitLabel: "搜索",
  },
  settings: {
    openLabel: "配置",
    panelTitle: "配置",
    closeLabel: "关闭",
    generalLabel: "基础",
    shortcutsLabel: "快捷方式",
    nameLabel: "名称",
    homeLinkLabel: "首页文案",
    homeHrefLabel: "首页地址",
    shortcutOpenModeLabel: "item 打开方式",
    shortcutOpenModeCurrentLabel: "当前标签页",
    shortcutOpenModeNewTabLabel: "新标签页",
    searchEngineLabel: "默认搜索引擎",
    backgroundUrlLabel: "背景图 URL",
    backgroundFileLabel: "本地背景图",
    backgroundOpacityLabel: "背景透明度",
    textColorLabel: "目标文本颜色",
    textColorModeLabel: "颜色模式",
    textColorDefaultLabel: "默认",
    textColorLightLabel: "浅色文字",
    textColorDarkLabel: "深色文字",
    backgroundPlaceholder: "留空则不显示背景图",
    backgroundEmptyLabel: "未设置背景",
    backgroundUploadedLabel: "已上传本地背景",
    backgroundUrlStatusLabel: "使用背景 URL",
    clearBackgroundLabel: "清除背景",
    importLabel: "导入 JSON",
    exportLabel: "导出 JSON",
    resetLabel: "恢复默认",
    statusReady: "本地配置",
    addGroupLabel: "添加分组",
    addShortcutLabel: "添加站点",
    removeGroupLabel: "删除分组",
    removeShortcutLabel: "删除 item",
    editShortcutLabel: "编辑",
    groupTitleLabel: "分组名",
    shortcutTitleLabel: "名称",
    shortcutUrlLabel: "地址",
    shortcutDescriptionLabel: "说明",
    shortcutLogoLabel: "图标 URL",
    fileLabel: "选择 JSON",
  },
};

export const newTabSearchEngines: NewTabSearchEngine[] = [
  {
    id: "google",
    label: "Google",
    searchUrl: "https://www.google.com/search?q={query}",
  },
  {
    id: "bing",
    label: "Bing",
    searchUrl: "https://www.bing.com/search?q={query}",
  },
  {
    id: "duckduckgo",
    label: "DuckDuckGo",
    searchUrl: "https://duckduckgo.com/?q={query}",
  },
  {
    id: "baidu",
    label: "百度",
    searchUrl: "https://www.baidu.com/s?wd={query}",
  },
];

export const newTabShortcutGroups: NewTabShortcutGroup[] = [];
