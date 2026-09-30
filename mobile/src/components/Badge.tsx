import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'outline' | 'success' | 'danger' | 'info';
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'sm', showDot = false }) => {
  const getBadgeStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
      case 'success':
        return { backgroundColor: colors.primaryLight, borderColor: 'rgba(5, 150, 105, 0.25)', borderWidth: 1 };
      case 'secondary':
        return { backgroundColor: colors.secondaryLight, borderColor: 'rgba(79, 70, 229, 0.25)', borderWidth: 1 };
      case 'accent':
        return { backgroundColor: colors.accentLight, borderColor: 'rgba(217, 119, 6, 0.25)', borderWidth: 1 };
      case 'danger':
        return { backgroundColor: colors.dangerLight, borderColor: 'rgba(220, 38, 38, 0.25)', borderWidth: 1 };
      case 'info':
        return { backgroundColor: 'rgba(2, 132, 199, 0.12)', borderColor: 'rgba(2, 132, 199, 0.25)', borderWidth: 1 };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 };
      default:
        return { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'success':
        return { color: colors.primaryDark };
      case 'secondary':
        return { color: colors.secondaryDark };
      case 'accent':
        return { color: colors.accent };
      case 'danger':
        return { color: colors.danger };
      case 'info':
        return { color: colors.info };
      case 'outline':
        return { color: colors.textMuted };
      default:
        return { color: colors.textMuted };
    }
  };

  const getDotColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'success':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'accent':
        return colors.accent;
      case 'danger':
        return colors.danger;
      case 'info':
        return colors.info;
      default:
        return colors.textDim;
    }
  };

  return (
    <View style={[styles.container, getBadgeStyle(), size === 'md' && styles.mdContainer]}>
      {showDot && (
        <View style={[styles.dot, { backgroundColor: getDotColor() }]} />
      )}
      <Text style={[styles.text, getTextStyle(), size === 'md' && styles.mdText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999, // Pill shape
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 4,
  },
  mdContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  mdText: {
    fontSize: 12,
  },
});

