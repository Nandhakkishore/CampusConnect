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

  const renderProjectItem = ({ item }: { item: Project }) => {
    const authorName = item.owner?.profile?.fullName || 'Campus Contributor';
    const upvoteCount = item._count?.upvotes || 0;
    const commentCount = item._count?.comments || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.authorBadge}>
            <Text style={styles.authorAvatar}>
              {authorName.charAt(0).toUpperCase()}
            </Text>
            <View>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.branchText}>
                {item.branch || 'Campus Project'} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Badge
            label={item.status}
            variant={item.status === 'RECRUITING' ? 'primary' : 'neutral'}
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
          >
            <Text style={[styles.actionText, item.hasUpvoted && styles.upvotedText]}>
              ▲ {upvoteCount} Upvotes
            </Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>💬 {commentCount} Comments</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Projects & Ideas</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateProject')}
        >
          <Text style={styles.createBtnText}>+ New Idea</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, tech stack, idea..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
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
          <Skeleton height={140} style={{ borderRadius: 12 }} />
          <Skeleton height={140} style={{ borderRadius: 12 }} />
          <Skeleton height={140} style={{ borderRadius: 12 }} />
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
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  createBtn: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    fontWeight: '700',
    marginRight: 10,
  },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  branchText: {
    color: colors.textDim,
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  summary: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  techStackRow: {
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
  actionBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upvotedBtn: {
    backgroundColor: colors.primaryLight,
  },
  actionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  upvotedText: {
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: colors.textDim,
    fontSize: 13,
  },
});
