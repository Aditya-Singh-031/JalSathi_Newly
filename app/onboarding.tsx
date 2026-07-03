import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DROP_COUNT = 5;
const STAGGER_DELAYS = [0, 200, 400, 600, 800];
const DROP_X_POSITIONS = [
  SCREEN_WIDTH * 0.1,
  SCREEN_WIDTH * 0.3,
  SCREEN_WIDTH * 0.5,
  SCREEN_WIDTH * 0.7,
  SCREEN_WIDTH * 0.9,
];

function RainDrop({ delay, xPos }: { delay: number; xPos: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, translateY, opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: xPos,
        top: 0,
        width: 8,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#38BDF8',
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(tabs)' as any);
  };

  const handleDetectLocation = async () => {
    console.log('[Onboarding] Detect My Location button pressed');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[Onboarding] Location permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission was denied. You can still use the app without it.',
          [{ text: 'Continue', onPress: completeOnboarding }]
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      console.log('[Onboarding] Got location:', location.coords);
      await AsyncStorage.setItem('user_location', JSON.stringify(location.coords));
      await completeOnboarding();
    } catch (err) {
      console.error('[Onboarding] Location error:', err);
      Alert.alert('Error', 'Could not get location. Continuing without it.');
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    console.log('[Onboarding] Skip for now pressed');
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      {/* Rain drops */}
      {Array.from({ length: DROP_COUNT }).map((_, i) => (
        <RainDrop key={i} delay={STAGGER_DELAYS[i]} xPos={DROP_X_POSITIONS[i]} />
      ))}

      {/* Brand section */}
      <View style={styles.brandSection}>
        <Text style={styles.dropEmoji}>💧</Text>
        <Text style={styles.appName}>JalSathi</Text>
        <Text style={styles.tagline}>Your monsoon safety companion</Text>
      </View>

      {/* Buttons */}
      <View style={[styles.buttonSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleDetectLocation}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>📍 Detect My Location</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  dropEmoji: {
    fontSize: 64,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
});
