import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, shadows } from '../app/theme';
import { RootStackParamList } from '../app/types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const LAST_USERNAME_KEY = 'fluid_chat:last_username';
  const LAST_SERVER_IP_KEY = 'fluid_chat:last_server_ip';
  const HOST_LOOPBACK_IP = '127.0.0.1';

  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [ipAddress, setIpAddress] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadSavedInputs = async () => {
      try {
        const values = await AsyncStorage.multiGet([LAST_USERNAME_KEY, LAST_SERVER_IP_KEY]);
        const savedUsername = values.find(([key]) => key === LAST_USERNAME_KEY)?.[1] || '';
        const savedIp = values.find(([key]) => key === LAST_SERVER_IP_KEY)?.[1] || '';

        if (!mounted) return;
        if (savedUsername) setUsername(savedUsername);
        if (savedIp) setIpAddress(savedIp);
      } catch (error) {
        console.error('Failed to load saved inputs:', error);
      }
    };

    loadSavedInputs();

    return () => {
      mounted = false;
    };
  }, []);

  const persistInputs = async (name: string, ip: string) => {
    try {
      await AsyncStorage.multiSet([
        [LAST_USERNAME_KEY, name],
        [LAST_SERVER_IP_KEY, ip],
      ]);
    } catch (error) {
      console.error('Failed to save inputs:', error);
    }
  };

  const handleHost = async () => {
    const normalizedUsername = username.trim();
    const normalizedIp = ipAddress.trim();

    if (!normalizedUsername) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    await persistInputs(normalizedUsername, normalizedIp);
    navigation.navigate('Host', { username: normalizedUsername, serverIP: HOST_LOOPBACK_IP });
  };

  const handleJoin = async () => {
    const normalizedUsername = username.trim();
    const normalizedIp = ipAddress.trim();

    if (!normalizedUsername) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!normalizedIp) {
      Alert.alert('Required', 'Please enter the host IP address');
      return;
    }

    await persistInputs(normalizedUsername, normalizedIp);
    navigation.navigate('Join', { username: normalizedUsername, serverIP: normalizedIp });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl * 2 }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💬</Text>
          </View>
          <Text style={styles.title}>Fluid Chat</Text>
          <Text style={styles.subtitle}>
            Connect offline with nearby peers
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your name"
              placeholderTextColor={colors.outline}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Server IP Address (for Join)</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="e.g. 192.168.43.1"
              placeholderTextColor={colors.outline}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.helperText}>For Host on this same phone we use localhost automatically.</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleJoin}>
            <Text style={styles.primaryButtonText}>Join Chat</Text>
            <Text style={styles.buttonIcon}>🔗</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleHost}>
            <Text style={styles.secondaryButtonIcon}>🖥️</Text>
            <Text style={styles.secondaryButtonText}>Start as Host</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Zero Latency</Text>
            <Text style={styles.featureDescription}>
              Optimized for peer-to-peer local connections
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureTitle}>Encrypted</Text>
            <Text style={styles.featureDescription}>
              Your data never leaves local network
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors['on-surface-variant'],
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors['on-surface'],
    borderWidth: 1,
    borderColor: `${colors['outline-variant']}33`,
  },
  helperText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    fontSize: 11,
    color: colors['on-surface-variant'],
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    ...shadows.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors['on-primary'],
    marginRight: spacing.sm,
  },
  buttonIcon: {
    fontSize: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${colors['outline-variant']}30`,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: spacing.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors['surface-container-high'],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
  },
  featureItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors['on-surface'],
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: 10,
    color: colors['on-surface-variant'],
    lineHeight: 14,
  },
});

export default HomeScreen;
