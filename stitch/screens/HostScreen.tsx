import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadows } from '../app/theme';
import { RootStackParamList } from '../app/types';
import useChat from '../hooks/useChat';

type HostScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Host'>;
  route: RouteProp<RootStackParamList, 'Host'>;
};

const HostScreen: React.FC<HostScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { username, serverIP } = route.params;
  const {
    users,
    isConnected,
    connecting,
    error,
    startHost,
    clearError
  } = useChat();

  useEffect(() => {
    if (serverIP) {
      startHost(serverIP, username);
    }
  }, [serverIP]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: () => {
            clearError();
            navigation.goBack();
          }
        }
      ]);
    }
  }, [error]);

  useEffect(() => {
    if (isConnected) {
      navigation.replace('Chat', {});
    }
  }, [isConnected]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Chat</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.ipCard}>
          <Text style={styles.cardLabel}>Server IP Address</Text>
          <View style={styles.ipDisplay}>
            {connecting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : serverIP ? (
              <Text style={styles.ipText}>{serverIP}</Text>
            ) : (
              <Text style={styles.ipPlaceholder}>Enter server IP</Text>
            )}
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, isConnected ? styles.onlineDot : styles.offlineDot]} />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </Text>
            </View>
          </View>

          <Text style={styles.hint}>
            Share this IP with others to join the network. Ensure everyone is on the same local network.
          </Text>
        </View>

        <TouchableOpacity style={styles.mainButton} disabled={!isConnected}>
          <Text style={styles.mainButtonIcon}>🖥️</Text>
          <Text style={styles.mainButtonText}>Start Server</Text>
        </TouchableOpacity>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Connected Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>0.0<Text style={styles.statUnit}>kb/s</Text></Text>
            <Text style={styles.statLabel}>Network Load</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  ipCard: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  ipDisplay: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  ipText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ipPlaceholder: {
    fontSize: 18,
    color: colors['on-surface-variant'],
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors['surface-container-highest']}80`,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  onlineDot: {
    backgroundColor: colors.emerald,
  },
  offlineDot: {
    backgroundColor: colors.outline,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors['on-surface-variant'],
  },
  hint: {
    fontSize: 12,
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  mainButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.primary,
  },
  mainButtonIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors['on-primary'],
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: colors['surface-container-low'],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors['on-surface'],
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
});

export default HostScreen;