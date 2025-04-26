export interface EmotionAnalysis {
  text: string;
  emotion: string;
  confidence: number;
  warning?: string;
}

interface Suggestion {
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
}

// Mapping different emotions to their typical scenarios and suggestions
const emotionSuggestions: Record<string, (text: string) => Suggestion> = {
  angry: (text: string) => ({
    title: '🌟 Understanding Your Anger',
    description: "I can sense that you're feeling really frustrated and angry right now. These are powerful emotions that deserve to be acknowledged.",
    actionItems: [
      '💗 It\'s completely normal to feel angry sometimes - your feelings are valid',
      '🫂 You\'re not alone in this. Let\'s work through this together',
      '🧘‍♀️ Take a moment to breathe deeply with me - in for 4, out for 4',
      '💪 Channel this energy into something positive - maybe a brisk walk or writing',
      '✨ Remember: This intense feeling will pass. You have the strength to handle this'
    ],
    priority: 'high'
  }),

  sad: (text: string) => ({
    title: '🌸 Supporting You Through Sadness',
    description: "Hey, I can sense you're feeling down right now. I'm here to sit with you in this moment.",
    actionItems: [
      '💖 It\'s okay to feel sad - your feelings are completely valid',
      '🤗 You\'re not alone in this. I\'m here to listen and support you',
      '🌱 Be gentle with yourself, just like you would with a dear friend',
      '☀️ Consider reaching out to someone who makes you feel safe',
      '✨ Remember: You\'ve made it through difficult times before, and you will again'
    ],
    priority: 'high'
  }),

  anxious: (text: string) => ({
    title: '🌺 Finding Calm Together',
    description: "I notice you're feeling anxious. Let's take a moment to acknowledge these feelings and find some peace together.",
    actionItems: [
      '💗 Your anxiety is valid - it\'s your mind trying to protect you',
      '🫂 You\'re not alone in feeling this way. I\'m right here with you',
      '🧘‍♀️ Let\'s ground ourselves: Name 3 things you can see right now',
      '🌈 Focus on what\'s in your control right now',
      '✨ Remember: This feeling will pass. You are safe and capable'
    ],
    priority: 'high'
  }),

  happy: (text: string) => ({
    title: '🌟 Celebrating Your Joy',
    description: "I can feel your positive energy! It's wonderful to sense your happiness.",
    actionItems: [
      '💖 Your joy is beautiful and worth celebrating',
      '🎉 Take a moment to really savor this feeling',
      '📝 Consider noting what contributed to this happiness',
      '🌈 Share your positive energy with others if you can',
      '✨ Remember: You deserve this happiness. Embrace it fully!'
    ],
    priority: 'medium'
  }),

  joy: (text: string) => ({
    title: '🌟 Celebrating Your Joy',
    description: "Your happiness shines through! It's wonderful to sense your joy and positive energy.",
    actionItems: [
      '💖 Your joy is beautiful and worth celebrating',
      '🎉 Take a moment to really savor this feeling',
      '📝 Consider noting what contributed to this happiness',
      '🌈 Share your positive energy with others if you can',
      '✨ Remember: You deserve this happiness. Embrace it fully!'
    ],
    priority: 'medium'
  }),

  sadness: (text: string) => ({
    title: '🌸 Supporting You Through Sadness',
    description: "I can sense that you're feeling down. I'm here to support you through this moment.",
    actionItems: [
      '💖 It\'s okay to feel sad - your feelings are completely valid',
      '🤗 You\'re not alone in this. I\'m here to listen and support you',
      '🌱 Be gentle with yourself, just like you would with a dear friend',
      '☀️ Consider reaching out to someone who makes you feel safe',
      '✨ Remember: You\'ve made it through difficult times before, and you will again'
    ],
    priority: 'high'
  }),

  fear: (text: string) => ({
    title: '🌺 Finding Courage Together',
    description: "I sense that you're feeling fearful. Let's work through this together.",
    actionItems: [
      '💗 Your fears are valid - it\'s okay to feel this way',
      '🫂 You\'re not alone in facing this. I\'m here with you',
      '🧘‍♀️ Let\'s ground ourselves: Take a deep breath with me',
      ' Remember times you have overcome fears before',
      '✨ You are stronger than you know'
    ],
    priority: 'high'
  }),

  neutral: (text: string) => ({
    title: '🌿 Finding Your Center',
    description: "I sense you're in a calm, neutral space. This is a great time for reflection and mindfulness.",
    actionItems: [
      '💗 It\'s perfectly okay to feel neutral - all emotions are valid',
      '🧘‍♀️ Use this balanced moment for gentle self-reflection',
      '🌱 Consider what would bring you joy right now',
      '💫 Set an intention for how you\'d like to feel',
      '✨ Remember: You\'re exactly where you need to be'
    ],
    priority: 'low'
  })
};

