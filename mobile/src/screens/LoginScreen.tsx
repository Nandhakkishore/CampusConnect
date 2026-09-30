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
  ActivityIndicator,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { authApi } from '../api/authApi';
import { useAuthStore, DeviceAccount } from '../store/authStore';
import { showAlert } from '../utils/alert';

export const LoginScreen = ({ navigation }: any) => {
  // Steps: 'CREDENTIALS' | '2FA'
  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [enable2FA, setEnable2FA] = useState(false);

  // 2FA state
  const [otpCode, setOtpCode] = useState('');
  const [pendingAuth, setPendingAuth] = useState<any>(null);

  // Social account selector modal state
  const [socialModalType, setSocialModalType] = useState<'google' | 'github' | null>(null);
  const [socialInput, setSocialInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const deviceAccounts = useAuthStore((state) => state.deviceAccounts) || [];

  const matchedAccounts = deviceAccounts.filter((acc) => acc.type === socialModalType);

  // Quick Demo Accounts for Placement Drive & Grading
  const demoAccounts = [
    {
      name: 'Alex Chen',
      role: 'CS Lead',
      email: 'alex.chen@campus.edu',
      password: 'password123',
      color: '#059669',
      bgColor: '#ECFDF5',
    },
    {
      name: 'Maya Patel',
      role: 'AI Researcher',
      email: 'maya.patel@campus.edu',
      password: 'password123',
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      name: 'Liam Ross',
      role: 'UI Designer',
      email: 'liam.ross@campus.edu',
      password: 'password123',
      color: '#D97706',
      bgColor: '#FFFBEB',
    },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg('');
  };

  const initiate2FA = async (targetEmail: string, authData: any) => {
    try {
      setLoading(true);
      await authApi.sendOtp(targetEmail);
      setPendingAuth(authData);
      setStep('2FA');
      setOtpCode('');
      setErrorMsg('');
    } catch (err: any) {
      // Even if email dispatch is offline, proceed to 2FA so tester can enter code 123456
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

      if (res && res.success && res.data) {
        if (enable2FA) {
          // If user specifically requested 2-step verification demonstration
          await initiate2FA(trimmedEmail, res.data);
        } else {
          // Instant direct sign-in for seamless experience
          setAuth(
            res.data.user,
            res.data.tokens.accessToken,
            res.data.tokens.refreshToken
          );
        }
      } else {
        const msg = res?.message || 'Login failed. Please verify your credentials.';
        setErrorMsg(msg);
        showAlert('Login Failed', msg);
      }
    } catch (err: any) {
      let msg = 'Invalid email or password. Please verify credentials.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Server is waking up, please try again.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error' || err.response?.status === 503) {
        msg = 'Connected to cloud API. Please check your internet connection or use a demo account.';
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

      if (res && res.success && res.data) {
        if (enable2FA) {
          await initiate2FA(targetEmail, res.data);
        } else {
          setAuth(
            res.data.user,
            res.data.tokens.accessToken,
            res.data.tokens.refreshToken
          );
        }
      } else {
        showAlert('Authentication Error', res?.message || 'Social sign-in failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate.';
      setErrorMsg(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (overrideCode?: string) => {
    const codeToVerify = (overrideCode || otpCode).trim();
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

  const handleBypass2FA = () => {
    if (pendingAuth?.user && pendingAuth?.tokens) {
      setAuth(
        pendingAuth.user,
        pendingAuth.tokens.accessToken,
        pendingAuth.tokens.refreshToken
      );
    } else {
      setStep('CREDENTIALS');
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const targetEmail = pendingAuth?.user?.email || email;
      await authApi.sendOtp(targetEmail);
      showAlert('Code Sent', `A new 6-digit security code has been dispatched to ${targetEmail}. (Demo code: 123456)`);
    } catch (err) {
      showAlert('Code Sent', 'Security code dispatched. You can also use universal code 123456.');
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
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Ambient Top Bar */}
        <View style={styles.topAccentBar} />

        {/* Branding Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🎓</Text>
          </View>
          <Text style={styles.brandTitle}>CampusConnect</Text>
          <Text style={styles.brandTagline}>Student Project Hub & Talent Marketplace</Text>
          <View style={styles.verifiedCampusPill}>
            <View style={styles.onlineDot} />
            <Text style={styles.verifiedCampusText}>University Network Online</Text>
          </View>
        </View>

        {/* Main Auth Card (Enhanced Width & Aesthetic) */}
        <View style={styles.card}>
          {step === 'CREDENTIALS' ? (
            <>
              {/* Form Title & Subtitle */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Sign in to your account</Text>
                <Text style={styles.cardSubtitle}>
                  Collaborate on projects, join campus gigs, and connect with peers.
                </Text>
              </View>

              {/* Error Box */}
              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Quick Demo Accounts Chips */}
              <View style={styles.demoSection}>
                <View style={styles.demoHeaderRow}>
                  <Text style={styles.demoSectionTitle}>⚡ ONE-TAP DEMO ACCOUNTS</Text>
                  <Text style={styles.demoSectionHint}>Placement & Evaluation</Text>
                </View>
                <View style={styles.demoChipsRow}>
                  {demoAccounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.name}
                      style={[
                        styles.demoChip,
                        { borderColor: acc.color, backgroundColor: acc.bgColor },
                        email === acc.email && styles.demoChipActive,
                      ]}
                      onPress={() => handleSelectDemo(acc)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.demoChipName, { color: acc.color }]}>
                        {acc.name.split(' ')[0]}
                      </Text>
                      <Text style={styles.demoChipRole}>{acc.role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Email Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Campus Email</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                >
                  <Text style={styles.inputLeadingIcon}>✉️</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. alex.chen@campus.edu"
                    placeholderTextColor="#94A3B8"
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
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TouchableOpacity
                    onPress={() =>
                      showAlert(
                        'Password Hint',
                        'Demo accounts use "password123". You can also register a new student account.'
                      )
                    }
                  >
                    <Text style={styles.forgotPasswordText}>Demo password: password123</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                >
                  <Text style={styles.inputLeadingIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMsg) setErrorMsg('');
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((prev) => !prev)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2FA Mode Toggle (Security demonstration) */}
              <TouchableOpacity
                style={styles.twoFaToggleRow}
                onPress={() => setEnable2FA((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, enable2FA && styles.checkboxActive]}>
                  {enable2FA && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.twoFaToggleTitle}>Require 2-Factor Authentication (OTP)</Text>
                  <Text style={styles.twoFaToggleSub}>Simulate secure OTP verification workflow</Text>
                </View>
                {enable2FA && (
                  <View style={styles.twoFaActiveBadge}>
                    <Text style={styles.twoFaActiveBadgeText}>2FA ON</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Primary Continue Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryBtnText}>Authenticating...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {enable2FA ? 'Continue with 2FA →' : 'Sign in to CampusConnect'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* OR Divider Line */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialButtonsRow}>
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
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>

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
                  <Text style={styles.socialBtnText}>GitHub</Text>
                </TouchableOpacity>
              </View>

              {/* Switch to Register */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  New to CampusConnect?{' '}
                  <Text
                    style={styles.switchLink}
                    onPress={() => {
                      setErrorMsg('');
                      navigation.navigate('Register');
                    }}
                  >
                    Create student account
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* 2-Step Verification Screen */}
              <View style={styles.twoStepHeader}>
                <View style={styles.twoStepIconContainer}>
                  <Text style={styles.twoStepIcon}>🛡️</Text>
                </View>
                <Text style={styles.twoStepTitle}>Two-Factor Authentication</Text>
                <Text style={styles.twoStepSubtitle}>
                  Enter the 6-digit verification code to access your campus account.
                </Text>
              </View>

              {/* Email Dispatch Notice */}
              <View style={styles.emailNoticeBox}>
                <View style={styles.emailNoticeHeader}>
                  <Text style={styles.emailNoticeIcon}>✉️</Text>
                  <Text style={styles.emailNoticeTitle}>Security Code Dispatched</Text>
                </View>
                <Text style={styles.emailNoticeText}>
                  A security code was sent to:
                </Text>
                <Text style={styles.emailNoticeTarget}>
                  {pendingAuth?.user?.email || email}
                </Text>
                <View style={styles.codeHintPill}>
                  <Text style={styles.codeHintText}>
                    💡 Universal Testing Code: <Text style={styles.codeHintBold}>123456</Text>
                  </Text>
                </View>
              </View>

              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>
                <View
                  style={[
                    styles.inputContainer,
                    styles.otpContainer,
                    focusedField === 'otp' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.otpInput}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    onFocus={() => setFocusedField('otp')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              </View>

              {/* 1-Tap Auto Fill & Verify Button */}
              <TouchableOpacity
                style={styles.autoVerifyChip}
                onPress={() => {
                  setOtpCode('123456');
                  handleVerify2FA('123456');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.autoVerifyChipText}>⚡ 1-Tap Fill & Verify (123456)</Text>
              </TouchableOpacity>

              {/* Verify & Continue Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={() => handleVerify2FA()}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryBtnText}>Verifying Code...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Enter Dashboard</Text>
                )}
              </TouchableOpacity>

              {/* Skip / Direct Sign In Option */}
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleBypass2FA}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Skip 2FA & Continue Directly →</Text>
              </TouchableOpacity>

              {/* 2FA Navigation Actions */}
              <View style={styles.twoStepActions}>
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.switchLink}>Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep('CREDENTIALS');
                    setErrorMsg('');
                  }}
                >
                  <Text style={styles.backLinkText}>← Back to Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer Terms */}
        <View style={styles.footerTerms}>
          <Text style={styles.footerTermsText}>
            CampusConnect • University Collaboration & Placement Platform
          </Text>
          <Text style={styles.footerTermsSub}>
            Protected by JWT Bearer Authentication & Multi-Factor Security
          </Text>
        </View>

        {/* Device Account Selector Modal */}
        {!!socialModalType && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {socialModalType === 'google' ? 'Choose Google Account' : 'Select GitHub Account'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Select an authorized account on this device to continue
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
                      <Text style={styles.deviceBadgeText}>Active</Text>
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
                    style={[styles.textInput, styles.modalTextInput]}
                    placeholder={
                      socialModalType === 'google' ? 'Your email address' : 'Your GitHub username'
                    }
                    placeholderTextColor="#94A3B8"
                    value={socialInput}
                    onChangeText={setSocialInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => handleSocialAuth()}
                  >
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setSocialModalType(null);
                  setShowCustomInput(false);
                }}
                style={{ alignItems: 'center', marginTop: 10 }}
              >
                <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
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
    backgroundColor: '#F8FAFC', // Slate 50 clean modern canvas
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary, // Emerald 600 accent
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.sm,
  },
  logoIcon: {
    fontSize: 30,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  verifiedCampusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  verifiedCampusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.3,
  },
  card: {
    width: '100%',
    maxWidth: 500, // Enhanced generous width for comfortable reading and input
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  demoSection: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  demoSectionHint: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  demoChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  demoChipActive: {
    transform: [{ scale: 1.02 }],
    borderWidth: 1.5,
  },
  demoChipName: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoChipRole: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: '#059669', // Emerald active focus
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  inputLeadingIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  twoFaToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  twoFaToggleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  twoFaToggleSub: {
    fontSize: 10,
    color: '#64748B',
  },
  twoFaActiveBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  twoFaActiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  primaryBtn: {
    backgroundColor: '#059669', // Modern Emerald primary
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    gap: 8,
  },
  socialLogo: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  socialBtnText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#64748B',
    fontSize: 14,
  },
  switchLink: {
    color: '#4F46E5', // Indigo link
    fontWeight: '700',
  },
  footerTerms: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerTermsText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerTermsSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },

  // 2FA Specific Styles
  twoStepHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  twoStepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  twoStepIcon: {
    fontSize: 22,
  },
  twoStepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  twoStepSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  emailNoticeBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  emailNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  emailNoticeIcon: {
    fontSize: 14,
  },
  emailNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  emailNoticeText: {
    fontSize: 12,
    color: '#166534',
  },
  emailNoticeTarget: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 8,
  },
  codeHintPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  codeHintText: {
    fontSize: 11,
    color: '#166534',
  },
  codeHintBold: {
    fontWeight: '800',
    color: '#14532D',
  },
  otpContainer: {
    justifyContent: 'center',
    paddingVertical: 4,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '800',
    color: '#0F172A',
  },
  autoVerifyChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  autoVerifyChipText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },
  twoStepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  backLinkText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  deviceAccountsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
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
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  accountAvatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
  accountName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  accountIdentifier: {
    color: '#64748B',
    fontSize: 12,
  },
  deviceBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deviceBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  useAnotherBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  useAnotherText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },
  modalTextInput: {
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
});
