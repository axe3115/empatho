import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import EmotionDetectionScreen from '../screens/EmotionDetectionScreen';
import CalmPracticesScreen from '../screens/CalmPracticesScreen';
import EmotionHistoryScreen from '../screens/EmotionHistoryScreen';
import CommunityScreen from '../screens/CommunityScreen';
import EmergencyHelpScreen from '../screens/EmergencyHelpScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetup';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileUpdateScreen from '../screens/ProfileUpdateScreen';
import ChatScreen from '../screens/ChatScreen';

export type RootStackParamList = {
  Splash: undefined;
  HomeScreen: undefined;
  EmotionDetection: undefined;
  CalmPractices: undefined;
  EmotionHistory: undefined;
  Community: undefined;
  EmergencyHelp: undefined;
  SignUpScreen: undefined;
  LoginScreen: undefined;
  ProfileSetup: undefined;
  ProfileScreen: undefined;
  ProfileUpdate: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
/*
const RootStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="EmotionDetection" component={EmotionDetectionScreen} />
    <Stack.Screen name="CalmPractices" component={CalmPracticesScreen} />
    <Stack.Screen name="EmotionHistory" component={EmotionHistoryScreen} />
    <Stack.Screen name="Community" component={CommunityScreen} />
    <Stack.Screen name="EmergencyHelp" component={EmergencyHelpScreen} />
    <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
  </Stack.Navigator>
);*/

const RootStack = ({ user }: { user: any }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
      initialRouteName={user ? "HomeScreen" : "Splash"}
    >
      {/* Always include all screens */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="EmotionDetection" component={EmotionDetectionScreen} />
      <Stack.Screen name="CalmPractices" component={CalmPracticesScreen} />
      <Stack.Screen 
        name="EmotionHistory" 
        component={EmotionHistoryScreen}
        options={{
          animation: 'slide_from_left',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="EmergencyHelp" component={EmergencyHelpScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="ProfileUpdate" component={ProfileUpdateScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default RootStack;
