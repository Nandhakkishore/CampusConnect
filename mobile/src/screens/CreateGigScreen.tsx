import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import apiClient from '../api/client';

export const CreateGigScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend');
  const [stipend, setStipend] = useState('$50 / Bounty');
  const [estimatedTime, setEstimatedTime] = useState('3-5 days');
  const [skillsRequired, setSkillsRequired] = useState('React, TypeScript');
  const [loading, setLoading] = useState(false);

  const handleCreateGig = async () => {
    if (!title || !description || !category) {
      Alert.alert('Missing Fields', 'Please fill in title, description, and category.');
      return;
    }

    const skillsArr = skillsRequired.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      setLoading(true);
      const res = await apiClient.post('/gigs', {
        title,
        description,
        category,
        stipend,
        estimatedTime,
        skillsRequired: skillsArr,
      });

      if (res.data.success) {
        Alert.alert('Success', 'Gig posted on CampusConnect marketplace!');
        navigation.navigate('Gigs');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post gig.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Post a Campus Gig</Text>
        <Text style={styles.subtitle}>Recruit a student peer for mini tasks, bug fixes, or design work.</Text>

        <Input
          label="Gig Title *"
          placeholder="e.g. Build landing page in Tailwind, Fix Express auth bug"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Category *"
          placeholder="e.g. Frontend, Backend, Design / UI, Writing"
          value={category}
          onChangeText={setCategory}
        />

        <Input
          label="Description & Scope *"
          placeholder="Describe deliverables and requirements..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Input
          label="Stipend / Reward"
          placeholder="e.g. $50 Bounty, Coffee Treat, Portfolio Credit"
          value={stipend}
          onChangeText={setStipend}
        />

        <Input
          label="Estimated Completion Time"
          placeholder="e.g. 2 days, 1 week"
          value={estimatedTime}
          onChangeText={setEstimatedTime}
        />

        <Input
          label="Skills Required (Comma-separated)"
          placeholder="React, CSS, Figma, Python"
          value={skillsRequired}
          onChangeText={setSkillsRequired}
        />

        <Button
          title="Post Gig to Marketplace"
          onPress={handleCreateGig}
          loading={loading}
          variant="secondary"
          style={styles.publishBtn}
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
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  publishBtn: {
    marginTop: 20,
    marginBottom: 30,
  },
});
