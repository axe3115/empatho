import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface Caregiver {
  name: string;
  phone: string;
  email: string;
}

type ProfileUpdateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileUpdate'>;

const ProfileUpdateScreen = () => {
  const navigation = useNavigation<ProfileUpdateScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [newCaregiver, setNewCaregiver] = useState<Caregiver>({
    name: '',
    phone: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    fetchUserProfile();
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile(data);
          setNickname(data.nickname || '');
          setAge(data.age?.toString() || '');
          setCaregivers(data.caregivers || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), {
        nickname: nickname.trim(),
        age: parseInt(age) || 0,
        caregivers: caregivers,
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addCaregiver = () => {
    if (!newCaregiver.name.trim() || !newCaregiver.phone.trim() || !newCaregiver.email.trim()) {
      Alert.alert('Error', 'Please fill in all caregiver details');
      return;
    }
    if (caregivers.some(c => c.email === newCaregiver.email.trim())) {
      Alert.alert('Error', 'This caregiver is already added');
      return;
    }
    setCaregivers([...caregivers, { ...newCaregiver }]);
    setNewCaregiver({ name: '', phone: '', email: '' });
  };

  const removeCaregiver = (email: string) => {
    setCaregivers(caregivers.filter(c => c.email !== email));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A38ED6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#223843" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.profileSection}>
              {userProfile?.photo ? (
                <Image source={{ uri: userProfile.photo }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={50} color="#A38ED6" />
                </View>
              )}
              <TouchableOpacity style={styles.changePhotoButton}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nickname</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#A38ED6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your nickname"
                    value={nickname}
                    onChangeText={setNickname}
                    placeholderTextColor="#A3BCC2"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Age</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#A38ED6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your age"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholderTextColor="#A3BCC2"
                  />
                </View>
              </View>
            </View>

            <View style={styles.caregiversSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Caregivers</Text>
                <Text style={styles.sectionSubtitle}>Add people who can help you</Text>
              </View>
              
              <View style={styles.caregiverInputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#A38ED6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Caregiver Name"
                    value={newCaregiver.name}
                    onChangeText={(text) => setNewCaregiver({ ...newCaregiver, name: text })}
                    placeholderTextColor="#A3BCC2"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#A38ED6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={newCaregiver.phone}
                    onChangeText={(text) => setNewCaregiver({ ...newCaregiver, phone: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor="#A3BCC2"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#A38ED6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={newCaregiver.email}
                    onChangeText={(text) => setNewCaregiver({ ...newCaregiver, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#A3BCC2"
                  />
                </View>
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={addCaregiver}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Caregiver</Text>
                </TouchableOpacity>
              </View>

              {caregivers.map((caregiver, index) => (
                <View key={index} style={styles.caregiverItem}>
                  <View style={styles.caregiverInfo}>
                    <Text style={styles.caregiverName}>{caregiver.name}</Text>
                    <View style={styles.caregiverDetails}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.caregiverDetailText}>{caregiver.phone}</Text>
                    </View>
                    <View style={styles.caregiverDetails}>
                      <Ionicons name="mail-outline" size={16} color="#666" />
                      <Text style={styles.caregiverDetailText}>{caregiver.email}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeCaregiver(caregiver.email)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
  },
  container: {
    flex: 1,
    backgroundColor: '#E6F4F1',
  },
  header: {
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
  },
  scrollContent: {
    padding: 20,
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#A38ED6',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#A38ED6',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A38ED6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#223843',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A38ED6',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#223843',
  },
  caregiversSection: {
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
  caregiverInputContainer: {
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  caregiverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A38ED6',
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#223843',
    marginBottom: 8,
  },
  caregiverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 5,
  },
  caregiverDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileUpdateScreen; 