import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const initNotifications = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0058bc',
        sound: 'default',
      });
    }

    if (initialized) {
      const perms = await Notifications.getPermissionsAsync();
      return perms.status === 'granted';
    }

    initialized = true;

    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch (error) {
    console.error('Notifications init error:', error);
    return false;
  }
};

export const notifyIncomingMessage = async (senderName: string, messageText: string): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: senderName,
        body: messageText,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Notification schedule error:', error);
  }
};

export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.error('Expo push token error:', error);
    return null;
  }
};
