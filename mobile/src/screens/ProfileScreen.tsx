import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { profileApi } from '../api/profileApi';
import { Profile } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { Skeleton } from '../components/Skeleton';

export const ProfileScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.getMyProfile();
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20 }}>
          <Skeleton height={100} style={{ borderRadius: 16 }} />
          <Skeleton height={160} style={{ borderRadius: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const fullName = profile?.fullName || 'Student Developer';
  const branch = profile?.branch || 'Computer Science';
  const gradYear = profile?.gradYear || 2026;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProfile();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.subText}>
            {branch} • Class of {gradYear}
          </Text>

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified Campus Student</Text>
          </View>

          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile?.skills?.length || 0}</Text>
              <Text style={styles.statLabel}>Skills</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile?.lookingFor?.length || 0}</Text>
              <Text style={styles.statLabel}>Interests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2026</Text>
              <Text style={styles.statLabel}>Grad Cohort</Text>
            </View>
          </View>

          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile', { profile })}
            variant="outline"
            size="sm"
            style={styles.editBtn}
          />
        </View>

        {profile?.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About Me</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Skills</Text>
          <View style={styles.tagContainer}>
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <Badge key={idx} label={skill} variant="primary" size="md" />
              ))
            ) : (
              <Text style={styles.emptyTagText}>No skills listed yet. Tap 'Edit Profile' to add yours!</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seeking Collaborators In</Text>
          <View style={styles.tagContainer}>
            {profile?.lookingFor && profile.lookingFor.length > 0 ? (
              profile.lookingFor.map((item, idx) => (
                <Badge key={idx} label={item} variant="secondary" size="md" />
              ))
            ) : (
              <Text style={styles.emptyTagText}>No role preferences set.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Developer Profiles & Portfolios</Text>
          {profile?.githubUrl ? (
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => Linking.openURL(profile.githubUrl!)}
              activeOpacity={0.8}
            >
              <Text style={styles.linkIcon}>🐙</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>GitHub</Text>
                <Text style={styles.linkText} numberOfLines={1}>{profile.githubUrl}</Text>
              </View>
              <Text style={styles.linkArrow}>↗</Text>
            </TouchableOpacity>
          ) : null}

          {profile?.portfolioUrl ? (
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => Linking.openURL(profile.portfolioUrl!)}
              activeOpacity={0.8}
            >
              <Text style={styles.linkIcon}>🌐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>Portfolio Website</Text>
                <Text style={styles.linkText} numberOfLines={1}>{profile.portfolioUrl}</Text>
              </View>
              <Text style={styles.linkArrow}>↗</Text>
            </TouchableOpacity>
          ) : null}

          {!profile?.githubUrl && !profile?.portfolioUrl && (
            <Text style={styles.emptyTagText}>No external portfolio links added yet.</Text>
          )}
        </View>

        <Button
          title="Sign Out"
          onPress={logout}
          variant="danger"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  verifiedBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  verifiedText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  editBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  bioText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyTagText: {
    color: colors.textDim,
    fontSize: 13,
    fontStyle: 'italic',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 1,
  },
  linkArrow: {
    fontSize: 16,
    color: colors.textDim,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
});

