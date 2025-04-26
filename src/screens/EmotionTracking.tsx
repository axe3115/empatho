import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import BreakdownDetectionService from '../services/breakdownDetection';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

interface EmotionAnalysis {
  primaryEmotion: string;
  secondaryEmotions: string[];
  intensity: number;
  stressLevel: number;
  isBreakdown: boolean;
}

const EmotionTracking = () => {
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [intensity, setIntensity] = useState('5');
  const [stressLevel, setStressLevel] = useState('5');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBreakdownAlert, setShowBreakdownAlert] = useState(false);
  const [breakdownService] = useState(() => BreakdownDetectionService.getInstance());
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const emotions = [
    'Happy', 'Sad', 'Angry', 'Anxious', 'Calm', 'Excited', 'Tired', 'Stressed'
  ];

  const negativeEmotions = ['Angry', 'Anxious', 'Stressed', 'Sad'];

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        await analyzeEmotion(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const analyzeEmotion = async (audioUri: string) => {
    setIsAnalyzing(true);
    try {
      // First step: Basic emotion analysis
      const basicAnalysis = await performBasicEmotionAnalysis(audioUri);
      
      // Second step: Detailed analysis of negative emotions
      const detailedAnalysis = await analyzeNegativeEmotions(basicAnalysis);
      
      // Update UI with analysis results
      setSelectedEmotion(detailedAnalysis.primaryEmotion);
      setIntensity(detailedAnalysis.intensity.toString());
      setStressLevel(detailedAnalysis.stressLevel.toString());

      // If breakdown is detected, show alert and trigger caregiver calling
      if (detailedAnalysis.isBreakdown) {
        setShowBreakdownAlert(true);
        await breakdownService.updateMetrics(
          detailedAnalysis.intensity * 10,
          detailedAnalysis.stressLevel * 10
        );
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      Alert.alert('Error', 'Failed to analyze emotion');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performBasicEmotionAnalysis = async (audioUri: string): Promise<EmotionAnalysis> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // This is where you would integrate with a real emotion analysis API
    // For now, we'll return some simulated values
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const randomIntensity = Math.floor(Math.random() * 10) + 1;
    const randomStressLevel = Math.floor(Math.random() * 10) + 1;

    return {
      primaryEmotion: randomEmotion,
      secondaryEmotions: [],
      intensity: randomIntensity,
      stressLevel: randomStressLevel,
      isBreakdown: false
    };
  };

  const analyzeNegativeEmotions = async (basicAnalysis: EmotionAnalysis): Promise<EmotionAnalysis> => {
    // Simulate detailed analysis of negative emotions
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isNegativeEmotion = negativeEmotions.includes(basicAnalysis.primaryEmotion);
    const highIntensity = basicAnalysis.intensity > 7;
    const highStress = basicAnalysis.stressLevel > 7;

    // Determine if this is a breakdown situation
    const isBreakdown = isNegativeEmotion && (highIntensity || highStress);

    return {
      ...basicAnalysis,
      isBreakdown
    };
  };

  const handleSave = async () => {
    if (!selectedEmotion) {
      Alert.alert('Error', 'Please select an emotion');
      return;
    }

    const auth = getAuth();
    const db = getFirestore();

    try {
      const emotionData = {
        emotion: selectedEmotion,
        intensity: parseInt(intensity),
        stressLevel: parseInt(stressLevel),
        timestamp: new Date().toISOString()
      };

      // Update user's emotion history
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        emotionHistory: [...(await getEmotionHistory()), emotionData]
      });

      Alert.alert('Success', 'Emotion recorded successfully');
      setSelectedEmotion('');
      setIntensity('5');
      setStressLevel('5');
    } catch (error) {
      console.error('Error saving emotion:', error);
      Alert.alert('Error', 'Failed to save emotion');
    }
  };

  const getEmotionHistory = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
    return userDoc.data()?.emotionHistory || [];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      
      <View style={styles.recordingSection}>
        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#A38ED6" />
            <Text style={styles.analyzingText}>Analyzing your emotions...</Text>
          </View>
        )}
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Detected Emotion:</Text>
        <Picker
          selectedValue={selectedEmotion}
          onValueChange={(value: string) => setSelectedEmotion(value)}
          style={styles.picker}
        >
          <Picker.Item label="Select an emotion" value="" />
          {emotions.map((emotion) => (
            <Picker.Item key={emotion} label={emotion} value={emotion} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Emotion Intensity (1-10):</Text>
        <Picker
          selectedValue={intensity}
          onValueChange={(value: string) => setIntensity(value)}
          style={styles.picker}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <Picker.Item key={value} label={value.toString()} value={value.toString()} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Stress Level (1-10):</Text>
        <Picker
          selectedValue={stressLevel}
          onValueChange={(value: string) => setStressLevel(value)}
          style={styles.picker}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <Picker.Item key={value} label={value.toString()} value={value.toString()} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Emotion</Text>
      </TouchableOpacity>

      <Modal
        visible={showBreakdownAlert}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Breakdown Detected</Text>
            <Text style={styles.modalText}>
              We've detected that you might be experiencing a breakdown. Your caregiver will be notified and called immediately.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowBreakdownAlert(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 25,
    width: 200,
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: '#FF6B6B',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyzingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmotionTracking; 