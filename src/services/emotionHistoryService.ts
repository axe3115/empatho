import { collection, addDoc, query, where, getDocs, orderBy, limit as firestoreLimit, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export interface EmotionHistoryEntry {
  id: string;
  userId: string;
  timestamp: Date;
  text: string;
  emotion: string;
  confidence: number;
  suggestions: {
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  };
  triggers?: string[];
  notes?: string;
}

interface FirestoreEmotionData {
  userId: string;
  timestamp: Timestamp;
  text: string;
  emotion: string;
  confidence: number;
  suggestions: {
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  };
  triggers?: string[];
  notes?: string;
}

// Add new emotion analysis to history
export const saveEmotionAnalysis = async (analysis: EmotionHistoryEntry) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const docRef = await addDoc(collection(db, 'emotionHistory'), {
      userId: user.uid,
      timestamp: Timestamp.now(),
      text: analysis.text,
      emotion: analysis.emotion,
      confidence: analysis.confidence,
      suggestions: analysis.suggestions,
      triggers: analysis.triggers || [],
      notes: analysis.notes || '',
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving emotion analysis:', error);
    throw error;
  }
};

// Get user's emotion history
export const getEmotionHistory = async (limitCount: number = 10) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Simplified query without composite index
    const q = query(
      collection(db, 'emotionHistory'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreEmotionData;
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate(),
      };
    }) as EmotionHistoryEntry[];
  } catch (error) {
    console.error('Error fetching emotion history:', error);
    // Return empty array as fallback
    return [];
  }
};

// Get emotion statistics
export const getEmotionStats = async (days: number = 30) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Simplified query without the timestamp filter initially
    const q = query(
      collection(db, 'emotionHistory'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreEmotionData;
      return {
        ...data,
        timestamp: data.timestamp.toDate(),
      };
    });

    // Filter entries by date in memory
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const filteredEntries = entries.filter(entry => entry.timestamp >= startDate);

    // Calculate emotion frequencies
    const emotionCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });

    // Calculate average confidence
    const avgConfidence = filteredEntries.length > 0 
      ? filteredEntries.reduce((sum, entry) => sum + (entry.confidence || 0), 0) / filteredEntries.length
      : 0;

    // Find common triggers
    const triggerCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.triggers?.forEach((trigger: string) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });

    return {
      totalEntries: filteredEntries.length,
      emotionFrequencies: emotionCounts,
      averageConfidence: avgConfidence,
      commonTriggers: Object.entries(triggerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([trigger]) => trigger),
      timeRange: {
        start: startDate,
        end: new Date()
      }
    };
  } catch (error) {
    console.error('Error fetching emotion statistics:', error);
    // Return empty stats as fallback
    return {
      totalEntries: 0,
      emotionFrequencies: {},
      averageConfidence: 0,
      commonTriggers: [],
      timeRange: {
        start: new Date(),
        end: new Date()
      }
    };
  }
};

// Get emotion trends
export const getEmotionTrends = async (days: number = 7) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, 'emotionHistory'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      timestamp: doc.data().timestamp.toDate(),
      emotion: doc.data().emotion,
    }));

    // Group by day
    const dailyEmotions: Record<string, Record<string, number>> = {};
    entries.forEach(entry => {
      const day = entry.timestamp.toISOString().split('T')[0];
      if (!dailyEmotions[day]) {
        dailyEmotions[day] = {};
      }
      dailyEmotions[day][entry.emotion] = (dailyEmotions[day][entry.emotion] || 0) + 1;
    });

    return dailyEmotions;
  } catch (error) {
    console.error('Error fetching emotion trends:', error);
    throw error;
  }
};

// Delete an emotion entry
export const deleteEmotionEntry = async (entryId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    await deleteDoc(doc(db, 'emotionHistory', entryId));
  } catch (error) {
    console.error('Error deleting emotion entry:', error);
    throw error;
  }
}; 