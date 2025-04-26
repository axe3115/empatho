import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getEmotionHistory, getEmotionStats, EmotionHistoryEntry, deleteEmotionEntry } from '../services/emotionHistoryService';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface EmotionStats {
  totalEntries: number;
  emotionFrequencies: Record<string, number>;
  averageConfidence: number;
  commonTriggers: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

const EmotionHistoryScreen = () => {
  const navigation = useNavigation();
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EmotionHistoryEntry[]>([]);
  const [stats, setStats] = useState<EmotionStats | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoadingStats(true);
        setLoadingHistory(true);
      }
      setError(null);

      const [historyData, statsData] = await Promise.all([
        getEmotionHistory(20),
        getEmotionStats(30)
      ]);

      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading emotion history:', error);
      setError('Unable to load emotion history. Please check your connection and try again.');
    } finally {
      setLoadingStats(false);
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      anxious: '😰',
      neutral: '😐',
      excited: '🤩',
      tired: '😴',
      stressed: '😫'
    };
    return emojis[emotion.toLowerCase()] || '🤔';
  };

  const renderRightActions = (entry: EmotionHistoryEntry) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteEntry(entry.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEmotionEntry(id);
      setHistory(history.filter(entry => entry.id !== id));
      Alert.alert('Success', 'Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete entry');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#223843" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emotion History</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color="#A38ED6" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ScrollView 
            style={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#A38ED6']}
                tintColor="#A38ED6"
              />
            }
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {loadingStats ? (
                <View style={styles.sectionLoader}>
                  <ActivityIndicator color="#A38ED6" />
                </View>
              ) : stats && Object.keys(stats.emotionFrequencies).length > 0 ? (
                <View style={styles.statsContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Last 30 Days Overview</Text>
                    <Text style={styles.sectionSubtitle}>Your emotional journey</Text>
                  </View>
                  <View style={styles.statsGrid}>
                    {Object.entries(stats.emotionFrequencies).map(([emotion, count]: [string, number]) => (
                      <View key={emotion} style={styles.statItem}>
                        <Text style={styles.statEmoji}>{getEmotionEmoji(emotion)}</Text>
                        <Text style={styles.statLabel}>{emotion}</Text>
                        <Text style={styles.statValue}>{count}x</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Average Detection Confidence</Text>
                    <Text style={styles.confidenceValue}>
                      {(stats.averageConfidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.historyContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Entries</Text>
                  <Text style={styles.sectionSubtitle}>Your emotional moments</Text>
                </View>
                {loadingHistory ? (
                  <View style={styles.sectionLoader}>
                    <ActivityIndicator color="#A38ED6" />
                  </View>
                ) : history.length > 0 ? (
                  history.map(entry => (
                    <Swipeable
                      key={entry.id}
                      renderRightActions={() => renderRightActions(entry)}
                    >
                      <View style={styles.historyItem}>
                        <View style={styles.historyItemHeader}>
                          <Text style={styles.historyEmoji}>{getEmotionEmoji(entry.emotion)}</Text>
                          <Text style={styles.historyEmotion}>{entry.emotion}</Text>
                          <Text style={styles.historyDate}>{formatDate(entry.timestamp)}</Text>
                        </View>
                        {entry.text && (
                          <Text style={styles.historyText} numberOfLines={2}>
                            {entry.text}
                          </Text>
                        )}
                        <View style={styles.historyFooter}>
                          <View style={styles.confidenceIndicator}>
                            <Ionicons name="pulse" size={16} color="#A38ED6" />
                            <Text style={styles.confidenceText}>
                              {(entry.confidence * 100).toFixed(1)}% confidence
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Swipeable>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={64} color="#A38ED6" />
                    <Text style={styles.emptyText}>No emotion entries yet</Text>
                    <Text style={styles.emptySubtext}>
                      Your emotion history will appear here after you record your first entry
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </GestureHandlerRootView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#223843',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#A38ED6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLoader: {
    padding: 20,
    alignItems: 'center',
  },
  statsContainer: {
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
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#223843',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 10,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#223843',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A38ED6',
  },
  confidenceContainer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 142, 214, 0.2)',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#223843',
    marginBottom: 5,
  },
  confidenceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A38ED6',
  },
  historyContainer: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  historyEmotion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#223843',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyText: {
    fontSize: 14,
    color: '#223843',
    marginBottom: 10,
    lineHeight: 20,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#223843',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});

export default EmotionHistoryScreen; 