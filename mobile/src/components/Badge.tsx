import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'sm' }) => {
  const getBadgeStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 };
      case 'secondary':
        return { backgroundColor: colors.secondaryLight, borderColor: colors.secondary, borderWidth: 1 };
      case 'accent':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: colors.accent, borderWidth: 1 };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 };
      default:
        return { backgroundColor: colors.badgeBg };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: colors.primary };
      case 'secondary':
        return { color: colors.secondary };
      case 'accent':
        return { color: colors.accent };
      case 'outline':
        return { color: colors.textMuted };
      default:
        return { color: colors.text };
    }
  };

  return (
    <View style={[styles.container, getBadgeStyle(), size === 'md' && styles.mdContainer]}>
      <Text style={[styles.text, getTextStyle(), size === 'md' && styles.mdText]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 6,
  },
  mdContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  mdText: {
    fontSize: 13,
  },
});
