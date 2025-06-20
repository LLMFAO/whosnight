import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';

export default function AppleSignInComponent({ onSignInSuccess }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkAppleSignInAvailability();
    checkExistingCredentials();
  }, []);

  const checkAppleSignInAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setIsAvailable(available);
  };

  const checkExistingCredentials = async () => {
    try {
      const savedUser = await SecureStore.getItemAsync('appleUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUserInfo(userData);
        setIsSignedIn(true);
        console.log('Found existing Apple user:', userData);
      }
    } catch (error) {
      console.log('No existing Apple credentials found');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      console.log('Starting Apple Sign In process...');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple Sign In Credential:', credential);
      
      // Process the credential data
      const userData = {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        realUserStatus: credential.realUserStatus,
        state: credential.state,
        signInDate: new Date().toISOString()
      };

      // Store user info securely
      await SecureStore.setItemAsync('appleUser', JSON.stringify(userData));
      
      setUserInfo(userData);
      setIsSignedIn(true);

      // Call success callback if provided
      if (onSignInSuccess) {
        onSignInSuccess(userData);
      }

      // Show success message
      Alert.alert(
        'Sign In Successful',
        `Welcome ${userData.fullName?.givenName || 'User'}!`,
        [{ text: 'OK' }]
      );

      console.log('Apple Sign In completed successfully');
      console.log('User ID:', userData.user);
      console.log('Email:', userData.email);
      console.log('Identity Token (JWT):', userData.identityToken);
      console.log('Authorization Code:', userData.authorizationCode);

    } catch (error) {
      console.error('Apple Sign In Error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        console.log('User cancelled Apple Sign In process');
      } else {
        Alert.alert(
          'Sign In Error',
          'An error occurred during Apple Sign In. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync('appleUser');
      setUserInfo(null);
      setIsSignedIn(false);
      console.log('User signed out successfully');
      
      Alert.alert(
        'Signed Out',
        'You have been signed out successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>
          Sign In with Apple is not available on this device.
        </Text>
      </View>
    );
  }

  if (isSignedIn && userInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>
          Welcome back, {userInfo.fullName?.givenName || 'User'}!
        </Text>
        <Text style={styles.emailText}>
          {userInfo.email || 'Email not provided'}
        </Text>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_OUT}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={styles.appleButton}
          onPress={handleSignOut}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In to CoParent Connect</Text>
      <Text style={styles.subtitle}>
        Secure and private authentication with your Apple ID
      </Text>
      
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.appleButton}
        onPress={handleAppleSignIn}
      />
      
      <Text style={styles.privacyText}>
        Your privacy is protected. We only receive the information you choose to share.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  appleButton: {
    width: 200,
    height: 44,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
  unavailableText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});