# 数独时光（Sudoku Moments）

一个融合三大开源数独项目设计精华的**微信小程序**：纯离线运行、支持 4×4 / 6×6 / 9×9 三种规格、五档难度，内置出题引擎、完整辅助功能、战绩统计，以及一个致敬类型编程的「TypeScript 类型实验室」。

基于 [Taro 4](https://docs.taro.zone/) + React 18 + TypeScript + Zustand 实现，一套代码可构建微信小程序与 H5。

## 它与三个开源仓库的关系

本项目在产品设计与算法上吸收了三个 star 数最高的专门数独开源仓库的特性：

| 开源项目 | 语言/形态 | 在本项目中的体现 |
| --- | --- | --- |
| [mayerui/sudoku](https://github.com/mayerui/sudoku) | C++ 极简数独 | `src/engine/` 以 TypeScript 重写其核心：随机回溯生成完整解、180° 对称挖洞、位掩码 + MRV 回溯的求解器与唯一解检测 |
| [LibreSudoku](https://github.com/kaajjo/Libre-Sudoku) | Kotlin + Jetpack Compose 安卓应用 | 辅助功能体系（高亮行列宫/相同数字、实时标错、自动清除候选、笔记、提示、检查、撤销重做）、三档棋盘主题、分难度战绩与连胜统计 |
| typescript-sudoku | TypeScript 类型体操 | 教程页「TypeScript 类型实验室」：用编译期类型（`Digit` 联合类型、`Includes`/`AllTrue`/`IsCompleteDigitRow`/`Assert`）表达数独行约束，并附 `@ts-expect-error` 编译期断言（`src/engine/type-lab.assertions.ts`） |

> 注：本项目为独立实现（clean-room rewrite），未直接复制上述仓库的源代码。

## 功能特性

- **三种棋盘规格**：4×4（2×2 宫）、6×6（2×3 宫）、9×9（3×3 宫），新手到进阶平滑过渡
- **五档难度**：简单 / 普通 / 困难 / 专家 / 大师，按线索比例与标准用时划分
- **自研出题引擎**：每题保证唯一解；挖洞采用 180° 中心对称布局，视觉更专业
- **每日挑战**：以日期字符串为种子（FNV-1a 哈希 + mulberry32），所有玩家当天同一题
- **完整对局工具**：填数、擦除、笔记（候选数）、提示、检查、撤销/重做、暂停/继续
- **智能辅助**：选中格联动高亮、相同数字高亮、错误实时标红、填对后自动清除同伴候选
- **战绩统计**：分难度的完成数、完成率、最佳/平均用时、星级、零错误次数、当前/最长连胜、每日挑战记录
- **三套棋盘主题**：经典白纸、午夜深蓝、护眼抹茶
- **TypeScript 类型实验室**：点击格子模拟修改类型字面量，实时查看「tsc 编译结果」
- **纯离线**：无任何网络请求与服务端依赖，所有数据仅保存在设备本地（Taro Storage）

## 技术栈

- Taro 4.1.9（跨端框架，目标：微信小程序 / H5）
- React 18 + TypeScript 5
- Zustand 4（状态管理与本地持久化）
- Sass CSS Modules（样式隔离）
- 零第三方数独库依赖，引擎全部手写且不依赖 DOM，可独立复用

## 目录结构

```
├── config/                 # Taro 构建配置
├── src/
│   ├── app.tsx             # 应用入口（启动时 hydration）
│   ├── app.config.ts       # 页面路由与 tabBar 配置
│   ├── assets/tabbar/      # tabBar 图标（SVG）
│   ├── engine/             # 纯逻辑数独引擎（无 Taro/React 依赖）
│   │   ├── types.ts        # 领域类型 + 编译期类型实验室类型
│   │   ├── rng.ts          # mulberry32 随机数与 FNV-1a 字符串哈希
│   │   ├── solver.ts       # 单元/邻居计算、位掩码 MRV 求解、冲突检测
│   │   ├── generator.ts    # 完整解生成 + 对称挖洞（唯一解保证）
│   │   ├── difficulty.ts   # 难度配置、标准用时、星级评定
│   │   ├── sudoku.ts       # 对局状态机（输入/笔记/提示/撤销/计时/胜负）
│   │   └── type-lab.assertions.ts  # tsc 编译期断言
│   ├── store/              # zustand stores：对局 / 设置 / 统计
│   ├── components/         # SudokuBoard、NumberPad、GameToolbar、WinModal 等
│   ├── pages/
│   │   ├── index/          # 首页：每日挑战、继续对局、规格/难度选择
│   │   ├── game/           # 对局页
│   │   ├── learn/          # 教程页：规则、技巧、类型实验室、4×4 练习
│   │   ├── stats/          # 统计页
│   │   └── settings/       # 设置页：辅助开关、主题、数据管理、致谢
│   ├── styles/             # 全局主题变量
│   └── utils/              # 存储、时间格式化、振动反馈
├── types/                  # 全局类型声明
├── package.json
└── project.config.json     # 微信开发者工具项目配置
```

## 引擎说明

- **求解器**：行/列/宫使用位掩码，回溯时以 MRV（最少候选格优先）选择分支，`countSolutions(limit=2)` 在挖到第二个解时立即退出，用于快速判定唯一解。
- **出题**：先用随机候选顺序回溯生成完整合法解，再按打乱顺序进行 180° 对称挖洞，每挖一组立即做唯一解检测，破坏唯一解则回滚，直到线索数落入难度区间。
- **难度**：由线索格比例区间决定，标准用时随棋盘规格缩放；三星条件为「零提示 + 错误不超过 2 次 + 用时不超过标准用时的 1.2 倍」。
- **状态机**：对局的每次操作生成不可变快照写入撤销栈（上限 200 步），退出页面自动暂停，恢复存档一律以暂停态进入以避免计时漂移。

## 快速开始

```bash
# 安装依赖（Node.js >= 18）
npm install

# H5 开发调试
npm run dev:h5

# 微信小程序：监听构建后用微信开发者工具打开项目根目录
npm run dev:weapp

# 生产构建
npm run build:weapp   # 微信小程序产物输出到 dist/
npm run build:h5      # H5 产物

# 仅做类型检查
npm run typecheck
```

微信开发者工具导入时选择项目根目录，AppID 可先使用测试号（`project.config.json` 默认为 `touristappid`），真机预览/上传前替换为你自己的 AppID。

## 数据与隐私

应用不发起任何网络请求。设置、战绩与未完成对局分别以以下键名保存在本地存储中：

- `sudoku_moments_settings_v1`
- `sudoku_moments_stats_v1`
- `sudoku_moments_current_v1`

在「设置 → 数据管理」中可随时清空对局或统计数据。

## 致谢

- [mayerui/sudoku](https://github.com/mayerui/sudoku)
- [LibreSudoku（kaajjo/Libre-Sudoku）](https://github.com/kaajjo/Libre-Sudoku)
- [Taro](https://github.com/NervJS/taro)

## 许可证

[MIT](./LICENSE)
