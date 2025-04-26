import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: any;
  likes: number;
}

interface User {
  id: string;
  nickname: string;
  friends: string[];
}

const CommunityScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchUserNames();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUser({
          id: userDoc.id,
          ...userDoc.data()
        } as User);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUserNames = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const names: Record<string, string> = {};
      usersSnapshot.forEach((doc) => {
        names[doc.id] = doc.data().nickname || 'Anonymous';
      });
      setUserNames(names);
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  };

  const fetchPosts = () => {
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts: Post[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newPosts.push({
          id: doc.id,
          userId: data.userId,
          username: userNames[data.userId] || 'Anonymous',
          content: data.content,
          timestamp: data.timestamp,
          likes: data.likes || 0,
        });
      });
      setPosts(newPosts);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  const handlePost = async () => {
    if (!newPost.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        content: newPost.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
      });
      setNewPost('');
    } catch (error) {
      console.error('Error posting:', error);
    }
  };

  const handleAddFriend = async (userId: string) => {
    if (!currentUser || !auth.currentUser) return;

    try {
      // Check if already friends
      if (currentUser.friends?.includes(userId)) {
        Alert.alert('Already Friends', 'You are already friends with this user.');
        return;
      }

      // Add to friends list
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        friends: arrayUnion(userId)
      });

      Alert.alert('Success', 'Friend added successfully!');
      fetchCurrentUser(); // Refresh current user data
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.userId !== auth.currentUser?.uid && (
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => handleAddFriend(item.userId)}
            >
              <Ionicons name="person-add-outline" size={20} color="#A38ED6" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
      <Text style={styles.content}>{item.content}</Text>
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons name="heart-outline" size={20} color="#A38ED6" />
          <Text style={styles.likeCount}>{item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat' as never)}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#223843" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Share your thoughts..."
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!newPost.trim()}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#A38ED6" style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.postsList}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 142, 214, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#223843',
  },
  chatButton: {
    padding: 5,
  },
  inputContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 142, 214, 0.2)',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 15,
    minHeight: 100,
    maxHeight: 150,
    marginBottom: 10,
    fontSize: 16,
  },
  postButton: {
    backgroundColor: '#A38ED6',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postsList: {
    padding: 15,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#223843',
  },
  addFriendButton: {
    padding: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  content: {
    fontSize: 16,
    color: '#223843',
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  likeCount: {
    marginLeft: 5,
    color: '#A38ED6',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 

export default CommunityScreen; 