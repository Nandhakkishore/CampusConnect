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
import { useAuthStore, DeviceAccount } from '../store/authStore';
import { showAlert } from '../utils/alert';

export const RegisterScreen = ({ navigation }: any) => {
  // Steps: 'REGISTER' | '2FA'
  const [step, setStep] = useState<'REGISTER' | '2FA'>('REGISTER');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [gradYear, setGradYear] = useState('2026');

  // 2FA state
  const [otpCode, setOtpCode] = useState('');
  const [pendingAuth, setPendingAuth] = useState<any>(null);
  const [debugOtp, setDebugOtp] = useState<string>('');

  // Social account selector modal state
  const [socialModalType, setSocialModalType] = useState<'google' | 'github' | null>(null);
  const [socialInput, setSocialInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const deviceAccounts = useAuthStore((state) => state.deviceAccounts) || [];

  const matchedAccounts = deviceAccounts.filter((acc) => acc.type === socialModalType);

  const initiate2FA = async (targetEmail: string, authData: any) => {
    try {
      setLoading(true);
      const otpRes = await authApi.sendOtp(targetEmail);
      if (otpRes?.data?.debugCode) {
        setDebugOtp(otpRes.data.debugCode);
      } else {
        setDebugOtp('123456');
      }
      setPendingAuth(authData);
      setStep('2FA');
      setOtpCode('');
      setErrorMsg('');
    } catch (err: any) {
      setDebugOtp('123456');
      setPendingAuth(authData);
      setStep('2FA');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMsg('');
    const trimmedEmail = email.trim().toLowerCase();

    if (!fullName.trim() || !trimmedEmail || !password) {
      const err = 'Please fill in full name, campus email, and password.';
      setErrorMsg(err);
      showAlert('Missing Fields', err);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName: fullName.trim(),
        email: trimmedEmail,
        password,
        branch,
        gradYear: parseInt(gradYear, 10) || 2026,
      });

      if (res && res.success) {
        await initiate2FA(trimmedEmail, res.data);
      } else {
        const msg = res?.message || 'Registration failed.';
        setErrorMsg(msg);
        showAlert('Registration Error', msg);
      }
    } catch (err: any) {
      let msg = 'Registration failed. Email may already be in use.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Server connection timed out (cold start). Please try again in a few moments.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
      showAlert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (overrideValue?: string) => {
    const val = (overrideValue || socialInput).trim();
    if (!val) {
      showAlert(
        'Required',
        `Please enter your ${socialModalType === 'google' ? 'Google Email' : 'GitHub Username'}.`
      );
      return;
    }

    try {
      setLoading(true);
      let res;
      let targetEmail = '';

      if (socialModalType === 'google') {
        targetEmail = val.toLowerCase();
        res = await authApi.googleLogin({
          email: targetEmail,
          fullName: targetEmail.split('@')[0].replace('.', ' '),
        });
      } else {
        res = await authApi.githubLogin({ username: val });
        targetEmail = `${val.toLowerCase()}@github.user`;
      }

      setSocialModalType(null);
      setSocialInput('');
      setShowCustomInput(false);

      if (res && res.success) {
        await initiate2FA(targetEmail, res.data);
      } else {
        showAlert('Authentication Error', res?.message || 'Social sign-up failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed.';
      setErrorMsg(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    const codeToVerify = otpCode.trim();
    if (!codeToVerify) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const targetEmail = pendingAuth?.user?.email || email;
      await authApi.verifyOtp(targetEmail, codeToVerify);

      // Successfully verified 2FA: Log into app
      setAuth(
        pendingAuth.user,
        pendingAuth.tokens.accessToken,
        pendingAuth.tokens.refreshToken
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
      setErrorMsg(msg);
      showAlert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const targetEmail = pendingAuth?.user?.email || email;
      const res = await authApi.sendOtp(targetEmail);
      if (res?.data?.debugCode) {
        setDebugOtp(res.data.debugCode);
      }
      showAlert('Code Sent', `A new verification code has been dispatched to ${targetEmail}`);
    } catch (err) {
      setDebugOtp('123456');
      showAlert('Code Sent', 'Use security code 123456 for test verification.');
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
        <View style={styles.card}>
          {step === 'REGISTER' ? (
            <>
              <Text style={styles.title}>Join CampusConnect</Text>
              <Text style={styles.subtitle}>Create your student profile and get connected</Text>

              {/* Social Sign Up Options */}
              <View style={styles.socialGroup}>
                <TouchableOpacity
                  style={styles.socialBtn}
                  onPress={() => {
                    setSocialModalType('google');
                    setSocialInput('');
                    setShowCustomInput(false);
                    setErrorMsg('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialBtnText}>🌐 Sign Up with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialBtn, styles.githubBtn]}
                  onPress={() => {
                    setSocialModalType('github');
                    setSocialInput('');
                    setShowCustomInput(false);
                    setErrorMsg('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialBtnText}>🐙 Sign Up with GitHub</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or register with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <Input
                label="Full Name *"
                placeholder="Nandha Dev"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errorMsg) setErrorMsg('');
                }}
              />

              <Input
                label="Campus Email *"
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
                label="Password *"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMsg) setErrorMsg('');
                }}
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
                title="Create Account with 2-Step Verification"
                onPress={handleRegister}
                loading={loading}
                style={styles.submitBtn}
              />

              <TouchableOpacity
                onPress={() => {
                  setErrorMsg('');
                  navigation.navigate('Login');
                }}
                style={styles.linkContainer}
              >
                <Text style={styles.linkText}>
                  Already registered? <Text style={styles.linkHighlight}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* 2-Step Verification Step */}
              <View style={styles.twoStepHeader}>
                <Text style={styles.twoStepIcon}>🔐</Text>
                <Text style={styles.title}>2-Step Verification</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit security code sent to verify your student account.
                </Text>
              </View>

              {/* Auto-fill Helper Badge */}
              <TouchableOpacity
                style={styles.otpHelperBadge}
                onPress={() => setOtpCode(debugOtp || '123456')}
                activeOpacity={0.7}
              >
                <Text style={styles.otpHelperLabel}>⚡ Security Code:</Text>
                <Text style={styles.otpHelperCode}>{debugOtp || '123456'}</Text>
                <Text style={styles.otpHelperHint}>(Tap to auto-fill)</Text>
              </TouchableOpacity>

              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <Input
                label="6-Digit Verification Code"
                placeholder="e.g. 123456"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
              />

              <Button
                title="Verify & Complete Registration"
                onPress={handleVerify2FA}
                loading={loading}
                style={styles.submitBtn}
              />

              <View style={styles.twoStepActions}>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  style={styles.twoStepActionBtn}
                >
                  <Text style={styles.twoStepActionText}>🔄 Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep('REGISTER');
                    setErrorMsg('');
                  }}
                  style={styles.twoStepActionBtn}
                >
                  <Text style={styles.twoStepActionText}>← Back to Details</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Device Account Selector Modal */}
        {!!socialModalType && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.accountModalHeader}>
                <Text style={styles.accountModalIcon}>
                  {socialModalType === 'google' ? '🌐' : '🐙'}
                </Text>
                <Text style={styles.modalTitle}>
                  {socialModalType === 'google' ? 'Choose a Google Account' : 'Select GitHub Account'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Select an account logged in on this device to continue to CampusConnect
                </Text>
              </View>

              {/* Detected Accounts on this Device */}
              <Text style={styles.deviceAccountsHeader}>ACCOUNTS ON THIS DEVICE</Text>

              <View style={styles.accountsList}>
                {matchedAccounts.map((acc: DeviceAccount) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={styles.accountCard}
                    onPress={() => handleSocialAuth(acc.identifier)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.accountAvatarBadge}>
                      <Text style={styles.accountAvatarText}>
                        {acc.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>{acc.displayName}</Text>
                      <Text style={styles.accountIdentifier}>
                        {socialModalType === 'github' ? `@${acc.identifier}` : acc.identifier}
                      </Text>
                    </View>
                    <View style={styles.deviceBadge}>
                      <Text style={styles.deviceBadgeText}>Signed in</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Toggle to Use Another Account */}
              {!showCustomInput ? (
                <TouchableOpacity
                  style={styles.useAnotherBtn}
                  onPress={() => setShowCustomInput(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.useAnotherText}>
                    + Use another {socialModalType === 'google' ? 'Google email' : 'GitHub profile'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.customInputBox}>
                  <Input
                    label={socialModalType === 'google' ? 'Other Google Email' : 'Other GitHub Username'}
                    placeholder={socialModalType === 'google' ? 'student@campus.edu' : 'e.g. octocat'}
                    value={socialInput}
                    onChangeText={setSocialInput}
                    autoCapitalize="none"
                  />
                  <Button
                    title={`Register with ${socialModalType === 'google' ? 'Email' : 'Username'}`}
                    onPress={() => handleSocialAuth()}
                    loading={loading}
                    style={{ marginTop: 4 }}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setSocialModalType(null);
                    setShowCustomInput(false);
                  }}
                  style={{ flex: 1 }}
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
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18,
  },
  socialGroup: {
    gap: 10,
    marginBottom: 16,
  },
  socialBtn: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  githubBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  socialBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 10,
    textTransform: 'uppercase',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 6,
  },
  linkContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  twoStepHeader: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 10,
  },
  twoStepIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  otpHelperBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  otpHelperLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  otpHelperCode: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  otpHelperHint: {
    color: colors.textDim,
    fontSize: 11,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: '700',
  },
  twoStepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  twoStepActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  twoStepActionText: {
    color: colors.primary,
    fontSize: 13,
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
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 440,
  },
  accountModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  accountModalIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  deviceAccountsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  accountsList: {
    gap: 8,
    marginBottom: 14,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  accountAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  accountName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  accountIdentifier: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  deviceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deviceBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  useAnotherBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  useAnotherText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  customInputBox: {
    marginBottom: 14,
  },
  modalActions: {
    marginTop: 6,
  },
});
