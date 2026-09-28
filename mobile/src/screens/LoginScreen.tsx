import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { authApi } from '../api/authApi';
import { useAuthStore, DeviceAccount } from '../store/authStore';
import { showAlert } from '../utils/alert';

export const LoginScreen = ({ navigation }: any) => {
  // Steps: 'CREDENTIALS' | '2FA'
  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    setErrorMsg('');

    if (!trimmedEmail || !password) {
      const err = 'Please enter your campus email and password.';
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
        await initiate2FA(trimmedEmail, res.data);
      } else {
        const msg = res?.message || 'Login failed. Please verify your credentials.';
        setErrorMsg(msg);
        showAlert('Login Failed', msg);
      }
    } catch (err: any) {
      let msg = 'Invalid email or password. Please try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Server is waking up, please try again in a moment.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error') {
        msg = 'Network error. Please check your internet connection.';
      }
      setErrorMsg(msg);
      showAlert('Login Failed', msg);
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
        showAlert('Authentication Error', res?.message || 'Social sign in failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate.';
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

      setAuth(
        pendingAuth.user,
        pendingAuth.tokens.accessToken,
        pendingAuth.tokens.refreshToken
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid verification code.';
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
        {/* Main Heading (Outside the card, exact match to screenshot) */}
        <Text style={styles.mainTitle}>
          {step === 'CREDENTIALS' ? 'Sign in to CampusConnect' : 'Two-factor authentication'}
        </Text>

        {/* Card Container */}
        <View style={styles.card}>
          {step === 'CREDENTIALS' ? (
            <>
              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Email Address Input */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                  placeholder="Your campus email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                  placeholder="Your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                />
              </View>

              {/* Primary Continue Button (Solid Black) */}
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>
                  {loading ? 'Continuing...' : 'Continue'}
                </Text>
              </TouchableOpacity>

              {/* OR Divider Line */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
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
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.socialLogo}
                />
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* GitHub Button */}
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => {
                  setSocialModalType('github');
                  setSocialInput('');
                  setShowCustomInput(false);
                  setErrorMsg('');
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' }}
                  style={styles.socialLogo}
                />
                <Text style={styles.socialBtnText}>Continue with GitHub</Text>
              </TouchableOpacity>

              {/* Switch to Sign Up inside Card */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  Don't have an account?{' '}
                  <Text
                    style={styles.switchLink}
                    onPress={() => {
                      setErrorMsg('');
                      navigation.navigate('Register');
                    }}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* 2-Step Verification Step */}
              <Text style={styles.twoStepTitle}>Verify your identity</Text>
              <Text style={styles.twoStepSubtitle}>
                Enter the 6-digit security code sent to verify your account.
              </Text>

              {/* Auto-fill Helper Badge */}
              <TouchableOpacity
                style={styles.otpHelperBadge}
                onPress={() => setOtpCode(debugOtp || '123456')}
                activeOpacity={0.7}
              >
                <Text style={styles.otpHelperLabel}>Security Code:</Text>
                <Text style={styles.otpHelperCode}>{debugOtp || '123456'}</Text>
                <Text style={styles.otpHelperHint}>(Tap to auto-fill)</Text>
              </TouchableOpacity>

              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.otpInput,
                    focusedField === 'otp' && styles.inputFocused,
                  ]}
                  placeholder="123456"
                  placeholderTextColor="#9CA3AF"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleVerify2FA}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Text>
              </TouchableOpacity>

              <View style={styles.twoStepActions}>
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.switchLink}>Resend code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep('CREDENTIALS');
                    setErrorMsg('');
                  }}
                >
                  <Text style={styles.switchLink}>← Back to login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer Outside the Card (Matches screenshot) */}
        <View style={styles.footerTerms}>
          <Text style={styles.footerTermsText}>
            By signing in, you agree to the
          </Text>
          <Text style={styles.footerTermsText}>
            Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Device Account Selector Modal */}
        {!!socialModalType && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {socialModalType === 'google' ? 'Choose a Google Account' : 'Select GitHub Account'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Select an account on this device to continue to CampusConnect
              </Text>

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
                <View style={{ marginBottom: 14 }}>
                  <TextInput
                    style={[styles.input, { marginBottom: 10 }]}
                    placeholder={socialModalType === 'google' ? 'Your email address' : 'Your GitHub username'}
                    placeholderTextColor="#9CA3AF"
                    value={socialInput}
                    onChangeText={setSocialInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => handleSocialAuth()}
                  >
                    <Text style={styles.continueBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setSocialModalType(null);
                  setShowCustomInput(false);
                }}
                style={{ alignItems: 'center', marginTop: 8 }}
              >
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF', // Clean white background like screenshot
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.4,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputFocused: {
    borderColor: '#6366F1', // Indigo focus border like screenshot
  },
  continueBtn: {
    backgroundColor: '#000000', // Solid black continue button like screenshot
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 11,
    marginBottom: 10,
  },
  socialLogo: {
    width: 18,
    height: 18,
    marginRight: 10,
    resizeMode: 'contain',
  },
  socialBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  switchText: {
    color: '#4B5563',
    fontSize: 14,
  },
  switchLink: {
    color: '#6366F1', // Indigo link color like screenshot
    fontWeight: '500',
  },
  footerTerms: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerTermsText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  twoStepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  twoStepSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpHelperBadge: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  otpHelperLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  otpHelperCode: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  otpHelperHint: {
    color: '#9CA3AF',
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
    marginTop: 18,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  deviceAccountsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  accountsList: {
    gap: 8,
    marginBottom: 12,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  accountAvatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '700',
  },
  accountName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  accountIdentifier: {
    color: '#6B7280',
    fontSize: 11,
  },
  deviceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deviceBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
  },
  useAnotherBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  useAnotherText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '500',
  },
});
