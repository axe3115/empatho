// src/screens/SplashScreen.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Parallel animation: fade + scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 3 sec
    const timer = setTimeout(() => {
      // navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' as never }] });

navigation.reset({
  index: 0,
  routes: [{ name: 'LoginScreen' as never }],
});

    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
      >
        {/* Logo Image */}
        <Image
          source={require('../../assets/Empathologo.png')}
          style={styles.logo}
        />

        {/* App Name */}
        <Text style={styles.appName}>Empatho</Text>

        {/* Slogan */}
        <Text style={styles.slogan}>Understanding Beyond Words</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA', // Sky Blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  appName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 40,
    color: '#0B3551',  // Deep Blue Text
    marginTop: 20,
  },
  slogan: {
    fontFamily: 'Nunito-Regular',
    fontSize: 20,
    color: '#0B3551',
    marginTop: 8,
  },
});
