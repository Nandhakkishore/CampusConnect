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
} from 'react-native';
import { colors } from '../theme/colors';
import { projectApi } from '../api/projectApi';
import { Project } from '../types';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

const TECH_FILTERS = ['ALL', 'React', 'Node.js', 'Python', 'AI/ML', 'Flutter', 'Rust'];

export const ProjectBoardScreen = ({ navigation }: any) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState('ALL');

  const fetchProjects = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedTech !== 'ALL') params.techStack = selectedTech;

      const res = await projectApi.getProjects(params);
      if (res.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedTech]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUpvote = async (projectId: string) => {
    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const isUpvoted = p.hasUpvoted;
          const currentCount = p._count?.upvotes || 0;
          return {
            ...p,
            hasUpvoted: !isUpvoted,
            _count: {
              ...p._count!,
              upvotes: isUpvoted ? Math.max(0, currentCount - 1) : currentCount + 1,
              comments: p._count?.comments || 0,
              applications: p._count?.applications || 0,
            },
          };
        }
        return p;
      })
    );

    try {
      await projectApi.toggleUpvote(projectId);
    } catch (err) {
      // Rollback on failure
      fetchProjects();
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'secondary';
      default:
        return 'accent';
    }
  };

  const renderProjectItem = ({ item }: { item: Project }) => {
    const authorName = item.owner?.profile?.fullName || 'Campus Contributor';
    const upvoteCount = item._count?.upvotes || 0;
    const commentCount = item._count?.comments || 0;
    const applicantCount = item._count?.applications || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.authorBadge}>
            <View style={styles.authorAvatarContainer}>
              <Text style={styles.authorAvatar}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.branchText}>
                {item.branch || 'Campus Project'} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Badge
            label={item.status}
            variant={getStatusVariant(item.status) as any}
            showDot={true}
          />
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>

        <View style={styles.techStackRow}>
          {item.techStack.map((tech, idx) => (
            <Badge key={idx} label={tech} variant="secondary" />
          ))}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.actionBtn, item.hasUpvoted && styles.upvotedBtn]}
            onPress={() => handleUpvote(item.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionText, item.hasUpvoted && styles.upvotedText]}>
              {item.hasUpvoted ? '▲ Upvoted' : '△ Upvote'} ({upvoteCount})
            </Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statPill}>
              <Text style={styles.statsText}>💬 {commentCount}</Text>
            </View>
            {applicantCount > 0 && (
              <View style={[styles.statPill, { marginLeft: 8 }]}>
                <Text style={styles.statsText}>👥 {applicantCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Explore Ideas</Text>
          <Text style={styles.screenSubtitle}>Pitch, recruit & build with peers</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateProject')}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>+ Pitch Idea</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects, skills, tech stacks..."
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
          data={TECH_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                selectedTech === item && styles.chipActive,
              ]}
              onPress={() => setSelectedTech(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedTech === item && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          <Skeleton height={140} style={{ borderRadius: 16, marginBottom: 14 }} />
          <Skeleton height={140} style={{ borderRadius: 16, marginBottom: 14 }} />
          <Skeleton height={140} style={{ borderRadius: 16 }} />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProjects();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Campus Projects Found"
              description="Be the pioneer! Post a project idea or hackathon concept to recruit teammates."
              actionTitle="Create First Project"
              onAction={() => navigation.navigate('CreateProject')}
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
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: colors.primary,
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
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  skeletonContainer: {
    padding: 20,
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
    marginBottom: 12,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  authorAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorAvatar: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 15,
  },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  branchText: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  summary: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: 12,
  },
  techStackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    paddingTop: 12,
  },
  actionBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upvotedBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  actionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  upvotedText: {
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statsText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});

