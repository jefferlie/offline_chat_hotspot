import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../app/theme';

interface BottomNavProps {
  activeTab: 'host' | 'join' | 'chat' | 'users';
  onTabPress: (tab: 'host' | 'join' | 'chat' | 'users') => void;
  isHost?: boolean;
  isConnected?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress, isHost, isConnected }) => {
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: 'host' as const, label: 'Host', icon: '🖥️' },
    { key: 'join' as const, label: 'Join', icon: '🔗' },
    { key: 'chat' as const, label: 'Chat', icon: '💬' },
    { key: 'users' as const, label: 'Users', icon: '👥' },
  ];

  // Если пользователь подключён но не хост — кнопка Host недоступна
  const isHostDisabled = isConnected && !isHost;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isDisabled = tab.key === 'host' && isHostDisabled;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab, isDisabled && styles.disabledTab]}
            onPress={() => !isDisabled && onTabPress(tab.key)}
            disabled={isDisabled}
          >
            <Text style={[styles.tabIcon, isActive && styles.activeTabIcon, isDisabled && styles.disabledIcon]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel, isDisabled && styles.disabledLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 88, 188, 0.1)',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  activeTabIcon: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors['on-surface-variant'],
  },
  activeTabLabel: {
    color: colors.primary,
  },
  disabledTab: {
    opacity: 0.35,
  },
  disabledIcon: {},
  disabledLabel: {
    color: colors['on-surface-variant'],
  },
});

export default BottomNav;