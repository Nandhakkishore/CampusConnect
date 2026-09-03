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

          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile', { profile })}
            variant="outline"
            style={styles.editBtn}
          />
        </View>

        {profile?.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bio</Text>
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
              <Text style={styles.emptyTagText}>No skills added yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Looking For</Text>
          <View style={styles.tagContainer}>
            {profile?.lookingFor && profile.lookingFor.length > 0 ? (
              profile.lookingFor.map((item, idx) => (
                <Badge key={idx} label={item} variant="secondary" size="md" />
              ))
            ) : (
              <Text style={styles.emptyTagText}>No preferences set.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portfolio & Links</Text>
          {profile?.githubUrl ? (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(profile.githubUrl!)}
            >
              <Text style={styles.linkPrefix}>GitHub:</Text>
              <Text style={styles.linkText}>{profile.githubUrl}</Text>
            </TouchableOpacity>
          ) : null}

          {profile?.portfolioUrl ? (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(profile.portfolioUrl!)}
            >
              <Text style={styles.linkPrefix}>Portfolio:</Text>
              <Text style={styles.linkText}>{profile.portfolioUrl}</Text>
            </TouchableOpacity>
          ) : null}

          {!profile?.githubUrl && !profile?.portfolioUrl && (
            <Text style={styles.emptyTagText}>No social links added yet.</Text>
          )}
        </View>

        <Button
          title="Log Out"
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
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  editBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkPrefix: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: 10,
    marginBottom: 30,
  },
});
