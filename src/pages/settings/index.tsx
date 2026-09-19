import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useGameStore, useSettingsStore, useStatsStore } from '@/store';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/engine/difficulty';
import type { BoardSize, BoardThemeName, DifficultyLevel } from '@/engine/types';
import SectionHeader from '@/components/SectionHeader';
import ToggleRow from '@/components/ToggleRow';
import styles from './index.module.scss';

const THEME_OPTIONS: { value: BoardThemeName; label: string; swatch: string }[] = [
  { value: 'classic', label: '经典白纸', swatch: 'linear-gradient(135deg,#ffffff 60%,#4f46e5 60%)' },
  { value: 'midnight', label: '午夜深蓝', swatch: 'linear-gradient(135deg,#111827 60%,#a5b4fc 60%)' },
  { value: 'matcha', label: '护眼抹茶', swatch: 'linear-gradient(135deg,#f7faf5 60%,#15803d 60%)' }
];

const SIZE_OPTIONS: BoardSize[] = [4, 6, 9];

const CREDITS: { repo: string; desc: string; url: string }[] = [
  {
    repo: 'mayerui/sudoku',
    desc: 'C++ 极简数独：本项目的出题/求解引擎以 TypeScript 重写',
    url: 'https://github.com/mayerui/sudoku'
  },
  {
    repo: 'LibreSudoku',
    desc: 'Kotlin + Compose 安卓数独：辅助功能与统计体系的灵感来源',
    url: 'https://github.com/kaajjo/Libre-Sudoku'
  },
  {
    repo: 'typescript-sudoku',
    desc: '类型系统数独：编译期类型校验与「类型实验室」的灵感来源',
    url: 'https://github.com/search?q=typescript-sudoku&type=repositories'
  }
];

const SettingsPage: React.FC = () => {
  const settings = useSettingsStore();
  const statsActions = useStatsStore();
  const game = useGameStore((s) => s.game);
  const clearCurrent = useGameStore((s) => s.clearCurrent);

  const copyLink = (url: string) => {
    Taro.setClipboardData({
      data: url,
      success: () => Taro.showToast({ title: '链接已复制', icon: 'none' })
    });
  };

  const resetCurrent = () => {
    Taro.showModal({
      title: '清空当前对局',
      content: '未完成的棋盘与计时将被删除，确定吗？',
      confirmText: '清空',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          clearCurrent();
          Taro.showToast({ title: '已清空对局', icon: 'none' });
        }
      }
    });
  };

  const resetStats = () => {
    Taro.showModal({
      title: '清空统计数据',
      content: '所有战绩与连胜记录将被删除，确定吗？',
      confirmText: '清空',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          statsActions.reset();
          Taro.showToast({ title: '统计已重置', icon: 'none' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>游戏设置</Text>
        <Text className={styles.headerDesc}>按你的习惯配置辅助功能</Text>
      </View>

      <View className={styles.section}>
        <SectionHeader title="辅助功能" desc="对应 LibreSudoku 的 Assist 选项" />
        <View className={styles.card}>
          <ToggleRow
            label="高亮行列宫"
            desc="选中格子时高亮同行、同列、同宫"
            checked={settings.highlightPeers}
            onChange={() => settings.toggle('highlightPeers')}
          />
          <View className={styles.divider} />
          <ToggleRow
            label="高亮相同数字"
            desc="棋盘上与选中格相同的数字一并高亮"
            checked={settings.highlightSameDigit}
            onChange={() => settings.toggle('highlightSameDigit')}
          />
          <View className={styles.divider} />
          <ToggleRow
            label="标记错误"
            desc="填入的数字与答案不符时立即标红"
            checked={settings.highlightMistakes}
            onChange={() => settings.toggle('highlightMistakes')}
          />
          <View className={styles.divider} />
          <ToggleRow
            label="自动清除候选"
            desc="填对数字后，自动删除同伴格中的该候选"
            checked={settings.autoRemoveNotes}
            onChange={() => settings.toggle('autoRemoveNotes')}
          />
          <View className={styles.divider} />
          <ToggleRow
            label="显示计时器"
            desc="对局页顶部显示用时"
            checked={settings.showTimer}
            onChange={() => settings.toggle('showTimer')}
          />
          <View className={styles.divider} />
          <ToggleRow
            label="振动反馈"
            desc="输入、错误等操作时轻微振动"
            checked={settings.hapticEnabled}
            onChange={() => settings.toggle('hapticEnabled')}
          />
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="棋盘主题" desc="只改变棋盘区域配色" />
        <View className={styles.themeRow}>
          {THEME_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={styles.themeItem}
              onClick={() => settings.update({ boardTheme: option.value })}
            >
              <View
                className={classnames(
                  styles.swatch,
                  settings.boardTheme === option.value && styles.swatchActive
                )}
                style={{ background: option.swatch }}
              >
                <View className={styles.swatchInner} />
              </View>
              <Text
                className={classnames(
                  styles.themeLabel,
                  settings.boardTheme === option.value && styles.themeLabelActive
                )}
              >
                {option.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="默认开局" desc="首页默认选中的规格与难度" />
        <View className={styles.card}>
          <View className={styles.optionBlock}>
            <Text className={styles.optionLabel}>棋盘规格</Text>
            <View className={styles.chips}>
              {SIZE_OPTIONS.map((size) => (
                <View
                  key={size}
                  className={classnames(
                    styles.chip,
                    settings.defaultSize === size && styles.chipActive
                  )}
                  onClick={() => settings.update({ defaultSize: size })}
                >
                  <Text
                    className={classnames(
                      styles.chipText,
                      settings.defaultSize === size && styles.chipTextActive
                    )}
                  >
                    {size}×{size}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View className={styles.divider} />
          <View className={styles.optionBlock}>
            <Text className={styles.optionLabel}>难度</Text>
            <View className={styles.chips}>
              {DIFFICULTY_ORDER.map((level: DifficultyLevel) => (
                <View
                  key={level}
                  className={classnames(
                    styles.chip,
                    settings.defaultLevel === level && styles.chipActive
                  )}
                  onClick={() => settings.update({ defaultLevel: level })}
                >
                  <Text
                    className={classnames(
                      styles.chipText,
                      settings.defaultLevel === level && styles.chipTextActive
                    )}
                  >
                    {DIFFICULTIES[level].label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="数据管理" desc="所有数据仅保存在本机" />
        <View className={styles.card}>
          <View className={styles.actionRow} onClick={resetCurrent}>
            <Text className={styles.actionText}>清空当前对局</Text>
            <Text className={styles.actionStatus}>{game ? '有未完成对局' : '无对局'}</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.actionRow} onClick={resetStats}>
            <Text className={styles.actionText}>清空统计数据</Text>
            <Text className={styles.actionArrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="关于与致谢" desc="站在三个优秀开源项目的肩膀上" />
        {CREDITS.map((credit) => (
          <View key={credit.repo} className={styles.creditCard} onClick={() => copyLink(credit.url)}>
            <View className={styles.creditHead}>
              <Text className={styles.creditRepo}>{credit.repo}</Text>
              <Text className={styles.creditLinkIcon}>🔗</Text>
            </View>
            <Text className={styles.creditDesc}>{credit.desc}</Text>
            <Text className={styles.creditUrl}>{credit.url}</Text>
          </View>
        ))}
        <Text className={styles.version}>数独时光 v1.0.0 · Taro 4 · 纯离线</Text>
      </View>
    </View>
  );
};

export default SettingsPage;
