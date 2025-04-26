import { Audio } from 'expo-av';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { getSuggestions, trackEmotionPattern } from './suggestionService';
import { speakSuggestions } from './speechService';
import BreakdownDetectionService from './breakdownDetection';

// Use environment variable or fallback to local IP address
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.76.160:8000';
const MAX_RECORDING_DURATION = 60; // 60 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Configure axios defaults
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'multipart/form-data';
axios.defaults.timeout = 30000; // 30 seconds timeout

let recording: Audio.Recording | null = null;
let isRecording = false;
let recordingTimer: NodeJS.Timeout | null = null;
let startSound: Audio.Sound | null = null;

// Initialize the start sound
const loadStartSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/start-beep.mp3'),
      { volume: 1.0 }
    );
    startSound = sound;
  } catch (error) {
    console.error('Failed to load start sound:', error);
  }
};

// Helper function to check server health
const checkServerHealth = async (retryCount = 0): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.status === 200;
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return checkServerHealth(retryCount + 1);
    }
    throw new Error('Server is not available. Please try again later.');
  }
};

// Load sound when module is imported
loadStartSound();

export const startRecording = async () => {
  try {
    // Check if already recording
    if (isRecording) {
      throw new Error('Recording already in progress');
    }

    // Play start sound
    if (startSound) {
      try {
        await startSound.replayAsync();
      } catch (error) {
        console.error('Failed to play start sound:', error);
      }
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection available');
    }

    // Check server health with retry
    await checkServerHealth();

    // Request permissions
    const permissionResponse = await Audio.requestPermissionsAsync();
    if (!permissionResponse.granted) {
      throw new Error('Permission to record was denied');
    }

    // Set audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: 1, // INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
      shouldDuckAndroid: true,
    });

    // Create and start recording
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    if (!newRecording) {
      throw new Error('Failed to create recording');
    }

    recording = newRecording;
    isRecording = true;

    // Set up recording duration limit
    recordingTimer = setTimeout(async () => {
      if (isRecording) {
        await stopRecording();
      }
    }, MAX_RECORDING_DURATION * 1000);

    return true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    isRecording = false;
    recording = null;
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      recordingTimer = null;
    }
    throw error;
  }
};

