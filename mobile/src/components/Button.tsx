import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, shadows } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    if (disabled) return { backgroundColor: colors.surfaceLight, opacity: 0.6 };
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.secondary, ...shadows.sm };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.danger, ...shadows.sm };
      default:
        return { backgroundColor: colors.primary, ...shadows.sm };
    }
  };

  const getTextStyle = (): TextStyle => {
    if (disabled) return { color: colors.textDim };
    switch (variant) {
      case 'outline':
        return { color: colors.text, fontWeight: '700' };
      case 'ghost':
        return { color: colors.primary, fontWeight: '700' };
      default:
        return { color: '#FFFFFF', fontWeight: '700' };
    }
  };

  const getSizeStyle = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
          text: { fontSize: 13 },
        };
      case 'lg':
        return {
          button: { paddingVertical: 15, paddingHorizontal: 24, borderRadius: 12 },
          text: { fontSize: 16 },
        };
      default:
        return {
          button: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10 },
          text: { fontSize: 14 },
        };
    }
  };

  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        sizeStyle.button,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <Text style={styles.iconText}>{icon}</Text> : null}
          <Text style={[styles.text, sizeStyle.text, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    marginRight: 6,
    fontSize: 14,
  },
  text: {
    letterSpacing: -0.2,
  },
});

