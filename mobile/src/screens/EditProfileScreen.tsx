import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { profileApi } from '../api/profileApi';

export const EditProfileScreen = ({ route, navigation }: any) => {
  const existing = route.params?.profile || {};

  const [fullName, setFullName] = useState(existing.fullName || '');
  const [bio, setBio] = useState(existing.bio || '');
  const [branch, setBranch] = useState(existing.branch || 'Computer Science');
  const [gradYear, setGradYear] = useState(existing.gradYear ? String(existing.gradYear) : '2026');
  const [skills, setSkills] = useState(existing.skills ? existing.skills.join(', ') : '');
  const [lookingFor, setLookingFor] = useState(existing.lookingFor ? existing.lookingFor.join(', ') : '');
  const [githubUrl, setGithubUrl] = useState(existing.githubUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(existing.portfolioUrl || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    const skillsArray = skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    const lookingForArray = lookingFor.split(',').map((s: string) => s.trim()).filter(Boolean);

    try {
      setLoading(true);
      const res = await profileApi.updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        branch: branch.trim(),
        gradYear: parseInt(gradYear, 10) || 2026,
        skills: skillsArray,
        lookingFor: lookingForArray,
        githubUrl: githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
      });

      if (res.success) {
        Alert.alert('Success', 'Profile updated!');
        navigation.goBack();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Edit Profile</Text>

        <Input
          label="Full Name *"
          value={fullName}
          onChangeText={setFullName}
        />

        <Input
          label="Bio / About Me"
          placeholder="What are you building or interested in?"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />

        <Input
          label="Branch / Major"
          value={branch}
          onChangeText={setBranch}
        />

        <Input
          label="Graduation Year"
          value={gradYear}
          onChangeText={setGradYear}
          keyboardType="number-pad"
        />

        <Input
          label="Skills (Comma-separated)"
          placeholder="React, Node.js, Python, Figma"
          value={skills}
          onChangeText={setSkills}
        />

        <Input
          label="Looking For (Comma-separated)"
          placeholder="Hackathon Partner, Co-founder, UI Designer"
          value={lookingFor}
          onChangeText={setLookingFor}
        />

        <Input
          label="GitHub Profile URL"
          placeholder="https://github.com/username"
          value={githubUrl}
          onChangeText={setGithubUrl}
          autoCapitalize="none"
        />

        <Input
          label="Portfolio / LinkedIn URL"
          placeholder="https://mywebsite.com"
          value={portfolioUrl}
          onChangeText={setPortfolioUrl}
          autoCapitalize="none"
        />

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
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
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  saveBtn: {
    marginTop: 20,
    marginBottom: 30,
  },
});
