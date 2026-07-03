import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { HazardCard } from '@/components/HazardCard';
import { ReportModal } from '@/components/ReportModal';
import { Map } from '@/components/Map';
import { apiGet, apiPost } from '@/utils/api';
import { HazardReport } from '@/types';
import type { MapMarker } from '@/components/Map';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
      <View style={[styles.skeletonImage]} />
    </Animated.View>
  );
}

function getMaxSeverity(reports: HazardReport[]): number {
  if (!reports.length) return 1;
  return Math.max(...reports.map((r) => r.severity_level ?? 1));
}

function getWeatherEmoji(maxSev: number): string {
  if (maxSev >= 4) return '⛈️';
  if (maxSev >= 2) return '🌧️';
  return '🌦️';
}

function getHazardLevelText(maxSev: number): string {
  const labels = ['', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'EXTREME'];
  return labels[maxSev] ?? 'UNKNOWN';
}

function getSevColor(maxSev: number): string {
  const colors: Record<number, string> = {
    1: Colors.sev1,
    2: Colors.sev2,
    3: Colors.sev3,
    4: Colors.sev4,
    5: Colors.sev5,
  };
  return colors[maxSev] ?? Colors.sev3;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'feed'>('feed');
  const [modalVisible, setModalVisible] = useState(false);

  const fetchReports = useCallback(async () => {
    console.log('[Dashboard] Fetching hazard reports');
    try {
      const data = await apiGet<HazardReport[]>('/api/hazard-reports');
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch reports:', err);
      setReports([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReports().finally(() => setLoading(false));
  }, [fetchReports]);

  const handleRefresh = useCallback(async () => {
    console.log('[Dashboard] Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  const handleUpvote = useCallback(async (id: string) => {
    console.log(`[Dashboard] Upvoting report id=${id}`);
    try {
      await apiPost(`/api/hazard-reports/${id}/upvote`, {});
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, upvotes_count: r.upvotes_count + 1 } : r
        )
      );
    } catch (err) {
      console.error('[Dashboard] Upvote failed:', err);
    }
  }, []);

  const maxSev = getMaxSeverity(reports);
  const weatherEmoji = getWeatherEmoji(maxSev);
  const hazardLevelText = getHazardLevelText(maxSev);
  const sevColor = getSevColor(maxSev);

  const markers: MapMarker[] = reports.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    title: r.category,
    description: r.description,
  }));

  const handleMapTabPress = () => {
    console.log('[Dashboard] Map tab pressed');
    setActiveTab('map');
  };

  const handleFeedTabPress = () => {
    console.log('[Dashboard] Feed tab pressed');
    setActiveTab('feed');
  };

  const handleReportButtonPress = () => {
    console.log('[Dashboard] Floating report button pressed');
    setModalVisible(true);
  };

  const renderHeader = () => (
    <View>
      <GlassCard style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🌧️ JalSathi</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Colors.textMuted} />
            <Text style={styles.locationText}>Mumbai, IN</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Live Hazard Monitor</Text>
      </GlassCard>

      <View style={styles.weatherWidget}>
        <GlassCard style={styles.weatherCard}>
          <View style={styles.weatherContent}>
            <Text style={styles.weatherEmoji}>{weatherEmoji}</Text>
            <Text style={styles.hazardLabel}>HAZARD LEVEL</Text>
            <Text style={[styles.hazardLevel, { color: sevColor }]}>{hazardLevelText}</Text>
            <Text style={styles.widgetPlaceholder}>3D Widget Placeholder</Text>
          </View>
        </GlassCard>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
          onPress={handleMapTabPress}
        >
          <Text style={[styles.toggleText, activeTab === 'map' && styles.toggleTextActive]}>
            🗺️ Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'feed' && styles.toggleBtnActive]}
          onPress={handleFeedTabPress}
        >
          <Text style={[styles.toggleText, activeTab === 'feed' && styles.toggleTextActive]}>
            📋 Feed
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'map' && (
        <View style={styles.mapContainer}>
          <Map
            markers={markers}
            initialRegion={{
              latitude: 19.076,
              longitude: 72.8777,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            style={{ height: 320, borderRadius: 16 }}
          />
        </View>
      )}

      {activeTab === 'feed' && (
        <Text style={styles.feedSectionTitle}>Recent Reports</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === 'feed' ? (
        loading ? (
          <View style={{ paddingTop: insets.top }}>
            {renderHeader()}
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HazardCard report={item} onUpvote={handleUpvote} />
            )}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🌤️</Text>
                <Text style={styles.emptyTitle}>No hazards reported</Text>
                <Text style={styles.emptySubtitle}>
                  Your area looks clear. Tap + to report a hazard.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={handleReportButtonPress}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          console.log('[Dashboard] Report submitted successfully, refreshing feed');
          fetchReports();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCard: {
    marginHorizontal: 0,
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  headerSubtitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  weatherWidget: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  weatherCard: {
    height: 160,
  },
  weatherContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  weatherEmoji: {
    fontSize: 36,
  },
  hazardLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },
  hazardLevel: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  widgetPlaceholder: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 320,
  },
  feedSectionTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
  },
  fabIcon: {
    fontSize: 28,
    color: '#000',
    fontWeight: '700',
    lineHeight: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.surfaceAlt,
    width: '80%',
  },
  skeletonImage: {
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    marginTop: 12,
  },
});
