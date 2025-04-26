import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function EmotionDetectionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emotion Detection</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 