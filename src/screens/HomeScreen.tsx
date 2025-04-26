import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated, Vibration, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { startRecording, stopRecording, isCurrentlyRecording } from '../services/emotionAnalysis';
import * as Speech from 'expo-speech';
import { EmotionAnalysis } from '../services/suggestionService';
import { saveEmotionAnalysis } from '../services/emotionHistoryService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

interface EmotionResult extends EmotionAnalysis {
  suggestions: {
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  };
  followUpQuestions: string[];
  pattern: {
    primaryEmotion: string;
    frequency: number;
    commonTriggers: string[];
    suggestedLongTermActions: string[];
  } | null;
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [speechInput, setSpeechInput] = useState('');
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userNickname, setUserNickname] = useState('User');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserNickname(userData.nickname || 'User');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Stop pulse animation
      pulseAnim.setValue(1);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpeechInput = async () => {
    try {
      animateButton();
      
      if (isRecording) {
        setIsLoading(true);
        // Vibrate for end
        Vibration.vibrate(100);
        
        try {
          const result = await stopRecording();
          if (result) {
            setSpeechInput(result.text);
            setEmotionResult(result as EmotionResult);
            
            // Save to emotion history
            await saveEmotionAnalysis({
              id: '', // Will be set by Firestore
              userId: auth.currentUser?.uid || '',
              timestamp: new Date(),
              text: result.text,
              emotion: result.emotion,
              confidence: result.confidence,
              suggestions: result.suggestions,
              triggers: [], // Can be added later if needed
            });

            // Provide audio feedback
            await Speech.speak('Analysis complete', {
              language: 'en',
              pitch: 1.0,
              rate: 0.9
            });
          }
        } catch (error: any) {
          console.error('Error in stopRecording:', error);
          Alert.alert(
            'Error',
            error?.message || 'Failed to analyze recording. Please try again.'
          );
        } finally {
          setIsRecording(false);
          setIsLoading(false);
        }
      } else {
        setSpeechInput('');
        setEmotionResult(null);
        // Vibrate for start
        Vibration.vibrate(50);
        
        try {
          await startRecording();
          setIsRecording(true);
          // Provide audio feedback
          await Speech.speak(' ', {
            language: 'en',
            pitch: 1.0,
            rate: 0.9
          });
        } catch (error: any) {
          console.error('Error in startRecording:', error);
          Alert.alert(
            'Error',
            error?.message || 'Failed to start recording. Please try again.'
          );
          setIsRecording(false);
        }
      }
    } catch (error: any) {
      console.error('Error in handleSpeechInput:', error);
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      );
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A38ED6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* Fixed Header */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EmotionHistory')}
          style={styles.iconButton}
        >
          <Ionicons name="menu" size={28} color="#223843" />
        </TouchableOpacity>

        <Text style={styles.greeting}>Hello, {userNickname}!</Text>

        <View style={styles.topBarIcons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('EmergencyHelp')}
            style={[styles.iconButton, styles.emergencyButton]}
          >
            <Ionicons name="warning" size={28} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Community' as never)}
            style={[styles.iconButton, styles.communityButton]}
          >
            <Ionicons name="people" size={28} color="#223843" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProfileScreen' as never)}
            style={[styles.iconButton, styles.profileButton]}
          >
            <Ionicons name="person-circle" size={30} color="#223843" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Emotion Prompt */}
        <View style={styles.promptContainer}>
          <Text style={styles.prompt}>How are you feeling today?</Text>
          <Text style={styles.promptSubtext}>Share your emotions with us</Text>
        </View>

        {/* Recording Timer */}
        {isRecording && (
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={20} color="#223843" />
            <Text style={styles.timerText}>
              Recording: {formatTime(recordingTime)}
            </Text>
          </View>
        )}

        {/* Speech Input Button */}
        <Animated.View style={[
          styles.speechButtonContainer,
          { transform: [{ scale: isRecording ? pulseAnim : scaleAnim }] }
        ]}>
          <TouchableOpacity 
            style={[styles.speechButton, isRecording && styles.speechButtonActive]} 
            onPress={handleSpeechInput}
          >
            {isRecording ? (
              <Ionicons name="mic" size={36} color="#FFFFFF" />
            ) : (
              <Ionicons name="mic-outline" size={36} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Speech Input Display */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={speechInput}
            placeholder="Your speech will appear here..."
            placeholderTextColor="#A3BCC2"
            editable={false}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Emotion Detection Result */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A38ED6" />
            <Text style={styles.loadingText}>Analyzing your emotions...</Text>
          </View>
        ) : (
          emotionResult && (
            <View style={styles.resultContainer}>
              <View style={styles.resultBubble}>
                <Text style={styles.resultText}>{emotionResult.emotion}</Text>
              </View>
            </View>
          )
        )}

        {/* Suggestion Section */}
        {emotionResult && !isLoading && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionTitle}>{emotionResult.suggestions.title}</Text>
            <Text style={styles.suggestionDescription}>{emotionResult.suggestions.description}</Text>
            
            {/* Action Items */}
            <View style={styles.actionItemsContainer}>
              {emotionResult.suggestions.actionItems.map((item, index) => (
                <View key={index} style={styles.actionItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.actionItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add bottom padding for scroll */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4F1'
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#E6F4F1'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 142, 214, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#223843',
    textShadowColor: 'rgba(163, 142, 214, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  promptContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  prompt: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#223843',
    textAlign: 'center',
    marginBottom: 5,
  },
  promptSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  timerText: {
    fontSize: 16,
    color: '#223843',
    fontWeight: '500',
  },
  speechButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  speechButton: {
    backgroundColor: '#A38ED6',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speechButtonActive: {
    backgroundColor: '#8B6EB7',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    minHeight: 100,
    maxHeight: 150,
    fontSize: 16,
    color: '#223843',
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultBubble: {
    backgroundColor: '#A38ED6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  suggestionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  suggestionTitle: {
    color: '#223843',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  suggestionDescription: {
    color: '#223843',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  actionItemsContainer: {
    marginVertical: 15,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  bulletPoint: {
    color: '#A38ED6',
    fontSize: 18,
    marginRight: 10,
    marginTop: -2,
  },
  actionItemText: {
    color: '#223843',
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 30,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emergencyButton: {
    backgroundColor: '#FFF5F5',
  },
  communityButton: {
    backgroundColor: '#F0F7FF',
  },
  profileButton: {
    backgroundColor: '#F5F0FF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;
