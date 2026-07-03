import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';

interface SeverityBadgeProps {
  level: number;
}

const SEV_COLORS: Record<number, string> = {
  1: Colors.sev1,
  2: Colors.sev2,
  3: Colors.sev3,
  4: Colors.sev4,
  5: Colors.sev5,
};

export function SeverityBadge({ level: rawLevel }: SeverityBadgeProps) {
  const level = Math.max(1, Math.min(5, rawLevel));
  const color = SEV_COLORS[level] ?? Colors.sev3;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (level >= 4) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => { loop.stop(); };
    }
    return undefined;
  }, [level, pulseAnim]);

  const badge = (
    <View
      style={{
        backgroundColor: color + '33',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: color,
      }}
    >
      <Text
        style={{
          color,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        SEV {level}
      </Text>
    </View>
  );

  if (level >= 4) {
    return <Animated.View style={{ opacity: pulseAnim }}>{badge}</Animated.View>;
  }

  return badge;
}
