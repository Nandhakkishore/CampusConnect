import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { colors } from '../theme/colors';
import { projectApi } from '../api/projectApi';
import { Project, ProjectComment } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

export const ProjectDetailScreen = ({ route, navigation }: any) => {
  const { projectId } = route.params;
  const currentUser = useAuthStore((state) => state.user);

  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Apply Modal state
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyNote, setApplyNote] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [applying, setApplying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projRes, commRes] = await Promise.all([
        projectApi.getProjectById(projectId),
        projectApi.getComments(projectId),
      ]);

      if (projRes.success) setProject(projRes.data);
      if (commRes.success) setComments(commRes.data);
    } catch (err) {
      console.error('Error loading project detail:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpvote = async () => {
    if (!project) return;
    const isUpvoted = project.hasUpvoted;
    const currentCount = project._count?.upvotes || 0;

    setProject({
      ...project,
      hasUpvoted: !isUpvoted,
      _count: {
        ...project._count!,
        upvotes: isUpvoted ? Math.max(0, currentCount - 1) : currentCount + 1,
        comments: project._count?.comments || 0,
        applications: project._count?.applications || 0,
      },
    });

    try {
      await projectApi.toggleUpvote(projectId);
    } catch (err) {
      loadData();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await projectApi.addComment(projectId, commentText.trim());
      if (res.success) {
        setComments([res.data, ...comments]);
        setCommentText('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleApplyToProject = async () => {
    if (!applyNote.trim()) {
      Alert.alert('Note Required', 'Introduce yourself and state how you want to contribute.');
      return;
    }

    try {
      setApplying(true);
      const res = await apiClient.post(`/projects/${projectId}/apply`, {
        note: applyNote.trim(),
        contactLink: contactLink.trim(),
      });

      if (res.data?.success) {
        Alert.alert('Application Submitted!', 'The project owner has been notified.');
        setApplyModalVisible(false);
        setApplyNote('');
        setContactLink('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit application.';
      Alert.alert('Application Notice', msg);
    } finally {
      setApplying(false);
    }
  };

  if (loading || !project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20 }}>
          <Skeleton height={30} width="70%" />
          <Skeleton height={20} width="40%" style={{ marginBottom: 20 }} />
          <Skeleton height={150} />
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = currentUser?.id === project.ownerId;
  const authorName = project.owner?.profile?.fullName || 'Campus Member';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusRow}>
          <Badge label={project.status} variant={project.status === 'RECRUITING' ? 'primary' : 'neutral'} size="md" />
          <Text style={styles.dateText}>{new Date(project.createdAt).toLocaleDateString()}</Text>
        </View>

        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.summary}>{project.summary}</Text>

        <View style={styles.authorCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.authorBranch}>{project.branch || 'Campus Student'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Project Overview & Goals</Text>
          <Text style={styles.descriptionText}>{project.description}</Text>

          <Text style={[styles.cardTitle, { marginTop: 16 }]}>Required Tech Stack</Text>
          <View style={styles.tagRow}>
            {project.techStack.map((tech, idx) => (
              <Badge key={idx} label={tech} variant="secondary" size="md" />
            ))}
          </View>

          {project.repositoryUrl || project.demoUrl ? (
            <View style={styles.linkContainer}>
              {project.repositoryUrl ? (
                <TouchableOpacity onPress={() => Linking.openURL(project.repositoryUrl!)}>
                  <Text style={styles.linkText}>🔗 Repository</Text>
                </TouchableOpacity>
              ) : null}
              {project.demoUrl ? (
                <TouchableOpacity onPress={() => Linking.openURL(project.demoUrl!)}>
                  <Text style={styles.linkText}>🌐 Live Prototype</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.upvoteButton, project.hasUpvoted && styles.upvotedButton]}
            onPress={handleUpvote}
          >
            <Text style={[styles.upvoteText, project.hasUpvoted && styles.upvotedText]}>
              ▲ Upvote ({project._count?.upvotes || 0})
            </Text>
          </TouchableOpacity>

          {!isOwner ? (
            <Button
              title="Apply to Join Team"
              onPress={() => setApplyModalVisible(true)}
              style={styles.applyBtn}
            />
          ) : (
            <Button
              title="Manage Applicants"
              onPress={() => navigation.navigate('TeamApplicants', { projectId: project.id })}
              variant="secondary"
              style={styles.applyBtn}
            />
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.commentSectionTitle}>
            Discussion ({comments.length})
          </Text>

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ask a question or offer to collaborate..."
              placeholderTextColor={colors.textDim}
              value={commentText}
              onChangeText={setCommentText}
            />
            <Button
              title="Post"
              onPress={handleAddComment}
              loading={submittingComment}
              style={styles.postCommentBtn}
            />
          </View>

          {comments.map((comm) => {
            const commAuthor = comm.user?.profile?.fullName || 'Campus Member';
            return (
              <View key={comm.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{commAuthor}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{comm.content}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Apply Modal */}
      <Modal visible={applyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Apply to Join Team</Text>
            <Text style={styles.modalSubtitle}>
              Let the owner of "{project.title}" know why you're a great fit.
            </Text>

            <TextInput
              style={[styles.commentInput, { height: 90, textAlignVertical: 'top', marginBottom: 12 }]}
              placeholder="Your pitch, experience, or role you want to take on..."
              placeholderTextColor={colors.textDim}
              value={applyNote}
              onChangeText={setApplyNote}
              multiline
            />

            <TextInput
              style={[styles.commentInput, { marginBottom: 20 }]}
              placeholder="GitHub / Discord / Portfolio link (optional)"
              placeholderTextColor={colors.textDim}
              value={contactLink}
              onChangeText={setContactLink}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setApplyModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button
                title="Submit Application"
                onPress={handleApplyToProject}
                loading={applying}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    color: colors.textDim,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  authorBranch: {
    fontSize: 12,
    color: colors.textDim,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  linkContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 16,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  upvoteButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  upvotedButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  upvoteText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  upvotedText: {
    color: colors.primary,
  },
  applyBtn: {
    flex: 1,
  },
  commentSection: {
    marginTop: 8,
  },
  commentSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  postCommentBtn: {
    paddingHorizontal: 16,
  },
  commentCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  commentTime: {
    color: colors.textDim,
    fontSize: 11,
  },
  commentContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
