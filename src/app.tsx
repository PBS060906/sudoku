import React from 'react';
import { useDidHide, useDidShow, useLaunch } from '@tarojs/taro';
import { hydrateAll } from '@/store';
// 全局样式
import './app.scss';

function App(props) {
  // 启动时恢复本地设置 / 统计 / 未完成对局
  useLaunch(() => {
    hydrateAll();
    console.info('[App] 数独时光 launched, local data hydrated');
  });

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;
