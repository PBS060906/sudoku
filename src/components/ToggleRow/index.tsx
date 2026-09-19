import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ToggleRowProps {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, desc, checked, onChange }) => {
  return (
    <View className={styles.row} onClick={() => onChange(!checked)}>
      <View className={styles.texts}>
        <Text className={styles.label}>{label}</Text>
        {desc ? <Text className={styles.desc}>{desc}</Text> : null}
      </View>
      <View className={classnames(styles.switch, checked && styles.switchOn)}>
        <View className={classnames(styles.knob, checked && styles.knobOn)} />
      </View>
    </View>
  );
};

export default ToggleRow;
