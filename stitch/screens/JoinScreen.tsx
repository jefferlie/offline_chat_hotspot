import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadows } from '../app/theme';
import { RootStackParamList } from '../app/types';
import useChat from '../hooks/useChat';

type JoinScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Join'>;
  route: RouteProp<RootStackParamList, 'Join'>;
};

const JoinScreen: React.FC<JoinScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { username, serverIP } = route.params;
  const {
    isConnected,
    connecting,
    error,
    joinChat,
    clearError
  } = useChat();

  useEffect(() => {
    joinChat(serverIP, username);
  }, [serverIP, username]);

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
        <Text style={styles.title}>Connect to Hub</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.ipGroup}>
            <Text style={styles.label}>Server IP Address</Text>
            <View style={styles.ipDisplay}>
              <Text style={styles.ipText}>{serverIP}</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {connecting ? 'Connecting...' : isConnected ? 'Connected!' : 'Connection failed'}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.joinButton, connecting && styles.joinButtonDisabled]} 
            disabled={connecting || isConnected}
          >
            <Text style={styles.joinButtonText}>Join Chat</Text>
            <Text style={styles.joinIcon}>🔗</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  ipGroup: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors['on-surface-variant'],
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  ipDisplay: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  ipText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  statusContainer: {
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors['on-surface-variant'],
  },
  joinButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    width: '100%',
    ...shadows.primary,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors['on-primary'],
    marginRight: spacing.sm,
  },
  joinIcon: {
    fontSize: 18,
  },
});

export default JoinScreen;