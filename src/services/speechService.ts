import * as Speech from 'expo-speech';
import { EmotionAnalysis } from './suggestionService';

export const speakSuggestions = async (analysis: EmotionAnalysis) => {
  try {
    // Stop any ongoing speech
    await Speech.stop();

    let speechText = '';
    const emotion = analysis.emotion.toLowerCase();

    // First check for negative emotions
    if (emotion.includes('angry') || emotion.includes('frustrated')) {
      speechText = `I can sense that you're feeling really frustrated and angry right now. These are powerful emotions that deserve to be acknowledged. It's completely normal to feel angry sometimes - your feelings are valid. You're not alone in this. Let's work through this together. Take a moment to breathe deeply with me - in for 4, out for 4. Channel this energy into something positive - maybe a brisk walk or writing. Remember: This intense feeling will pass. You have the strength to handle this.`;
    } else if (emotion.includes('sad') || emotion.includes('depressed')) {
      speechText = `Hey, I can sense you're feeling down right now. I'm here to sit with you in this moment. It's okay to feel sad - your feelings are completely valid. You're not alone in this. I'm here to listen and support you. Be gentle with yourself, just like you would with a dear friend. Consider reaching out to someone who makes you feel safe. Remember: You've made it through difficult times before, and you will again.`;
    } else if (emotion.includes('anxious') || emotion.includes('worried') || emotion.includes('stressed')) {
      speechText = `I notice you're feeling anxious. Let's take a moment to acknowledge these feelings and find some peace together. Your anxiety is valid - it's your mind trying to protect you. You're not alone in feeling this way. I'm right here with you. Let's ground ourselves: Name 3 things you can see right now. Focus on what's in your control right now. Remember: This feeling will pass. You are safe and capable.`;
    } else if (emotion.includes('fear') || emotion.includes('scared')) {
      speechText = `I sense that you're feeling fearful. Let's work through this together. Your fears are valid - it's okay to feel this way. You're not alone in facing this. I'm here with you. Let's ground ourselves: Take a deep breath with me. Remember times you have overcome fears before. You are stronger than you know.`;
    } else if (emotion.includes('happy') || emotion.includes('joy')) {
      speechText = `I can feel your positive energy! It's wonderful to sense your happiness. Your joy is beautiful and worth celebrating. Take a moment to really savor this feeling. Consider noting what contributed to this happiness. Share your positive energy with others if you can. Remember: You deserve this happiness. Embrace it fully!`;
    } else {
      // If emotion is not clearly identified, check the text for emotional indicators
      const text = analysis.text.toLowerCase();
      if (text.includes('angry') || text.includes('frustrated') || text.includes('upset')) {
        speechText = `I can sense that you're feeling really frustrated and angry right now. These are powerful emotions that deserve to be acknowledged. It's completely normal to feel angry sometimes - your feelings are valid. You're not alone in this. Let's work through this together. Take a moment to breathe deeply with me - in for 4, out for 4. Channel this energy into something positive - maybe a brisk walk or writing. Remember: This intense feeling will pass. You have the strength to handle this.`;
      } else if (text.includes('sad') || text.includes('depressed') || text.includes('down')) {
        speechText = `Hey, I can sense you're feeling down right now. I'm here to sit with you in this moment. It's okay to feel sad - your feelings are completely valid. You're not alone in this. I'm here to listen and support you. Be gentle with yourself, just like you would with a dear friend. Consider reaching out to someone who makes you feel safe. Remember: You've made it through difficult times before, and you will again.`;
      } else if (text.includes('anxious') || text.includes('worried') || text.includes('stressed')) {
        speechText = `I notice you're feeling anxious. Let's take a moment to acknowledge these feelings and find some peace together. Your anxiety is valid - it's your mind trying to protect you. You're not alone in feeling this way. I'm right here with you. Let's ground ourselves: Name 3 things you can see right now. Focus on what's in your control right now. Remember: This feeling will pass. You are safe and capable.`;
      } else if (text.includes('happy') || text.includes('joy') || text.includes('good')) {
        speechText = `I can feel your positive energy! It's wonderful to sense your happiness. Your joy is beautiful and worth celebrating. Take a moment to really savor this feeling. Consider noting what contributed to this happiness. Share your positive energy with others if you can. Remember: You deserve this happiness. Embrace it fully!`;
      } else {
        // Only use neutral response if no emotional indicators are found
        speechText = `I'm here to listen and support you. How are you feeling right now? It's okay to take your time to express yourself. I'm here to help you process your emotions.`;
      }
    }

    // Configure speech options
    const options = {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85, // Slightly slower for more empathy
      volume: 1.0
    };

    // Speak the text
    await Speech.speak(speechText, options);

    return true;
  } catch (error) {
    console.error('Error speaking suggestions:', error);
    return false;
  }
};

export const stopSpeaking = async () => {
  try {
    await Speech.stop();
    return true;
  } catch (error) {
    console.error('Error stopping speech:', error);
    return false;
  }
};

// Function to check if text-to-speech is available
export const isSpeechAvailable = async () => {
  try {
    const available = await Speech.getAvailableVoicesAsync();
    return available.length > 0;
  } catch (error) {
    console.error('Error checking speech availability:', error);
    return false;
  }
}; 