export const stopRecording = async () => {
  try {
    if (!recording || !isRecording) {
      throw new Error('No recording in progress');
    }

    // Clear recording timer
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      recordingTimer = null;
    }

    // Stop recording
    isRecording = false;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    if (!uri) {
      throw new Error('No recording URI available');
    }

    console.log('Debug: Recording URI:', uri);

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection available');
    }

    console.log('Debug: Network is connected');

    // Create form data with audio file
    const formData = new FormData();
    const fileInfo = {
      uri: uri,
      type: 'audio/x-m4a',
      name: 'recording.m4a'
    };
    console.log('Debug: File info:', fileInfo);

    // @ts-ignore - React Native specific FormData implementation
    formData.append('file', fileInfo);
    console.log('Debug: FormData created');

    try {
      console.log('Debug: Starting file upload...');
      // Send to backend for analysis with retry mechanism
      let retryCount = 0;
      let lastError = null;

      while (retryCount < MAX_RETRY_ATTEMPTS) {
        try {
          const response = await axios.post(`${API_URL}/analyze-audio`, formData, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
            },
            transformRequest: (data, headers) => {
              console.log('Debug: Transform request called');
              return formData;
            },
            timeout: 30000,
          });
          console.log('Debug: Upload successful');

          // Handle empty transcription
          if (!response.data.transcription) {
            throw new Error('No speech detected in the recording');
          }

          // Validate emotion detection
          const text = response.data.transcription.toLowerCase();
          const detectedEmotion = response.data.emotion.label;
          const confidence = response.data.emotion.score;

          // Check for mismatches between text sentiment and detected emotion
          const negativeWords = ['not', 'no', 'never', "don't", 'cant', "can't", 'wont', "won't", 'bad', 'sad', 'angry', 'upset', 'terrible', 'horrible', 'sick', 'ill', 'pain'];
          const positiveWords = ['happy', 'joy', 'great', 'good', 'wonderful', 'amazing', 'excellent', 'fantastic'];
          
          const hasNegativeWords = negativeWords.some(word => text.includes(word));
          const hasPositiveWords = positiveWords.some(word => text.includes(word));

          // Adjust emotion if there's a clear mismatch
          let adjustedEmotion = detectedEmotion;
          let adjustedConfidence = confidence;

          if (hasNegativeWords && (detectedEmotion === 'joy' || detectedEmotion === 'happy')) {
            console.log('Debug: Detected negative words in supposedly positive emotion, adjusting...');
            adjustedEmotion = 'sad';
            adjustedConfidence = 0.7; // Lower confidence for adjusted emotion
          }

          if (hasPositiveWords && (detectedEmotion === 'sad' || detectedEmotion === 'fear')) {
            console.log('Debug: Detected positive words in supposedly negative emotion, adjusting...');
            adjustedEmotion = 'happy';
            adjustedConfidence = 0.7;
          }

          const analysis = {
            text: response.data.transcription,
            emotion: adjustedEmotion,
            confidence: adjustedConfidence,
            warning: response.data.warning
          };

          console.log('Debug: Emotion Analysis:', {
            originalEmotion: detectedEmotion,
            adjustedEmotion: adjustedEmotion,
            hasNegativeWords,
            hasPositiveWords,
            confidence: adjustedConfidence
          });

          // Get suggestions
          const suggestions = getSuggestions(analysis);
          console.log('Debug: Generated Suggestions:', suggestions);
          const pattern = trackEmotionPattern(analysis);

          // Check for breakdown conditions
          const breakdownService = BreakdownDetectionService.getInstance();
          const isNegativeEmotion = ['sad', 'angry', 'fear', 'anxious', 'neutral'].includes(adjustedEmotion);
          const highIntensity = adjustedConfidence > 0.5;
          const hasHighStress = hasNegativeWords && (
            text.includes('stress') || 
            text.includes('anxious') || 
            text.includes('worried') ||
            text.includes('angry') ||
            text.includes('sad') ||
            text.includes('upset') ||
            text.includes('frustrated')
          );

          if (isNegativeEmotion && (highIntensity || hasHighStress)) {
            console.log('Debug: Breakdown detected, notifying caregiver...');
            await breakdownService.updateMetrics(
              highIntensity ? 90 : 70,
              hasHighStress ? 90 : 70
            );
          }

          // Speak the suggestions
          await speakSuggestions(analysis);

          return {
            ...analysis,
            suggestions,
            pattern,
            isBreakdown: isNegativeEmotion && (highIntensity || hasHighStress)
          };
        } catch (error) {
          lastError = error;
          retryCount++;
          if (retryCount < MAX_RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }

      throw lastError || new Error('Failed to analyze audio after multiple attempts');
    } catch (error) {
      console.error('Error in stopRecording:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in stopRecording:', error);
    throw error;
  }
};

export const isCurrentlyRecording = () => isRecording;

export const getRemainingTime = () => {
  if (!isRecording || !recordingTimer) return 0;
  return MAX_RECORDING_DURATION;
};

export const cancelRecording = async () => {
  try {
    if (recording && isRecording) {
      await recording.stopAndUnloadAsync();
      recording = null;
      isRecording = false;
    }
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      recordingTimer = null;
    }
  } catch (error) {
    console.error('Error canceling recording:', error);
    throw error;
  }
};

export const cleanup = async () => {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      recordingTimer = null;
    }
    if (startSound) {
      await startSound.unloadAsync();
      startSound = null;
    }
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
};

export const analyzeEmotion = async (text: string) => {
  try {
    const response = await axios.post(`${API_URL}/analyze-text`, { text });
    return response.data;
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
};