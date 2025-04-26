import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Caregiver {
  name: string;
  phone: string;
  email: string;
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileScreen'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCaregiver, setIsAddingCaregiver] = useState(false);
  const [newCaregiver, setNewCaregiver] = useState<Caregiver>({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleAddCaregiver = async () => {
    if (!newCaregiver.name.trim() || !newCaregiver.phone.trim() || !newCaregiver.email.trim()) {
      Alert.alert('Error', 'Please fill in all caregiver details');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedCaregivers = [...(userProfile?.caregivers || []), newCaregiver];
      await updateDoc(doc(db, 'users', user.uid), {
        caregivers: updatedCaregivers
      });

      setUserProfile({ ...userProfile, caregivers: updatedCaregivers });
      setNewCaregiver({ name: '', phone: '', email: '' });
      setIsAddingCaregiver(false);
      Alert.alert('Success', 'Caregiver added successfully');
    } catch (error) {
      console.error('Error adding caregiver:', error);
      Alert.alert('Error', 'Failed to add caregiver');
    }
  };

  const handleRemoveCaregiver = async (email: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedCaregivers = userProfile.caregivers.filter((c: Caregiver) => c.email !== email);
      await updateDoc(doc(db, 'users', user.uid), {
        caregivers: updatedCaregivers
      });

      setUserProfile({ ...userProfile, caregivers: updatedCaregivers });
      Alert.alert('Success', 'Caregiver removed successfully');
    } catch (error) {
      console.error('Error removing caregiver:', error);
      Alert.alert('Error', 'Failed to remove caregiver');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A38ED6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#223843" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileUpdate')}>
            <Ionicons name="create-outline" size={24} color="#223843" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          {userProfile?.photo ? (
            <Image source={{ uri: userProfile.photo }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#A38ED6" />
            </View>
          )}
          
          <Text style={styles.nickname}>{userProfile?.nickname || 'No nickname set'}</Text>
          <Text style={styles.name}>{userProfile?.name || 'No name set'}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={24} color="#A38ED6" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{userProfile?.age || 'Not specified'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color="#A38ED6" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{auth.currentUser?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.caregiversSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Caregivers</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsAddingCaregiver(true)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isAddingCaregiver && (
            <View style={styles.addCaregiverForm}>
              <TextInput
                style={styles.input}
                placeholder="Caregiver Name"
                value={newCaregiver.name}
                onChangeText={(text) => setNewCaregiver({ ...newCaregiver, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={newCaregiver.phone}
                onChangeText={(text) => setNewCaregiver({ ...newCaregiver, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={newCaregiver.email}
                onChangeText={(text) => setNewCaregiver({ ...newCaregiver, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setIsAddingCaregiver(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.formButton, styles.saveButton]}
                  onPress={handleAddCaregiver}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {userProfile?.caregivers?.map((caregiver: Caregiver, index: number) => (
            <View key={index} style={styles.caregiverItem}>
              <View style={styles.caregiverInfo}>
                <Text style={styles.caregiverName}>{caregiver.name}</Text>
                <Text style={styles.caregiverDetails}>{caregiver.phone}</Text>
                <Text style={styles.caregiverDetails}>{caregiver.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveCaregiver(caregiver.email)}
              >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            auth.signOut();
            navigation.navigate('LoginScreen');
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    backgroundColor: '#E6F4F1',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#223843',
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
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  nickname: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#223843',
    marginBottom: 5,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#223843',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#223843',
  },
  caregiversSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#223843',
  },
  addButton: {
    backgroundColor: '#A38ED6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCaregiverForm: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  formButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  saveButton: {
    backgroundColor: '#A38ED6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  caregiverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#223843',
    marginBottom: 4,
  },
  caregiverDetails: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666',
    marginBottom: 2,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginLeft: 10,
  },
});

export default ProfileScreen; 