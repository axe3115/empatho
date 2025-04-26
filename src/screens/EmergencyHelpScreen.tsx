import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

export default function EmergencyHelpScreen() {
  const emergencyContacts = [
    { name: 'National Suicide Prevention Lifeline', number: '988' },
    { name: 'Crisis Text Line', number: '741741' },
    { name: 'SAMHSA Helpline', number: '1-800-662-4357' },
    { name: 'Emergency Services', number: '911' },
  ];

  const handleCall = async (number: string) => {
    try {
      const url = `tel:${number}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot make phone calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Help</Text>
        <Text style={styles.subtitle}>You are not alone. Help is available.</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contactsContainer}>
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Ionicons name="call" size={24} color="#FF6B6B" style={styles.contactIcon} />
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(contact.number)}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#E6F4F1',
  },
  header: {
    padding: 20,
    backgroundColor: '#E6F4F1',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 142, 214, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#223843',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  contactsContainer: {
    gap: 15,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactIcon: {
    marginRight: 15,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#223843',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 16,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 