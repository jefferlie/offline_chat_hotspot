import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../app/theme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  showSearch?: boolean;
  onSettingsPress?: () => void;
  onSearchPress?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  avatar,
  showSearch = false,
  onSettingsPress,
  onSearchPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatar}</Text>
            </View>
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>👤</Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.rightSection}>
        {showSearch && (
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
          <Text style={styles.icon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  defaultAvatar: {
    backgroundColor: colors['surface-container-highest'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  defaultAvatarText: {
    fontSize: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  icon: {
    fontSize: 18,
  },
});

export default TopBar;