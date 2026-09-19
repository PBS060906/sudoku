import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export type ToolAction = 'undo' | 'redo' | 'erase' | 'notes' | 'hint' | 'check';

interface GameToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  noteMode: boolean;
  onAction: (action: ToolAction) => void;
}

interface ToolItem {
  key: ToolAction;
  icon: string;
  label: string;
  disabled?: boolean;
  active?: boolean;
}

const GameToolbar: React.FC<GameToolbarProps> = ({ canUndo, canRedo, noteMode, onAction }) => {
  const items: ToolItem[] = [
    { key: 'undo', icon: '↶', label: '撤销', disabled: !canUndo },
    { key: 'redo', icon: '↷', label: '重做', disabled: !canRedo },
    { key: 'erase', icon: '⌫', label: '橡皮' },
    { key: 'notes', icon: '✎', label: '笔记', active: noteMode },
    { key: 'hint', icon: '💡', label: '提示' },
    { key: 'check', icon: '✓', label: '检查' }
  ];

  return (
    <View className={styles.toolbar}>
      {items.map((item) => (
        <View
          key={item.key}
          className={classnames(
            styles.item,
            item.active && styles.itemActive,
            item.disabled && styles.itemDisabled
          )}
          onClick={() => {
            if (!item.disabled) onAction(item.key);
          }}
        >
          <Text className={styles.icon}>{item.icon}</Text>
          <Text className={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default GameToolbar;
