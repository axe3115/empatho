import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';
import { View, ActivityIndicator } from 'react-native';

const App = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulate checking login status from Firebase
    const checkLogin = async () => {
      // replace this with Firebase Auth logic
      setTimeout(() => {
        setUser(null);  // or setUser(userData) if logged in
        setCheckingAuth(false);
      }, 3000);
    };
    checkLogin();
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#E0F7FA' }}>
        <ActivityIndicator size="large" color="#A38ED6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack user={user} />
    </NavigationContainer>
  );
};

export default App;
