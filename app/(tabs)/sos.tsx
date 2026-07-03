import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { apiGet, apiPost, apiPatch } from '@/utils/api';
import { SOSRequest } from '@/types';

const REQUEST_TYPES = ['Medical', 'Rescue', 'Food & Water', 'Shelter'];

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SOSCard({
  request,
  onResolve,
}: {
  request: SOSRequest;
  onResolve: (id: string) => void;
}) {
  const isOpen = request.status === 'Open';
  const relativeTime = getRelativeTime(request.timestamp);
  const statusText = request.status;

  const handleResolve = () => {
    console.log(`[SOSBoard] Mark Resolved pressed for id=${request.id}`);
    onResolve(request.id);
  };

  return (
    <GlassCard style={styles.sosCard}>
      <View style={{ padding: 16 }}>
        {/* Top row */}
        <View style={styles.sosTopRow}>
          <View style={styles.requestTypePill}>
            <Text style={styles.requestTypeText}>{request.request_type}</Text>
          </View>
          <Text style={styles.sosTimestamp}>{relativeTime}</Text>
        </View>

        {/* Message */}
        <Text style={styles.sosMessage} numberOfLines={2} ellipsizeMode="tail">
          {request.message}
        </Text>

        {/* Bottom row */}
        <View style={styles.sosBottomRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isOpen ? Colors.danger + '22' : Colors.success + '22' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isOpen ? Colors.danger : Colors.success },
              ]}
            >
              {statusText}
            </Text>
          </View>
          {isOpen && (
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Text style={styles.resolveBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

export default function SOSBoardScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const fetchRequests = useCallback(async () => {
    console.log('[SOSBoard] Fetching SOS requests');
    try {
      const data = await apiGet<SOSRequest[]>('/api/sos-requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[SOSBoard] Failed to fetch SOS requests:', err);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const handleResolve = useCallback(async (id: string) => {
    console.log(`[SOSBoard] Resolving SOS request id=${id}`);
    try {
      await apiPatch(`/api/sos-requests/${id}/resolve`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' as const } : r))
      );
    } catch (err) {
      console.error('[SOSBoard] Resolve failed:', err);
      Alert.alert('Error', 'Failed to resolve request. Please try again.');
    }
  }, []);

  const handleSendSOS = async () => {
    console.log('[SOSBoard] Send SOS pressed', { selectedType, message });
    if (!selectedType || !message.trim()) {
      Alert.alert('Missing info', 'Please select a type and enter a message.');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/api/sos-requests', {
        user_id: 'demo-user-1',
        request_type: selectedType,
        message: message.trim(),
      });
      setModalVisible(false);
      setSelectedType(null);
      setMessage('');
      await fetchRequests();
      Alert.alert('SOS Sent', 'Your SOS alert has been sent to the community.');
    } catch (err) {
      console.error('[SOSBoard] Send SOS failed:', err);
      Alert.alert('Error', 'Failed to send SOS. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = requests.filter((r) => r.status === 'Open').length;

  const renderHeader = () => (
    <View>
      <GlassCard style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🆘 SOS Board</Text>
            <Text style={styles.headerSubtitle}>Community Mutual Aid</Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{openCount} Active</Text>
          </View>
        </View>
      </GlassCard>
      <Text style={styles.sectionLabel}>Active Requests</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SOSCard request={item} onResolve={handleResolve} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>No active SOS requests</Text>
              <Text style={styles.emptySubtitle}>
                The community is safe. Trigger an SOS if you need help.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Trigger SOS button */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 80 }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.sosFab}
            onPress={() => {
              console.log('[SOSBoard] Trigger SOS button pressed');
              setModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.sosFabText}>🆘 Trigger SOS</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* SOS Trigger Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                console.log('[SOSBoard] SOS modal dismissed');
                setModalVisible(false);
              }}
            />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Send SOS Alert</Text>

              {/* Request type pills */}
              <View style={styles.typePills}>
                {REQUEST_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typePill,
                      selectedType === type && styles.typePillActive,
                    ]}
                    onPress={() => {
                      console.log(`[SOSBoard] SOS type selected: ${type}`);
                      setSelectedType(type);
                    }}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        selectedType === type && styles.typePillTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message input */}
              <TextInput
                style={styles.messageInput}
                placeholder="Describe your situation..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />

              {/* Send button */}
              <TouchableOpacity
                style={[styles.sendBtn, submitting && { opacity: 0.5 }]}
                onPress={handleSendSOS}
                disabled={submitting}
              >
                <Text style={styles.sendBtnText}>
                  {submitting ? 'Sending...' : '🆘 Send SOS'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: Colors.danger + '22',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.danger + '55',
  },
  activeBadgeText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sosCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sosTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestTypePill: {
    backgroundColor: Colors.danger + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.danger + '55',
  },
  requestTypeText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  sosTimestamp: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  sosMessage: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sosBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resolveBtn: {
    backgroundColor: Colors.success + '22',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.success + '55',
  },
  resolveBtnText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sosFab: {
    width: 200,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 16px rgba(244,63,94,0.4)',
  },
  sosFabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: 320,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 20,
  },
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typePill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillActive: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  typePillText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  typePillTextActive: {
    color: '#fff',
  },
  messageInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
