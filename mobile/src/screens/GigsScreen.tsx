import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Gig } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import apiClient from '../api/client';

const CATEGORY_FILTERS = ['ALL', 'Frontend', 'Backend', 'Design / UI', 'Writing', 'Testing'];

export const GigsScreen = ({ navigation }: any) => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Apply modal
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [pitchNote, setPitchNote] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchGigs = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'ALL') params.category = selectedCategory;

      const res = await apiClient.get('/gigs', { params });
      if (res.data.success) {
        setGigs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching gigs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const handleApplyGig = async () => {
    if (!selectedGig || !pitchNote.trim()) {
      Alert.alert('Required', 'Please enter a pitch note explaining why you are a good match.');
      return;
    }

    try {
      setApplying(true);
      const res = await apiClient.post(`/gigs/${selectedGig.id}/apply`, {
        pitchNote: pitchNote.trim(),
        portfolioLink: portfolioLink.trim(),
      });

      if (res.data.success) {
        Alert.alert('Gig Application Sent!', 'The gig poster has been notified.');
        setSelectedGig(null);
        setPitchNote('');
        setPortfolioLink('');
        fetchGigs();
      }
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.message || 'Failed to submit gig application.');
    } finally {
      setApplying(false);
    }
  };

  const renderGigItem = ({ item }: { item: Gig }) => {
    const creatorName = item.creator?.profile?.fullName || 'Campus Peer';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.creatorText}>
              Posted by {creatorName} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Badge label={item.category} variant="secondary" />
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.pillsRow}>
          <View style={styles.stipendPill}>
            <Text style={styles.stipendText}>💰 {item.stipend || 'Experience'}</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>⏱️ {item.estimatedTime || '1 week'}</Text>
          </View>
        </View>

        <View style={styles.skillsRow}>
          {item.skillsRequired.map((skill, idx) => (
            <Badge key={idx} label={skill} variant="neutral" />
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.appCountText}>
            {item._count?.applications || 0} applicants
          </Text>

          {item.hasApplied ? (
            <Badge label="Applied ✓" variant="primary" size="md" />
          ) : (
            <Button
              title="Apply for Gig"
              onPress={() => setSelectedGig(item)}
              style={styles.applyBtn}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Internal Campus Gigs</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateGig')}
        >
          <Text style={styles.createBtnText}>+ Post Gig</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search mini gigs, tasks, coding assistance..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                selectedCategory === item && styles.chipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === item && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <Skeleton height={140} style={{ borderRadius: 12 }} />
          <Skeleton height={140} style={{ borderRadius: 12 }} />
        </View>
      ) : (
        <FlatList
          data={gigs}
          renderItem={renderGigItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchGigs();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Internal Gigs Available"
              description="Have a quick design task, bug fix, or writing gig? Post it for campus peers!"
              actionTitle="Post First Gig"
              onAction={() => navigation.navigate('CreateGig')}
            />
          }
        />
      )}

      {/* Gig Apply Modal */}
      <Modal visible={!!selectedGig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Apply to Gig</Text>
            <Text style={styles.modalSubtitle}>"{selectedGig?.title}"</Text>

            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Why are you a good fit for this gig?"
              placeholderTextColor={colors.textDim}
              value={pitchNote}
              onChangeText={setPitchNote}
              multiline
            />

            <TextInput
              style={[styles.modalInput, { marginBottom: 20 }]}
              placeholder="Portfolio / GitHub sample link (optional)"
              placeholderTextColor={colors.textDim}
              value={portfolioLink}
              onChangeText={setPortfolioLink}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setSelectedGig(null)}
                variant="outline"
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button
                title="Submit Gig Application"
                onPress={handleApplyGig}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  createBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  filterScroll: {
    paddingLeft: 20,
    marginBottom: 12,
    height: 38,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  creatorText: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  stipendPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stipendText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  timePill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  appCountText: {
    color: colors.textDim,
    fontSize: 13,
  },
  applyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
