import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius } from '../app/theme';
import { RootStackParamList, User } from '../app/types';
import useChat from '../hooks/useChat';
import socketService from '../services/socket';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

type UsersScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Users'>;
};

const UsersScreen: React.FC<UsersScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { users, currentUser, isHost, isConnected, kickUser } = useChat();

  const handleKick = (user: User) => {
    Alert.alert(
      'Kick user',
      `Remove ${user.username} from the chat?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kick',
          style: 'destructive',
          onPress: () => kickUser(user.username),
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUser?.id;
    return (
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {item.username}
            {isCurrentUser ? ' (you)' : ''}
          </Text>
          <Text style={styles.status}>{item.status || 'Online'}</Text>
        </View>
        {isHost && !isCurrentUser && (
          <TouchableOpacity style={styles.kickButton} onPress={() => handleKick(item)}>
            <Text style={styles.kickButtonText}>Kick</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleTabPress = (tab: 'host' | 'join' | 'chat' | 'users') => {
    switch (tab) {
      case 'host':
        navigation.navigate('Host', { username: currentUser?.username || 'User', serverIP: socketService.getIP() || '' });
        break;
      case 'join':
        navigation.navigate('Join', { username: currentUser?.username || 'User', serverIP: socketService.getIP() || '' });
        break;
      case 'chat':
        navigation.navigate('Chat', {});
        break;
    }
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Fluid Chat"
        subtitle="Nearby Users"
        onSettingsPress={() => {}}
      />

      <View style={styles.content}>
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCard}>
            <Text style={styles.bentoIcon}>📡</Text>
            <Text style={styles.bentoTitle}>Local Mesh</Text>
            <Text style={styles.bentoSubtitle}>Connected to main</Text>
          </View>
          <View style={styles.bentoCard}>
            <Text style={styles.bentoIcon}>👥</Text>
            <Text style={styles.bentoTitle}>{users.length} Online</Text>
            <Text style={styles.bentoSubtitle}>{isHost ? 'You are host' : 'Member'}</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No users online</Text>
              <Text style={styles.emptySubtitle}>Invite others to join the chat</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.userList}
            />
          )}
        </View>
      </View>

      <BottomNav activeTab="users" onTabPress={handleTabPress} isHost={isHost} isConnected={isConnected} />
    </View>
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
  bentoGrid: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors['outline-variant']}10`,
  },
  bentoIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors['on-surface'],
  },
  bentoSubtitle: {
    fontSize: 12,
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  userList: {
    paddingBottom: spacing.xxl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors['outline-variant']}20`,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors['on-primary'],
    fontWeight: '700',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: colors['on-surface'],
  },
  status: {
    fontSize: 12,
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  kickButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  kickButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors['on-surface'],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors['on-surface-variant'],
  },
});

export default UsersScreen;
