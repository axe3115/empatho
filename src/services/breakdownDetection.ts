import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface BreakdownMetrics {
  emotionIntensity: number; // 0-100
  stressLevel: number; // 0-100
  triggerCount: number; // Number of triggers in last hour
  lastBreakdown: Date | null;
}

interface Caregiver {
  name: string;
  phone: string;
  email: string;
}

export class BreakdownDetectionService {
  private static instance: BreakdownDetectionService;
  private breakdownThreshold = 70; // Lowered from 80 to 70
  private triggerThreshold = 2; // Lowered from 3 to 2
  private metrics: BreakdownMetrics = {
    emotionIntensity: 0,
    stressLevel: 0,
    triggerCount: 0,
    lastBreakdown: null,
  };

  private constructor() {
    // Initialize metrics
    this.resetMetrics();
  }

  public static getInstance(): BreakdownDetectionService {
    if (!BreakdownDetectionService.instance) {
      BreakdownDetectionService.instance = new BreakdownDetectionService();
    }
    return BreakdownDetectionService.instance;
  }

  private resetMetrics() {
    this.metrics = {
      emotionIntensity: 0,
      stressLevel: 0,
      triggerCount: 0,
      lastBreakdown: null,
    };
  }

  public async updateMetrics(emotionIntensity: number, stressLevel: number) {
    console.log('Debug: Updating metrics:', { emotionIntensity, stressLevel });
    
    this.metrics.emotionIntensity = emotionIntensity;
    this.metrics.stressLevel = stressLevel;
    
    // Check for triggers
    if (emotionIntensity > 60 || stressLevel > 60) { // Lowered from 70 to 60
      this.metrics.triggerCount++;
      console.log('Debug: Trigger detected. Count:', this.metrics.triggerCount);
    }

    // Check for breakdown
    await this.checkForBreakdown();
  }

  private async checkForBreakdown() {
    const isBreakdown = 
      this.metrics.emotionIntensity > this.breakdownThreshold ||
      this.metrics.stressLevel > this.breakdownThreshold ||
      this.metrics.triggerCount >= this.triggerThreshold;

    console.log('Debug: Breakdown check:', {
      emotionIntensity: this.metrics.emotionIntensity,
      stressLevel: this.metrics.stressLevel,
      triggerCount: this.metrics.triggerCount,
      isBreakdown
    });

    if (isBreakdown) {
      console.log('Debug: Breakdown detected, handling...');
      await this.handleBreakdown();
    }
  }

  private async handleBreakdown() {
    // Prevent multiple notifications within 30 minutes (reduced from 1 hour)
    if (this.metrics.lastBreakdown && 
        Date.now() - this.metrics.lastBreakdown.getTime() < 1800000) {
      console.log('Debug: Skipping breakdown handling - too soon since last breakdown');
      return;
    }

    console.log('Debug: Handling breakdown...');
    this.metrics.lastBreakdown = new Date();
    await this.notifyCaregivers();
    // Don't reset metrics immediately to allow for multiple triggers
    setTimeout(() => this.resetMetrics(), 5000);
  }

  private async notifyCaregivers() {
    const auth = getAuth();
    const db = getFirestore();

    try {
      console.log('Debug: Notifying caregivers...');
      // Get user's caregivers
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (!userDoc.exists()) {
        console.log('Debug: No user document found');
        return;
      }

      const userData = userDoc.data();
      const caregivers: Caregiver[] = userData.caregivers || [];

      if (caregivers.length === 0) {
        console.log('Debug: No caregivers found');
        return;
      }

      console.log('Debug: Found caregivers:', caregivers);

      // Send notification to each caregiver
      for (const caregiver of caregivers) {
        await this.sendCaregiverNotification(caregiver);
      }
    } catch (error) {
      console.error('Error notifying caregivers:', error);
    }
  }

  private async sendCaregiverNotification(caregiver: Caregiver) {
    try {
      console.log('Debug: Sending notification to caregiver:', caregiver);
      
      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Breakdown Alert',
          body: `A user you care for is experiencing a breakdown. Please check on them.`,
          data: { caregiver },
        },
        trigger: null, // Send immediately
      });

      // Make emergency call
      if (caregiver.phone) {
        console.log('Debug: Making emergency call to:', caregiver.phone);
        await Linking.openURL(`tel:${caregiver.phone}`);
      } else {
        console.log('Debug: No phone number available for caregiver');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

export default BreakdownDetectionService; 