import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { BoardThemeName, GameState } from '@/engine/types';
import { computeConflicts, computePeers } from '@/engine/solver';
import styles from './index.module.scss';

interface SudokuBoardProps {
  game: GameState;
  theme: BoardThemeName;
  highlightPeers: boolean;
  highlightSameDigit: boolean;
  highlightMistakes: boolean;
  onSelect: (index: number) => void;
  onResume: () => void;
}

const THEME_CLASS: Record<BoardThemeName, string> = {
  classic: styles.themeClassic,
  midnight: styles.themeMidnight,
  matcha: styles.themeMatcha
};

const SIZE_FONT_CLASS: Record<number, string> = {
  4: styles.font4,
  6: styles.font6,
  9: styles.font9
};

function noteColumns(size: number): number {
  if (size === 4) return 2;
  return 3;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({
  game,
  theme,
  highlightPeers,
  highlightSameDigit,
  highlightMistakes,
  onSelect,
  onResume
}) => {
  const n = game.size;
  const total = n * n;

  const peers = useMemo(() => computePeers(game), [game.size, game.boxRows, game.boxCols]);
  const conflicts = useMemo(
    () => computeConflicts(game.values, game),
    [game.values, game.size, game.boxRows, game.boxCols]
  );

  const selectedValue = game.selected >= 0 ? game.values[game.selected] : 0;
  const peerSet = game.selected >= 0 ? new Set(peers[game.selected]) : new Set<number>();
  const cols = noteColumns(n);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / n);
    const c = i % n;
    const value = game.values[i];
    const isSelected = i === game.selected;
    const isPeer = !isSelected && peerSet.has(i);
    const isSame =
      !isSelected &&
      highlightSameDigit &&
      selectedValue !== 0 &&
      value === selectedValue;
    const isWrong =
      value !== 0 &&
      !game.givenMask[i] &&
      (conflicts[i] || (highlightMistakes && value !== game.solution[i]));
    const isGiven = game.givenMask[i];
    const isHinted = game.hintedMask[i] && !isGiven;
    const noteMask = game.notes[i];
    const noteDigits: number[] = [];
    if (value === 0 && noteMask !== 0) {
      for (let d = 1; d <= n; d++) {
        if ((noteMask & (1 << d)) !== 0) noteDigits.push(d);
      }
    }

    const cellClasses = classnames(
      styles.cell,
      SIZE_FONT_CLASS[n],
      (c + 1) % game.boxCols === 0 && c !== n - 1 && styles.thickRight,
      (r + 1) % game.boxRows === 0 && r !== n - 1 && styles.thickBottom,
      isSelected && styles.selected,
      isPeer && highlightPeers && styles.peer,
      isSame && styles.same,
      isWrong && styles.wrong
    );

    const textClasses = classnames(
      styles.digit,
      isGiven ? styles.givenText : isHinted ? styles.hintText : styles.userText,
      isWrong && styles.wrongText
    );

    cells.push(
      <View key={i} className={cellClasses} onClick={() => onSelect(i)}>
        {value !== 0 ? (
          <Text className={textClasses}>{value}</Text>
        ) : noteDigits.length > 0 ? (
          <View
            className={styles.notes}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: n }, (_, k) => k + 1).map((d) => (
              <Text key={d} className={styles.noteDigit}>
                {noteMask & (1 << d) ? d : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      className={classnames(styles.board, THEME_CLASS[theme], SIZE_FONT_CLASS[n])}
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
    >
      {cells}
      {game.status === 'paused' ? (
        <View className={styles.pauseOverlay}>
          <Text className={styles.pauseEmoji}>⏸</Text>
          <Text className={styles.pauseText}>对局已暂停</Text>
          <View className={styles.resumeButton} onClick={onResume}>
            <Text className={styles.resumeButtonText}>继续</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default SudokuBoard;
