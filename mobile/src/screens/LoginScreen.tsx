import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
    const trimmedEmail = email.trim().toLowerCase();
    setErrorMsg('');

    if (!trimmedEmail || !password) {
      const err = 'Please enter both campus email and password.';
      setErrorMsg(err);
      showAlert('Missing Information', err);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({
        email: trimmedEmail,
        password,
      });

      if (res && res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      } else {
        const msg = res?.message || 'Login failed. Please verify your credentials.';
        setErrorMsg(msg);
        showAlert('Login Failed', msg);
      }
    } catch (err: any) {
      let msg = 'Invalid email or password. Please try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. The server may be waking up, please try again in a moment.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error') {
        msg = 'Network error. Please check your internet connection or backend server.';
      }
      setErrorMsg(msg);
      showAlert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🚀</Text>
          </View>
          <Text style={styles.appName}>CampusConnect</Text>
          <Text style={styles.tagline}>Connect. Build teams. Ship projects.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in with your campus account to continue</Text>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Input
            label="Campus Email"
            placeholder="student@campus.edu"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMsg) setErrorMsg('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMsg) setErrorMsg('');
            }}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            onPress={() => {
              setErrorMsg('');
              navigation.navigate('Register');
            }}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkHighlight}>Create an account</Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 28,
  },
  appName: {
    fontSize: 28,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 8,
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
