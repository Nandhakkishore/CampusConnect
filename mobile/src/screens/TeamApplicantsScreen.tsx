import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import { Application } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import apiClient from '../api/client';

export const TeamApplicantsScreen = ({ route, navigation }: any) => {
  const { projectId } = route.params;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/applications`);
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      setProcessingId(applicationId);
      const res = await apiClient.patch(`/applications/${applicationId}/status`, { status });
      if (res.data.success) {
        Alert.alert(
          status === 'ACCEPTED' ? 'Applicant Accepted! 🎉' : 'Application Rejected',
          status === 'ACCEPTED'
            ? 'A private team chat room has been created automatically.'
            : 'Applicant notified.'
        );
        fetchApplications();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item }: { item: Application }) => {
    const applicantName = item.applicant?.profile?.fullName || 'Campus Student';
    const branch = item.applicant?.profile?.branch || 'Computer Science';
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.applicantInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{applicantName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.applicantName}>{applicantName}</Text>
              <Text style={styles.branchText}>{branch}</Text>
            </View>
          </View>

          <Badge
            label={item.status}
            variant={
              item.status === 'ACCEPTED'
                ? 'primary'
                : item.status === 'REJECTED'
                ? 'neutral'
                : 'accent'
            }
          />
        </View>

        <Text style={styles.noteLabel}>Pitch / Application Note:</Text>
        <Text style={styles.noteText}>{item.note}</Text>

        {item.contactLink ? (
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(item.contactLink!)}
          >
            <Text style={styles.linkText}>🔗 View Portfolio / Github</Text>
          </TouchableOpacity>
        ) : null}

        {isPending ? (
          <View style={styles.actionsRow}>
            <Button
              title="Reject"
              onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
              variant="outline"
              loading={processingId === item.id}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Accept to Team"
              onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
              loading={processingId === item.id}
              style={{ flex: 1.5 }}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Team Applications</Text>

      {loading ? (
        <View style={{ padding: 20 }}>
          <Skeleton height={140} style={{ borderRadius: 12 }} />
          <Skeleton height={140} style={{ borderRadius: 12 }} />
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="No Applications Yet"
              description="When students apply to your project idea, their pitches will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  applicantName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  branchText: {
    color: colors.textDim,
    fontSize: 12,
  },
  noteLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkRow: {
    marginBottom: 14,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
});
