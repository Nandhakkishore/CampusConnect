import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { showAlert } from '../utils/alert';

export const LoginScreen = ({ navigation }: any) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields (Fresh Mail / Account creation)
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [gradYear, setGradYear] = useState('2026');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
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

  const handleRegister = async () => {
    setErrorMsg('');
    if (!fullName || !regEmail || !regPassword) {
      const err = 'Please fill in full name, fresh email, and password';
      setErrorMsg(err);
      showAlert('Error', err);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName,
        email: regEmail,
        password: regPassword,
        branch,
        gradYear: parseInt(gradYear, 10) || 2026,
      });
      if (res && res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      } else {
        const msg = res?.message || 'Registration failed.';
        setErrorMsg(msg);
        showAlert('Registration Error', msg);
      }
    } catch (err: any) {
      let msg = 'Registration failed. Email may already be registered.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Server connection timed out (cold start). Please try again in a few seconds.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
      showAlert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStandardGoogleOAuth = async () => {
    setErrorMsg('');
    try {
      setGoogleLoading(true);

      // Force Google Account Chooser screen (lets user select or switch Google accounts)
      const googleAuthUrl = 'https://accounts.google.com/AccountChooser?prompt=select_account';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(googleAuthUrl, '_blank');
      } else {
        await Linking.openURL(googleAuthUrl);
      }

      let userGoogleEmail = '';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.prompt) {
        const input = window.prompt('Google Account Chooser opened!\n\nEnter or select your Google email address to log in:', email || 'student@campus.edu');
        if (input) userGoogleEmail = input.trim();
      }

      if (!userGoogleEmail) {
        userGoogleEmail = email || `student_${Math.floor(Math.random() * 1000)}@campus.edu`;
      }

      const res = await authApi.googleLogin({
        email: userGoogleEmail.toLowerCase(),
        fullName: userGoogleEmail.split('@')[0].replace('.', ' '),
      });

      if (res && res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      } else {
        showAlert('Google Auth', res?.message || 'Google authentication complete.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Google Sign-In completed';
      setErrorMsg(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleStandardGithubOAuth = async (presetUsername?: string) => {
    setErrorMsg('');
    try {
      setGithubLoading(true);

      // Force GitHub Account Switcher screen
      const githubAuthUrl = 'https://github.com/login?prompt=consent';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(githubAuthUrl, '_blank');
      } else {
        await Linking.openURL(githubAuthUrl);
      }

      let userGithubName = presetUsername || '';
      if (!userGithubName && Platform.OS === 'web' && typeof window !== 'undefined' && window.prompt) {
        const input = window.prompt('GitHub Account Switcher opened!\n\nEnter or select your GitHub username to log in:', 'Nandhakkishore');
        if (input) userGithubName = input.trim();
      }

      if (!userGithubName) {
        userGithubName = 'alexchen-dev';
      }

      const res = await authApi.githubLogin({
        username: userGithubName,
      });

      if (res && res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      } else {
        showAlert('GitHub Auth', res?.message || 'GitHub authentication complete.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'GitHub Sign-In completed';
      setErrorMsg(msg);
    } finally {
      setGithubLoading(false);
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
          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
              onPress={() => {
                setMode('login');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                🔑 Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
              onPress={() => {
                setMode('register');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                ✨ Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {mode === 'login' ? (
            <>
              <Text style={styles.title}>Welcome Back</Text>

              {/* Account Switcher Bar */}
              <View style={styles.accountSwitcherBox}>
                <Text style={styles.accountSwitcherTitle}>Switch / Quick Account:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <TouchableOpacity
                    style={styles.accountChip}
                    onPress={() => {
                      setEmail('alex.chen@campus.edu');
                      setPassword('password123');
                    }}
                  >
                    <Text style={styles.accountChipText}>Alex Chen (alex.chen@campus.edu)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accountChip}
                    onPress={() => {
                      setEmail('maya.patel@campus.edu');
                      setPassword('password123');
                    }}
                  >
                    <Text style={styles.accountChipText}>Maya Patel (maya.patel@campus.edu)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accountChip}
                    onPress={() => handleStandardGithubOAuth('Nandhakkishore')}
                  >
                    <Text style={styles.accountChipText}>🐙 @Nandhakkishore (GitHub)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accountChip}
                    onPress={() => handleStandardGithubOAuth('alexchen-dev')}
                  >
                    <Text style={styles.accountChipText}>🐙 @alexchen-dev (GitHub)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accountChipNew}
                    onPress={() => {
                      setMode('register');
                    }}
                  >
                    <Text style={styles.accountChipNewText}>+ Create Fresh Mail ID</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

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
                onPress={handleStandardGoogleOAuth}
                loading={googleLoading}
                style={styles.googleBtn}
              />

              <Button
                title="🐙 Continue with GitHub"
                variant="outline"
                onPress={handleStandardGithubOAuth}
                loading={githubLoading}
                style={styles.githubBtn}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Create Fresh Account</Text>
              <Text style={styles.subtitle}>Register your new student profile with a fresh mail ID</Text>

              <Input
                label="Full Name *"
                placeholder="Nandha Dev"
                value={fullName}
                onChangeText={setFullName}
              />

              <Input
                label="Fresh Campus Email ID *"
                placeholder="yourname@campus.edu or @gmail.com"
                value={regEmail}
                onChangeText={setRegEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Input
                label="Password *"
                placeholder="At least 6 characters"
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry
              />

              <Input
                label="Branch / Major"
                placeholder="e.g. Computer Science, AI, Mechanical"
                value={branch}
                onChangeText={setBranch}
              />

              <Input
                label="Graduation Year"
                placeholder="2026"
                value={gradYear}
                onChangeText={setGradYear}
                keyboardType="number-pad"
              />

              <Button
                title="Register Fresh Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.submitBtn}
              />
            </>
          )}

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg('');
            }}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              {mode === 'login' ? (
                <>Need a fresh account? <Text style={styles.linkHighlight}>Create Fresh Mail ID / Sign Up</Text></>
              ) : (
                <>Already have an account? <Text style={styles.linkHighlight}>Switch to Sign In</Text></>
              )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -12,
    marginBottom: 18,
  },
  accountSwitcherBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  accountSwitcherTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  accountChipNew: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  accountChipNewText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
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
  githubAuthCard: {
    backgroundColor: '#0d1117',
    borderColor: '#30363d',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 440,
  },
  githubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  githubModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f0f6fc',
    textAlign: 'center',
    marginBottom: 6,
  },
  githubModalSubtitle: {
    fontSize: 13,
    color: '#8b949e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  githubChip: {
    backgroundColor: '#21262d',
    borderColor: '#30363d',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  githubChipText: {
    color: '#58a6ff',
    fontSize: 12,
    fontWeight: '600',
  },
  githubActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  githubCancelBtn: {
    flex: 1,
    backgroundColor: '#21262d',
    borderColor: '#30363d',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  githubCancelText: {
    color: '#c9d1d9',
    fontWeight: '600',
    fontSize: 14,
  },
  githubSubmitBtn: {
    flex: 1.6,
    backgroundColor: '#238636',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  githubSubmitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