// Context-specific suggestions based on keywords in the text
const getContextualSuggestions = (text: string): string[] => {
  const suggestions: string[] = [];
  
  // Work-related stress
  if (text.toLowerCase().includes('work') || text.toLowerCase().includes('job') || text.toLowerCase().includes('boss')) {
    suggestions.push('Consider discussing workload management with your supervisor');
    suggestions.push('Take short breaks between tasks to maintain productivity');
  }

  // Relationship issues
  if (text.toLowerCase().includes('relationship') || text.toLowerCase().includes('partner') || text.toLowerCase().includes('friend')) {
    suggestions.push('Practice active listening in your conversations');
    suggestions.push('Schedule quality time with important people in your life');
  }

  // Health concerns
  if (text.toLowerCase().includes('health') || text.toLowerCase().includes('sick') || text.toLowerCase().includes('pain')) {
    suggestions.push('Consider scheduling a check-up with your healthcare provider');
    suggestions.push('Focus on maintaining a regular sleep schedule');
  }

  return suggestions;
};

export const getSuggestions = (analysis: EmotionAnalysis): Suggestion => {
  // Get base suggestion for the emotion
  const emotionType = analysis.emotion.toLowerCase();
  console.log('Debug: Looking up suggestion for emotion:', emotionType);
  
  let suggestion: Suggestion;

  // Try exact match first
  if (emotionType in emotionSuggestions) {
    suggestion = emotionSuggestions[emotionType](analysis.text);
  } else {
    // Try to map similar emotions
    const emotionMap: Record<string, string> = {
      'joy': 'happy',
      'sadness': 'sad',
      'fear': 'anxious',
      'anger': 'angry'
    };
    
    const mappedEmotion = emotionMap[emotionType];
    if (mappedEmotion && mappedEmotion in emotionSuggestions) {
      console.log('Debug: Mapped emotion', emotionType, 'to', mappedEmotion);
      suggestion = emotionSuggestions[mappedEmotion](analysis.text);
    } else {
      console.log('Debug: No mapping found for emotion:', emotionType, '- defaulting to neutral');
      suggestion = emotionSuggestions.neutral(analysis.text);
    }
  }

  // Add context-specific suggestions
  const contextSuggestions = getContextualSuggestions(analysis.text);
  if (contextSuggestions.length > 0) {
    suggestion.actionItems = [...suggestion.actionItems, ...contextSuggestions];
  }

  // Adjust priority based on confidence score
  if (analysis.confidence > 0.8) {
    suggestion.priority = 'high';
  }

  return suggestion;
};

// Function to track emotion patterns over time
export interface EmotionPattern {
  primaryEmotion: string;
  frequency: number;
  commonTriggers: string[];
  suggestedLongTermActions: string[];
}

let emotionHistory: EmotionAnalysis[] = [];

export const trackEmotionPattern = (analysis: EmotionAnalysis): EmotionPattern | null => {
  emotionHistory.push(analysis);
  
  // Keep only last 10 entries
  if (emotionHistory.length > 10) {
    emotionHistory = emotionHistory.slice(-10);
  }

  // Need at least 3 entries to identify patterns
  if (emotionHistory.length < 3) {
    return null;
  }

  const emotionCounts: Record<string, number> = {};
  emotionHistory.forEach(entry => {
    emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
  });

  const primaryEmotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0][0];

  return {
    primaryEmotion,
    frequency: emotionCounts[primaryEmotion],
    commonTriggers: identifyCommonTriggers(emotionHistory),
    suggestedLongTermActions: getLongTermSuggestions(primaryEmotion)
  };
};

const identifyCommonTriggers = (history: EmotionAnalysis[]): string[] => {
  const triggers: string[] = [];
  const text = history.map(h => h.text.toLowerCase()).join(' ');

  if (text.includes('work') || text.includes('job')) {
    triggers.push('Work-related stress');
  }
  if (text.includes('relationship') || text.includes('partner')) {
    triggers.push('Relationship dynamics');
  }
  if (text.includes('health') || text.includes('sick')) {
    triggers.push('Health concerns');
  }

  return triggers;
};

const getLongTermSuggestions = (primaryEmotion: string): string[] => {
  const suggestions: string[] = [];

  switch (primaryEmotion.toLowerCase()) {
    case 'angry':
      suggestions.push('Consider regular exercise to manage stress');
      suggestions.push('Practice mindfulness or meditation daily');
      break;
    case 'sad':
      suggestions.push('Maintain a regular sleep schedule');
      suggestions.push('Stay connected with supportive friends and family');
      break;
    case 'anxious':
      suggestions.push('Develop a daily relaxation routine');
      suggestions.push('Consider talking to a mental health professional');
      break;
    case 'happy':
      suggestions.push('Keep a gratitude journal');
      suggestions.push('Share your positive energy with others');
      break;
  }

  return suggestions;
}; 