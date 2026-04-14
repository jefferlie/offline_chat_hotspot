import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Animated, Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, shadows } from '../app/theme';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onSendVoice: (uri: string, duration: number) => void;
  onSendImage: (imageData: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
}

const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  onSendVoice,
  onSendImage,
  onTyping,
  placeholder = 'Type a message...',
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (value: string) => {
    setText(value);
    if (onTyping) {
      onTyping(value.length > 0);
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      timerRef.current = setTimeout(async () => {
        await stopRecording();
      }, 60000);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setIsRecording(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = recordingDuration;

      setRecording(null);
      setRecordingDuration(0);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri && duration > 0) {
        onSendVoice(uri, duration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      onSendImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      onSendImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleAddPress = () => {
    Alert.alert(
      'Send Media',
      'Choose an option',
      [
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity style={styles.emojiButton}>
          <Text style={styles.emojiIcon}>😊</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.recordingActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
            </Animated.View>
          ) : (
            <Text style={styles.micIcon}>🎤</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },
  addButton: {
    padding: spacing.sm,
  },
  addIcon: {
    fontSize: 24,
    color: colors['on-surface-variant'],
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors['on-surface'],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    maxHeight: 100,
  },
  emojiButton: {
    padding: spacing.sm,
  },
  emojiIcon: {
    fontSize: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors['surface-container-high'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: colors.error,
  },
  micIcon: {
    fontSize: 20,
  },
  recordingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors['on-error'],
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors['surface-container-high'],
    shadowOpacity: 0,
  },
  sendIcon: {
    fontSize: 20,
    color: colors['on-primary'],
  },
});

export default InputBar;