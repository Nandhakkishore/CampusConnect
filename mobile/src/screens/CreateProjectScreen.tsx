import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { projectApi } from '../api/projectApi';

const SUGGESTED_STACKS = ['React', 'Node.js', 'Python', 'TypeScript', 'Flutter', 'AI/ML', 'Docker', 'PostgreSQL', 'Tailwind', 'Rust'];

export const CreateProjectScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [selectedTech, setSelectedTech] = useState<string[]>(['React', 'Node.js']);
  const [customTech, setCustomTech] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleStack = (tech: string) => {
    if (selectedTech.includes(tech)) {
      setSelectedTech(selectedTech.filter((t) => t !== tech));
    } else {
      setSelectedTech([...selectedTech, tech]);
    }
  };

  const addCustomStack = () => {
    if (customTech.trim() && !selectedTech.includes(customTech.trim())) {
      setSelectedTech([...selectedTech, customTech.trim()]);
      setCustomTech('');
    }
  };

  const handleCreate = async () => {
    if (!title || !summary || !description) {
      Alert.alert('Required Fields Missing', 'Please fill in Title, Short Summary, and Description.');
      return;
    }

    if (selectedTech.length === 0) {
      Alert.alert('Tech Stack Required', 'Select or add at least one tech stack tag.');
      return;
    }

    try {
      setLoading(true);
      const res = await projectApi.createProject({
        title,
        summary,
        description,
        branch,
        techStack: selectedTech,
        status: 'RECRUITING',
        repositoryUrl,
        demoUrl,
      });

      if (res.success) {
        Alert.alert('Success', 'Project posted to Campus Connect!');
        navigation.navigate('ProjectBoard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create project.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Post a Project Idea</Text>
        <Text style={styles.subtitle}>Pitch your idea and recruit your campus dream team.</Text>

        <Input
          label="Project Title *"
          placeholder="e.g. AI Study Partner, Smart Campus Canteen"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="One-Line Summary *"
          placeholder="Short 1-2 sentence pitch..."
          value={summary}
          onChangeText={setSummary}
          multiline
        />

        <Input
          label="Detailed Description *"
          placeholder="What problem are you solving? What roles are open?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />

        <Input
          label="Target Branch / Department"
          placeholder="e.g. Computer Science, Electrical, Open to All"
          value={branch}
          onChangeText={setBranch}
        />

        <Text style={styles.sectionLabel}>Tech Stack Tags *</Text>
        <View style={styles.techChipsContainer}>
          {SUGGESTED_STACKS.map((tech) => (
            <TouchableOpacity key={tech} onPress={() => toggleStack(tech)}>
              <Badge
                label={tech}
                variant={selectedTech.includes(tech) ? 'primary' : 'outline'}
                size="md"
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customTechRow}>
          <Input
            placeholder="Add custom tag (e.g. PyTorch)..."
            value={customTech}
            onChangeText={setCustomTech}
            style={styles.customInput}
          />
          <Button
            title="+ Add"
            onPress={addCustomStack}
            variant="secondary"
            style={styles.addTagBtn}
          />
        </View>

        <Input
          label="GitHub / Repository URL (Optional)"
          placeholder="https://github.com/username/project"
          value={repositoryUrl}
          onChangeText={setRepositoryUrl}
          autoCapitalize="none"
        />

        <Input
          label="Live Demo / Figma URL (Optional)"
          placeholder="https://myproject.demo.com"
          value={demoUrl}
          onChangeText={setDemoUrl}
          autoCapitalize="none"
        />

        <Button
          title="Publish Project Idea"
          onPress={handleCreate}
          loading={loading}
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
    height: 100,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  techChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  customTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  addTagBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  publishBtn: {
    marginTop: 20,
    marginBottom: 30,
  },
});
