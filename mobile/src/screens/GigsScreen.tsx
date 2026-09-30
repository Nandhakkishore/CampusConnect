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
          <View style={{ flex: 1, marginRight: 10 }}>
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
            <Text style={styles.stipendText}>💰 {item.stipend || 'Experience / Equity'}</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>⏱️ {item.estimatedTime || 'Flexible'}</Text>
          </View>
        </View>

        <View style={styles.skillsRow}>
          {item.skillsRequired.map((skill, idx) => (
            <Badge key={idx} label={skill} variant="neutral" />
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.appCountText}>
            👥 {item._count?.applications || 0} interested students
          </Text>

          {item.hasApplied ? (
            <Badge label="Applied ✓" variant="success" size="md" showDot={true} />
          ) : (
            <Button
              title="Apply Now"
              onPress={() => setSelectedGig(item)}
              size="sm"
              variant="secondary"
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
        <View>
          <Text style={styles.screenTitle}>Campus Gigs</Text>
          <Text style={styles.screenSubtitle}>Micro-tasks, bounties & freelance assistance</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateGig')}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>+ Post Gig</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bounties, design tasks, coding help..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
              activeOpacity={0.8}
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
          <Skeleton height={140} style={{ borderRadius: 16, marginBottom: 14 }} />
          <Skeleton height={140} style={{ borderRadius: 16 }} />
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
              tintColor={colors.secondary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Campus Gigs Available"
              description="Have a quick design task, bug fix, or writing gig? Post it for campus peers!"
              actionTitle="Post First Gig"
              onAction={() => navigation.navigate('CreateGig')}
            />
          }
        />
      )}

      {/* Gig Apply Modal */}
      <Modal visible={!!selectedGig} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Apply for Gig</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  "{selectedGig?.title}"
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedGig(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Your Quick Pitch</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Why are you suitable? Mention relevant skills or prior coursework..."
              placeholderTextColor={colors.textDim}
              value={pitchNote}
              onChangeText={setPitchNote}
              multiline
            />

            <Text style={styles.fieldLabel}>Portfolio or GitHub link (optional)</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 20 }]}
              placeholder="https://github.com/username or drive link"
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
                title="Submit Application"
                onPress={handleApplyGig}
                loading={applying}
                variant="secondary"
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
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  filterScroll: {
    paddingLeft: 20,
    marginBottom: 12,
    height: 38,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
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
    gap: 8,
    marginBottom: 10,
  },
  stipendPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stipendText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  timePill: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
    borderTopColor: colors.surfaceLight,
    paddingTop: 12,
  },
  appCountText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
  applyBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textDim,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
});

