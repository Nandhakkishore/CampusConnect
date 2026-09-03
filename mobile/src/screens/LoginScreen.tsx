import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { showAlert } from '../utils/alert';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      const err = 'Please fill in email and password';
      setErrorMsg(err);
      showAlert('Error', err);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({ email, password });
      if (res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setErrorMsg(msg);
      showAlert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.appName}>CampusConnect</Text>
          <Text style={styles.tagline}>Build teams. Ship projects. Level up campus.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Input
            label="Campus Email"
            placeholder="student@campus.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 10,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
