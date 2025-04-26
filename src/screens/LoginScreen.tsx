// src/screens/LoginScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('HomeScreen' as never);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <CustomButton
        title="Log In"
        onPress={handleLogin}
        style={styles.button}
      />
      
      <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen' as never)}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#0B3551',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontFamily: 'Nunito-Regular',
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  error: {
    color: '#ff4444',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  link: {
    color: '#0B3551',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
    textDecorationLine: 'underline',
  },
});
