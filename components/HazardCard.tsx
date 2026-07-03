import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GlassCard } from '@/components/GlassCard';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Colors } from '@/constants/Colors';
import { HazardReport } from '@/types';

interface HazardCardProps {
  report: HazardReport;
  onUpvote: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  'Flooding': { icon: 'waves', color: '#38BDF8' },
  'Open Pothole': { icon: 'road-variant', color: '#F59E0B' },
  'Power Grid Down': { icon: 'lightning-bolt', color: '#FDE047' },
  'Fallen Tree': { icon: 'tree', color: '#4ADE80' },
};

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function HazardCard({ report, onUpvote }: HazardCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconInfo = CATEGORY_ICONS[report.category] ?? { icon: 'alert', color: Colors.warning };
  const relativeTime = getRelativeTime(report.timestamp);
  const descriptionText = report.description ?? 'No description provided.';

  const handleUpvote = () => {
    console.log(`[HazardCard] Upvote pressed for report id=${report.id}`);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
    ]).start();
    onUpvote(report.id);
  };

  return (
    <GlassCard style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <View style={{ padding: 16 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <MaterialCommunityIcons
            name={iconInfo.icon as any}
            size={20}
            color={iconInfo.color}
          />
          <Text style={{ color: iconInfo.color, fontSize: 13, fontWeight: '600', flex: 1 }}>
            {report.category}
          </Text>
          <SeverityBadge level={report.severity_level} />
          <Text style={{ color: Colors.textMuted, fontSize: 12, marginLeft: 8 }}>
            {relativeTime}
          </Text>
        </View>

        {/* Image placeholder */}
        <View
          style={{
            backgroundColor: Colors.surface,
            height: 160,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons name="camera-outline" size={32} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 6 }}>
            No photo attached
          </Text>
        </View>

        {/* Description */}
        <Text
          style={{ color: Colors.text, fontSize: 14, lineHeight: 20, marginBottom: 12 }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {descriptionText}
        </Text>

        {/* Bottom row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="arrow-up-bold" size={16} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
              {report.upvotes_count}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPress={handleUpvote}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: Colors.primary + '22',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: Colors.primary + '55',
              }}
            >
              <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>
                ✓ Verify
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </GlassCard>
  );
}
