import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius } from '../app/theme';
import { RootStackParamList, User } from '../app/types';
import useChat from '../hooks/useChat';
import socketService from '../services/socket';
import TopBar from '../components/TopBar';
import UserItem from '../components/UserItem';
import BottomNav from '../components/BottomNav';

type UsersScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Users'>;
};

const UsersScreen: React.FC<UsersScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { users, currentUser } = useChat();

  const renderUser = ({ item }: { item: User }) => (
    <UserItem user={item} />
  );

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
            <Text style={styles.bentoIcon}>📡</Text>
            <Text style={styles.bentoTitle}>Range</Text>
            <Text style={styles.bentoSubtitle}>Scanning 50m radius</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No users online</Text>
              <Text style={styles.emptySubtitle}>
                Invite others to join the chat
              </Text>
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

      <BottomNav activeTab="users" onTabPress={handleTabPress} />
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