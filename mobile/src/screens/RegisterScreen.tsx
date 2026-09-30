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

export const RegisterScreen = ({ navigation }: any) => {
  // Steps: 'REGISTER' | '2FA'
  const [step, setStep] = useState<'REGISTER' | '2FA'>('REGISTER');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Computer Science');
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

  const initiate2FA = async (targetEmail: string, authData: any) => {
    try {
      setLoading(true);
      await authApi.sendOtp(targetEmail);
      setPendingAuth(authData);
      setStep('2FA');
      setOtpCode('');
      setErrorMsg('');
    } catch (err: any) {
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
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();

    if (!firstName.trim() || !trimmedEmail || !password) {
      const err = 'Please enter your name, campus email, and password.';
      setErrorMsg(err);
      showAlert('Missing Fields', err);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName: fullName || firstName.trim(),
        email: trimmedEmail,
        password,
        branch: branch || 'Computer Science',
        gradYear: 2026,
      });

      if (res && res.success && res.data) {
        if (enable2FA) {
          await initiate2FA(trimmedEmail, res.data);
        } else {
          setAuth(
            res.data.user,
            res.data.tokens.accessToken,
            res.data.tokens.refreshToken
          );
        }
      } else {
        const msg = res?.message || 'Registration failed.';
        setErrorMsg(msg);
        showAlert('Registration Error', msg);
      }
    } catch (err: any) {
      let msg = 'Registration failed. Email may already be registered.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Server connection timed out. Please try again in a few moments.';
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
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
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
      setStep('REGISTER');
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const targetEmail = pendingAuth?.user?.email || email;
      await authApi.sendOtp(targetEmail);
      showAlert('Code Sent', `A new 6-digit security code has been sent to ${targetEmail}. (Demo code: 123456)`);
    } catch (err) {
      showAlert('Code Sent', 'A verification code has been dispatched. You can also use code 123456.');
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
        {/* Accent Bar */}
        <View style={styles.topAccentBar} />

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🎓</Text>
          </View>
          <Text style={styles.brandTitle}>Join CampusConnect</Text>
          <Text style={styles.brandTagline}>Showcase projects, build teams, and get hired</Text>
        </View>

        {/* Card Container (Enhanced Width) */}
        <View style={styles.card}>
          {step === 'REGISTER' ? (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Create your student profile</Text>
                <Text style={styles.cardSubtitle}>
                  Connect with fellow student builders, developers, and campus gig posters.
                </Text>
              </View>

              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Name Row */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === 'firstName' && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. John"
                      placeholderTextColor="#94A3B8"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Surname</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === 'surname' && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Doe"
                      placeholderTextColor="#94A3B8"
                      value={surname}
                      onChangeText={(text) => {
                        setSurname(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                      onFocus={() => setFocusedField('surname')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Campus Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Campus Email Address</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                >
                  <Text style={styles.inputLeadingIcon}>✉️</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. student@campus.edu"
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

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Choose Password (min 6 characters)</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                >
                  <Text style={styles.inputLeadingIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create a secure password"
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
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2FA Mode Toggle */}
              <TouchableOpacity
                style={styles.twoFaToggleRow}
                onPress={() => setEnable2FA((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, enable2FA && styles.checkboxActive]}>
                  {enable2FA && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.twoFaToggleTitle}>Enable 2-Step Verification for account</Text>
                  <Text style={styles.twoFaToggleSub}>Extra security layer with 6-digit verification code</Text>
                </View>
              </TouchableOpacity>

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryBtnText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Create Account & Join</Text>
                )}
              </TouchableOpacity>

              {/* OR Divider Line */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
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

              {/* Switch to Sign In */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  Already have an account?{' '}
                  <Text
                    style={styles.switchLink}
                    onPress={() => {
                      setErrorMsg('');
                      navigation.navigate('Login');
                    }}
                  >
                    Sign in
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* 2-Step Verification Step */}
              <View style={styles.twoStepHeader}>
                <View style={styles.twoStepIconContainer}>
                  <Text style={styles.twoStepIcon}>🛡️</Text>
                </View>
                <Text style={styles.twoStepTitle}>Verify your identity</Text>
                <Text style={styles.twoStepSubtitle}>
                  Enter the 6-digit security code sent to verify your student account.
                </Text>
              </View>

              <View style={styles.emailNoticeBox}>
                <View style={styles.emailNoticeHeader}>
                  <Text style={styles.emailNoticeIcon}>✉️</Text>
                  <Text style={styles.emailNoticeTitle}>Security Code Dispatched</Text>
                </View>
                <Text style={styles.emailNoticeText}>
                  Verification code sent to:
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
                  <Text style={styles.primaryBtnText}>Verify & Complete Registration</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleBypass2FA}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Skip 2FA & Complete Directly →</Text>
              </TouchableOpacity>

              <View style={styles.twoStepActions}>
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.switchLink}>Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep('REGISTER');
                    setErrorMsg('');
                  }}
                >
                  <Text style={styles.backLinkText}>← Back to details</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerTerms}>
          <Text style={styles.footerTermsText}>
            By creating an account, you agree to CampusConnect Terms & Privacy
          </Text>
        </View>

        {/* Device Account Modal */}
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: colors.primary,
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
  card: {
    width: '100%',
    maxWidth: 500, // Matching generous 500px width
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
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
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
    borderColor: '#059669',
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
  primaryBtn: {
    backgroundColor: '#059669',
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
    color: '#4F46E5',
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

  // 2FA
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

  // Modal
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
