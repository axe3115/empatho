import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
}

interface User {
  id: string;
  nickname: string;
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFriends();
    fetchUserNames();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.id);
    }
  }, [selectedFriend]);

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

  const fetchFriends = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendsList = userData.friends || [];

        const friendsData: User[] = [];
        for (const friendId of friendsList) {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            friendsData.push({
              id: friendDoc.id,
              nickname: friendDoc.data().nickname || 'Anonymous',
            });
          }
        }
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchMessages = (friendId: string) => {
    if (!auth.currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.senderId === auth.currentUser?.uid && data.receiverId === friendId) ||
          (data.senderId === friendId && data.receiverId === auth.currentUser?.uid)
        ) {
          newMessages.push({
            id: doc.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: data.timestamp,
          });
        }
      });
      setMessages(newMessages);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: auth.currentUser.uid,
        receiverId: selectedFriend.id,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.senderId === auth.currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isSender ? styles.sentMessage : styles.receivedMessage
      ]}>
        <Text style={styles.messageContent}>{item.content}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    );
  };

  const renderFriend = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriend?.id === item.id && styles.selectedFriend
      ]}
      onPress={() => setSelectedFriend(item)}
    >
      <Text style={styles.friendName}>{item.nickname}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
      </View>

      <View style={styles.friendsList}>
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendsListContent}
        />
      </View>

      {selectedFriend ? (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            inverted
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noChatSelected}>
          <Text style={styles.noChatText}>Select a friend to start chatting</Text>
        </View>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 142, 214, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#223843',
    textAlign: 'center',
  },
  friendsList: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 142, 214, 0.2)',
  },
  friendsListContent: {
    padding: 10,
  },
  friendItem: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A38ED6',
  },
  selectedFriend: {
    backgroundColor: '#A38ED6',
  },
  friendName: {
    color: '#223843',
    fontSize: 16,
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#A38ED6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageContent: {
    color: '#223843',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 142, 214, 0.2)',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#A38ED6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default ChatScreen; 