// src/screens/ProfileSetupScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface Caregiver {
  name: string;
  phone: string;
  email: string;
}

const ProfileSetup = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [newCaregiver, setNewCaregiver] = useState<Caregiver>({
    name: '',
    phone: '',
    email: '',
  });

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    const auth = getAuth();
    const db = getFirestore();

    try {
      await setDoc(doc(db, 'users', auth.currentUser!.uid), {
        nickname: nickname.trim(),
        age: parseInt(age) || 0,
        caregivers: caregivers,
        createdAt: new Date(),
      });

      navigation.navigate('HomeScreen');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Complete Your Profile</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your nickname"
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.caregiversContainer}>
          <Text style={styles.label}>Caregivers</Text>
          <View style={styles.caregiverInputContainer}>
            <TextInput
              style={[styles.input, styles.caregiverInput]}
              placeholder="Caregiver Name"
              value={newCaregiver.name}
              onChangeText={(text) => setNewCaregiver({ ...newCaregiver, name: text })}
            />
            <TextInput
              style={[styles.input, styles.caregiverInput]}
              placeholder="Phone Number"
              value={newCaregiver.phone}
              onChangeText={(text) => setNewCaregiver({ ...newCaregiver, phone: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, styles.caregiverInput]}
              placeholder="Email"
              value={newCaregiver.email}
              onChangeText={(text) => setNewCaregiver({ ...newCaregiver, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addButton} onPress={addCaregiver}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {caregivers.map((caregiver, index) => (
            <View key={index} style={styles.caregiverItem}>
              <View style={styles.caregiverInfo}>
                <Text style={styles.caregiverName}>{caregiver.name}</Text>
                <Text style={styles.caregiverDetails}>{caregiver.phone}</Text>
                <Text style={styles.caregiverDetails}>{caregiver.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeCaregiver(caregiver.email)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4F1',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#223843',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#223843',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#A38ED6',
    marginBottom: 10,
  },
  caregiversContainer: {
    marginBottom: 20,
  },
  caregiverInputContainer: {
    marginBottom: 10,
  },
  caregiverInput: {
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  caregiverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    marginBottom: 4,
  },
  caregiverDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#A38ED6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileSetup;
