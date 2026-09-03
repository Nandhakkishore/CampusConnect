import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { showAlert } from '../utils/alert';

export const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [gradYear, setGradYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    setErrorMsg('');
    if (!fullName || !email || !password) {
      const err = 'Please fill in all required fields';
      setErrorMsg(err);
      showAlert('Error', err);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName,
        email,
        password,
        branch,
        gradYear: parseInt(gradYear, 10) || 2026,
      });
      if (res.success) {
        setAuth(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try a different email or password.';
      setErrorMsg(msg);
      showAlert('Registration Error', msg);
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
        <View style={styles.card}>
          <Text style={styles.title}>Join CampusConnect</Text>
          <Text style={styles.subtitle}>Create your student profile and get connected</Text>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Input
            label="Full Name *"
            placeholder="Alex Dev"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Campus Email *"
            placeholder="student@campus.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password *"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
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
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Already registered? <Text style={styles.linkHighlight}>Sign In</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
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
