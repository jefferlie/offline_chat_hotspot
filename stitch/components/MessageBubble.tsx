import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Animated, Image, Alert } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, spacing, borderRadius } from '../app/theme';
import { Message } from '../app/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSenderName?: boolean;
  onEdit?: (messageId: string, currentContent: string) => void;
  onDelete?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSenderName = true,
  onEdit,
  onDelete,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (message.type === 'voice' && message.audioUri) {
      loadSound();
    }
  }, [message]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.audioUri },
        { shouldPlay: false },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        }
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleLongPress = () => {
    if (!isOwn || message.deleted) return;
    const options: { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[] = [];

    if (message.type === 'text') {
      options.push({
        text: 'Edit',
        onPress: () => onEdit?.(message.id, message.content),
      });
    }
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        Alert.alert('Delete message', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(message.id) },
        ]);
      },
    });
    options.push({ text: 'Cancel', style: 'cancel', onPress: () => {} });

    Alert.alert('Message', undefined, options);
  };

  if (message.deleted) {
    return (
      <Animated.View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer, { opacity: fadeAnim }]}>
        <View style={[styles.bubble, styles.deletedBubble]}>
          <Text style={styles.deletedText}>Message deleted</Text>
        </View>
        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
          {formatTimestamp(message.timestamp)}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer, { opacity: fadeAnim }]}>
      {showSenderName && !isOwn && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}

      <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={400}>
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          {message.type === 'voice' ? (
            <View style={styles.voiceContainer}>
              <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
                <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>
              <View style={styles.waveformContainer}>
                {[...Array(15)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: `${30 + Math.random() * 40}%`,
                        backgroundColor: isOwn ? colors['on-primary'] : colors['on-surface'],
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.duration, isOwn ? styles.ownText : styles.otherText]}>
                {message.audioDuration ? formatTime(message.audioDuration * 1000) : '0:00'}
              </Text>
            </View>
          ) : message.type === 'image' && message.imageData ? (
            <Image
              source={{ uri: message.imageData }}
              style={styles.imageContent}
              resizeMode="cover"
            />
          ) : (
            <Text style={[styles.content, isOwn ? styles.ownText : styles.otherText]}>
              {message.content}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>

      <View style={[styles.metaRow, isOwn ? styles.ownMetaRow : styles.otherMetaRow]}>
        {message.edited && (
          <Text style={styles.editedLabel}>edited · </Text>
        )}
        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
          {formatTimestamp(message.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors['on-surface-variant'],
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  bubble: {
    padding: spacing.md,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  otherBubble: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deletedBubble: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deletedText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors['on-surface-variant'],
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownText: {
    color: colors['on-primary'],
  },
  otherText: {
    color: colors['on-surface'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ownMetaRow: {
    justifyContent: 'flex-end',
  },
  otherMetaRow: {
    justifyContent: 'flex-start',
    marginLeft: spacing.md,
  },
  editedLabel: {
    fontSize: 10,
    color: colors['on-surface-variant'],
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '500',
  },
  ownTimestamp: {
    color: colors['on-surface-variant'],
  },
  otherTimestamp: {
    color: colors['on-surface-variant'],
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    marginHorizontal: spacing.sm,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
  duration: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 35,
  },
  imageContent: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
});

export default MessageBubble;
