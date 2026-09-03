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
      if (res && res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      } else {
        const msg = res?.message || 'Login failed. Invalid credentials.';
        setErrorMsg(msg);
        showAlert('Login Error', msg);
      }
    } catch (err: any) {
      let msg = 'Login failed. Please check credentials.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Server connection timed out (cold start). Please try again in a few seconds.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error') {
        msg = 'Network error. Please check your internet connection or server host.';
      }
      setErrorMsg(msg);
      showAlert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  const handleGoogleSubmit = async (selectedEmail?: string) => {
    const targetEmail = selectedEmail || googleEmailInput.trim();
    if (!targetEmail) {
      showAlert('Error', 'Please enter your Google email address');
      return;
    }

    setGoogleModalVisible(false);
    setErrorMsg('');

    try {
      setGoogleLoading(true);
      const res = await authApi.googleLogin({
        email: targetEmail.toLowerCase(),
        fullName: targetEmail.split('@')[0].replace('.', ' '),
      });

      if (res && res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      } else {
        const msg = res?.message || 'Google Sign-In failed';
        setErrorMsg(msg);
        showAlert('Google Auth Error', msg);
      }
    } catch (err: any) {
      let msg = 'Google Sign-In failed';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Server connection timed out. Please try again in a few seconds.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
      showAlert('Google Auth Error', msg);
    } finally {
      setGoogleLoading(false);
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

          <Button
            title="🌐 Continue with Google"
            variant="secondary"
            onPress={() => setGoogleModalVisible(true)}
            loading={googleLoading}
            style={styles.googleBtn}
          />

          <Button
            title="🐙 Continue with GitHub"
            variant="outline"
            onPress={() => {
              showAlert('GitHub Auth', 'Enter your GitHub username during profile creation or sign in with your campus email.');
            }}
            style={styles.githubBtn}
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

        {/* Google Account Modal */}
        {googleModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🌐 Sign in with Google</Text>
              <Text style={styles.modalSubtitle}>Choose or enter your Google / Campus Gmail address</Text>

              <Input
                label="Google Email Address"
                placeholder="your.email@gmail.com or @campus.edu"
                value={googleEmailInput}
                onChangeText={setGoogleEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.quickAccountsLabel}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Or quick-select demo account:</Text>
              </View>

              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={styles.accountChip}
                  onPress={() => handleGoogleSubmit('alex.chen@campus.edu')}
                >
                  <Text style={styles.accountChipText}>Alex Chen (alex.chen@campus.edu)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.accountChip}
                  onPress={() => handleGoogleSubmit('maya.patel@campus.edu')}
                >
                  <Text style={styles.accountChipText}>Maya Patel (maya.patel@campus.edu)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setGoogleModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Sign In"
                  onPress={() => handleGoogleSubmit()}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </View>
          </View>
        )}
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
  googleBtn: {
    marginTop: 12,
  },
  githubBtn: {
    marginTop: 12,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  quickAccountsLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  chipRow: {
    marginBottom: 16,
  },
  accountChip: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  accountChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});
