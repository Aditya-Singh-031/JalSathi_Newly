import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function GlassCard({ children, style, onPress }: GlassCardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <BlurView tint="dark" intensity={40} style={[cardStyle, style]}>
          {children}
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <BlurView tint="dark" intensity={40} style={[cardStyle, style]}>
      {children}
    </BlurView>
  );
}
