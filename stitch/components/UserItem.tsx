import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../app/theme';
import { User } from '../app/types';

interface UserItemProps {
  user: User;
  onPress?: (user: User) => void;
  showStatus?: boolean;
}

const UserItem: React.FC<UserItemProps> = ({ user, onPress, showStatus = true }) => {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const hasImage = user.avatar && user.avatar.length > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(user)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {hasImage ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarImage}>{user.avatar}</Text>
          </View>
        ) : (
          <View style={[styles.avatar, styles.initialsAvatar]}>
            <Text style={styles.initials}>{getInitials(user.username)}</Text>
          </View>
        )}
        {showStatus && (
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, user.isOnline ? styles.onlineDot : styles.offlineDot]} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.username} numberOfLines={1}>
          {user.username}
        </Text>
        <Text style={styles.status} numberOfLines={1}>
          {user.status || (user.isOnline ? 'Online' : 'Offline')}
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <Text style={styles.actionText}>Open Chat</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  initialsAvatar: {
    backgroundColor: colors['secondary-container'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 18,
    fontWeight: '700',
    color: colors['on-secondary-container'],
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors['surface-container-lowest'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineDot: {
    backgroundColor: colors.emerald,
  },
  offlineDot: {
    backgroundColor: colors['outline-variant'],
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: colors['on-surface'],
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    color: colors['on-surface-variant'],
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 18,
    color: colors.primary,
    marginLeft: 2,
  },
});

export default UserItem;