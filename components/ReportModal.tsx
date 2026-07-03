import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { HazardReport } from '@/types';


const CATEGORIES = [
  { label: 'Flooding', icon: 'waves', color: '#38BDF8' },
  { label: 'Open Pothole', icon: 'road-variant', color: '#F59E0B' },
  { label: 'Power Grid Down', icon: 'lightning-bolt', color: '#FDE047' },
  { label: 'Fallen Tree', icon: 'tree', color: '#4ADE80' },
] as const;

const SEV_LABELS = ['', 'Minor', 'Moderate', 'Serious', 'Critical', 'Extreme'];
const SEV_COLORS = [
  '',
  Colors.sev1,
  Colors.sev2,
  Colors.sev3,
  Colors.sev4,
  Colors.sev5,
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newReport: HazardReport) => void;
}

export function ReportModal({ visible, onClose, onSuccess }: ReportModalProps) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoryScales = useRef(CATEGORIES.map(() => new Animated.Value(1))).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;



  const handleCategorySelect = (label: string, index: number) => {
    console.log(`[ReportModal] Category selected: ${label}`);
    setCategory(label);
    Animated.sequence([
      Animated.spring(categoryScales[index], {
        toValue: 1.1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.spring(categoryScales[index], {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    console.log('[ReportModal] Submit Report pressed', { category, severity, description });
    if (!category) return;
    setSubmitting(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 1000));
      const mockReport: HazardReport = {
        id: `mock-${Date.now()}`,
        user_id: 'demo-user-1',
        category: category as HazardReport['category'],
        severity_level: severity,
        description: description || 'Community report',
        image_url: undefined,
        latitude: 19.076,
        longitude: 72.8777,
        upvotes_count: 0,
        timestamp: new Date().toISOString(),
      };
      console.log('[ReportModal] Mock report built:', mockReport);
      // Ripple animation
      rippleScale.setValue(0);
      rippleOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSuccess(mockReport);
        resetModal();
        onClose();
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(0);
    setCategory(null);
    setSeverity(3);
    setDescription('');
  };

  const handleClose = () => {
    console.log('[ReportModal] Modal closed');
    resetModal();
    onClose();
  };

  const sevColor = SEV_COLORS[severity] ?? Colors.sev3;
  const sevLabel = SEV_LABELS[severity] ?? '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
          <View style={styles.sheet}>
            {/* Step dots */}
            <View style={styles.stepDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === step ? Colors.primary : Colors.textMuted + '55' },
                  ]}
                />
              ))}
            </View>

            {/* Ripple overlay */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  opacity: rippleOpacity,
                  transform: [{ scale: rippleScale }],
                },
              ]}
            />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {step === 0 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>What did you find?</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat, i) => (
                      <Animated.View
                        key={cat.label}
                        style={{ transform: [{ scale: categoryScales[i] }], width: '48%' }}
                      >
                        <TouchableOpacity
                          onPress={() => handleCategorySelect(cat.label, i)}
                          style={[
                            styles.categoryTile,
                            category === cat.label && {
                              borderColor: Colors.primary,
                              borderWidth: 2,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon as any}
                            size={32}
                            color={cat.color}
                          />
                          <Text style={[styles.categoryLabel, { color: cat.color }]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.nextBtn, !category && styles.disabledBtn]}
                    onPress={() => {
                      if (category) {
                        console.log('[ReportModal] Step 1 → Step 2');
                        setStep(1);
                      }
                    }}
                    disabled={!category}
                  >
                    <Text style={styles.nextBtnText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 1 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>How severe is it?</Text>

                  {/* Severity number */}
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ fontSize: 48, fontWeight: '800', color: sevColor }}>
                      {severity}
                    </Text>
                    <Text style={{ fontSize: 18, color: sevColor, fontWeight: '600' }}>
                      {sevLabel}
                    </Text>
                  </View>

                  {/* Slider */}
                  <Slider
                    style={{ width: '100%', marginBottom: 32 }}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={severity}
                    onValueChange={(v) => {
                      console.log(`[ReportModal] Severity slider changed: ${v}`);
                      setSeverity(v);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    minimumTrackTintColor={sevColor}
                    maximumTrackTintColor="#334155"
                    thumbTintColor="#ffffff"
                  />

                  <View style={styles.rowButtons}>
                    <TouchableOpacity
                      style={styles.backBtn}
                      onPress={() => {
                        console.log('[ReportModal] Step 2 → Step 1');
                        setStep(0);
                      }}
                    >
                      <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={() => {
                        console.log('[ReportModal] Step 2 → Step 3');
                        setStep(2);
                      }}
                    >
                      <Text style={styles.nextBtnText}>Next →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Add details</Text>

                  {/* Photo placeholder */}
                  <GlassCard style={{ height: 140, marginBottom: 16 }}>
                    <TouchableOpacity
                      style={styles.photoPlaceholder}
                      onPress={() => {
                        console.log('[ReportModal] Camera placeholder tapped');
                        Alert.alert('Camera coming soon', 'Photo capture will be available in a future update.');
                      }}
                    >
                      <Ionicons name="camera" size={40} color={Colors.textMuted} />
                      <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8 }}>
                        Tap to add photo
                      </Text>
                    </TouchableOpacity>
                  </GlassCard>

                  {/* Geo-tag */}
                  <View style={styles.geoRow}>
                    <Ionicons name="location" size={16} color={Colors.primary} />
                    <Text style={{ color: Colors.textMuted, fontSize: 13, marginLeft: 6 }}>
                      19.0760° N, 72.8777° E
                    </Text>
                  </View>

                  {/* Description */}
                  <TextInput
                    style={styles.textInput}
                    placeholder="Describe the hazard..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                  />

                  <View style={styles.rowButtons}>
                    <TouchableOpacity
                      style={styles.backBtn}
                      onPress={() => {
                        console.log('[ReportModal] Step 3 → Step 2');
                        setStep(1);
                      }}
                    >
                      <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.disabledBtn]}
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      <Text style={styles.submitBtnText}>
                        {submitting ? 'Submitting...' : 'Submit Report'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    minHeight: 400,
    overflow: 'hidden',
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ripple: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success,
    alignSelf: 'center',
    top: '40%',
    zIndex: 10,
  },
  stepContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryTile: {
    backgroundColor: Colors.glass,
    borderRadius: 16,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
});
