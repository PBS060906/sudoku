export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/game/index',
    'pages/learn/index',
    'pages/stats/index',
    'pages/settings/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '数独时光',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f4f5fb'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#4f46e5',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png'
      },
      {
        pagePath: 'pages/learn/index',
        text: '教程',
        iconPath: 'assets/tabbar/learn.png',
        selectedIconPath: 'assets/tabbar/learn-selected.png'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计',
        iconPath: 'assets/tabbar/stats.png',
        selectedIconPath: 'assets/tabbar/stats-selected.png'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: 'assets/tabbar/settings.png',
        selectedIconPath: 'assets/tabbar/settings-selected.png'
      }
    ]
  }
});
