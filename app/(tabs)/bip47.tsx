
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import QRScanner from '@/components/QRScanner';
import ExpandableTooltip from '@/components/ExpandableTooltip';
import {
  getPaymentCodes,
  getPaymentChains,
  getSSOSessions,
  derivePaymentChain,
  signSSOChallenge,
  storeSSOSession,
  revokeSSOSession,
  parsePaymentCodeQR,
  importPaymentCode,
} from '@/utils/bip47';
import { PaymentCode, PaymentChain, SSOSession, SSOChallenge } from '@/types/bip47';

type TabType = 'codes' | 'chains' | 'sso';

export default function BIP47Screen() {
  const [activeTab, setActiveTab] = useState<TabType>('codes');
  const [paymentCodes, setPaymentCodes] = useState<PaymentCode[]>([]);
  const [paymentChains, setPaymentChains] = useState<PaymentChain[]>([]);
  const [ssoSessions, setSSOSessions] = useState<SSOSession[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewChainModal, setShowNewChainModal] = useState(false);
  const [importCodeLabel, setImportCodeLabel] = useState('');
  const [importCodeValue, setImportCodeValue] = useState('');
  const [newChainLabel, setNewChainLabel] = useState('');
  const [newChainRecipient, setNewChainRecipient] = useState('');
  const [selectedCode, setSelectedCode] = useState<PaymentCode | null>(null);
  const [useAuth47, setUseAuth47] = useState(true);
  const [expandedChain, setExpandedChain] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'import' | 'chain' | 'sso'>('import');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Loading BIP47 data...');
    const codes = await getPaymentCodes();
    const chains = await getPaymentChains();
    const sessions = await getSSOSessions();
    
    setPaymentCodes(codes);
    setPaymentChains(chains);
    setSSOSessions(sessions);
    
    if (codes.length > 0 && !selectedCode) {
      setSelectedCode(codes[0]);
    }
  };

  const handleImportCode = async () => {
    if (!importCodeLabel.trim() || !importCodeValue.trim()) {
      Alert.alert('Error', 'Please enter both label and payment code');
      return;
    }

    try {
      const code = await importPaymentCode(importCodeValue, importCodeLabel);
      setPaymentCodes([...paymentCodes, code]);
      setSelectedCode(code);
      setImportCodeLabel('');
      setImportCodeValue('');
      setShowImportModal(false);
      Alert.alert('Success', 'Payment code imported successfully!');
    } catch (error) {
      console.log('Error importing payment code:', error);
      Alert.alert('Error', 'Failed to import payment code. Please check the format.');
    }
  };

  const handleCreateChain = async () => {
    if (!selectedCode) {
      Alert.alert('Error', 'Please select a payment code first');
      return;
    }

    if (!newChainLabel.trim() || !newChainRecipient.trim()) {
      Alert.alert('Error', 'Please enter both label and recipient code');
      return;
    }

    try {
      const chain = await derivePaymentChain(selectedCode, newChainRecipient, newChainLabel);
      setPaymentChains([...paymentChains, chain]);
      setNewChainLabel('');
      setNewChainRecipient('');
      setShowNewChainModal(false);
      Alert.alert('Success', 'Payment chain created successfully!');
    } catch (error) {
      console.log('Error creating payment chain:', error);
      Alert.alert('Error', 'Failed to create payment chain');
    }
  };

  const handleQRScan = async (data: string) => {
    console.log('Processing scanned QR code...');
    const parsed = parsePaymentCodeQR(data);

    if (!parsed) {
      Alert.alert('Error', 'Invalid QR code format');
      setShowScanner(false);
      return;
    }

    if (parsed.type === 'payment_code') {
      if (scanMode === 'import') {
        setImportCodeValue(parsed.payload);
        setShowScanner(false);
        setShowImportModal(true);
        Alert.alert('Payment Code Scanned', 'Enter a label to import this payment code');
      } else {
        setNewChainRecipient(parsed.payload);
        setShowScanner(false);
        setShowNewChainModal(true);
        Alert.alert('Payment Code Scanned', 'Enter a label to create a payment chain');
      }
    } else if (parsed.type === 'sso_challenge') {
      setShowScanner(false);
      await handleSSOChallenge(parsed.payload);
    }
  };

  const handleSSOChallenge = async (challenge: SSOChallenge) => {
    if (!selectedCode) {
      Alert.alert('Error', 'Please select a payment code first');
      return;
    }

    try {
      const signature = await signSSOChallenge(challenge, selectedCode, useAuth47);
      
      const session: SSOSession = {
        id: Date.now().toString(),
        serviceName: challenge.serviceName,
        serviceUrl: challenge.serviceUrl,
        challenge: challenge.challenge,
        signature,
        paymentCodeId: selectedCode.id,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active',
        auth47Enabled: useAuth47,
      };

      await storeSSOSession(session);
      setSSOSessions([...ssoSessions, session]);

      Alert.alert(
        'SSO Login Successful',
        `Signed in to ${challenge.serviceName}\n\n${useAuth47 ? 'Using Auth47 (SPHINCS+)' : 'Using standard ECDSA'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('Error handling SSO challenge:', error);
      Alert.alert('Error', 'Failed to sign SSO challenge');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to revoke this SSO session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await revokeSSOSession(sessionId);
            const updated = ssoSessions.map(s =>
              s.id === sessionId ? { ...s, status: 'revoked' as const } : s
            );
            setSSOSessions(updated);
            Alert.alert('Success', 'Session revoked');
          },
        },
      ]
    );
  };

  const renderPaymentCodes = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Codes</Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowImportModal(true)}
        >
          <IconSymbol
            ios_icon_name="square.and.arrow.down"
            android_material_icon_name="download"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ExpandableTooltip
        title="Import Only"
        brief="This app only imports existing BIP47 payment codes"
        detailed="For security reasons, Keep47 does not generate new payment codes. You must import existing payment codes from your wallet. This ensures your keys remain secure in their original location while allowing you to use them for SSO authentication."
        icon="lock.shield.fill"
        iconAndroid="security"
      />

      {paymentCodes.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="qrcode"
            android_material_icon_name="qr-code"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No payment codes yet</Text>
          <Text style={styles.emptySubtext}>Import your first BIP47 payment code</Text>
        </View>
      ) : (
        paymentCodes.map((code, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              selectedCode?.id === code.id && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setSelectedCode(code)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <IconSymbol
                  ios_icon_name="qrcode"
                  android_material_icon_name="qr-code"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.cardTitle}>{code.label}</Text>
              </View>
              {code.isPayNymCompatible && (
                <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.badgeText}>PayNym</Text>
                </View>
              )}
            </View>
            <View style={styles.codeBox}>
              <Text style={styles.codeText} numberOfLines={1}>
                {code.code}
              </Text>
            </View>
            <Text style={styles.cardSubtext}>
              Imported {code.createdAt.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: colors.secondary }]}
        onPress={() => {
          setScanMode('import');
          setShowScanner(true);
        }}
      >
        <IconSymbol
          ios_icon_name="qrcode.viewfinder"
          android_material_icon_name="qr-code-scanner"
          size={24}
          color={colors.text}
        />
        <Text style={styles.scanButtonText}>Scan Payment Code to Import</Text>
      </TouchableOpacity>

      <ExpandableTooltip
        title="What is BIP47?"
        brief="Reusable payment addresses with enhanced privacy"
        detailed="BIP47 payment codes enable reusable payment addresses with enhanced privacy through ECDH key derivation. Each transaction uses a unique address derived from the payment code, preventing address reuse while maintaining a single shareable identifier. This is compatible with PayNym and Samourai protocols."
        icon="info.circle.fill"
        iconAndroid="info"
      />
    </View>
  );

  const renderPaymentChains = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Chains</Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (!selectedCode) {
              Alert.alert('Error', 'Please import a payment code first');
              return;
            }
            setShowNewChainModal(true);
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ExpandableTooltip
        title="Payment Chains"
        brief="Derive unique addresses for each recipient"
        detailed="Payment chains use ECDH to derive a sequence of unique Bitcoin addresses between you and a recipient. Each address is deterministically generated from your payment code and the recipient's code, ensuring privacy and preventing address reuse. The notification transaction alerts the recipient to watch for payments."
        icon="link"
        iconAndroid="link"
      />

      {paymentChains.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="link"
            android_material_icon_name="link"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No payment chains yet</Text>
          <Text style={styles.emptySubtext}>Create a chain to derive payment addresses</Text>
        </View>
      ) : (
        paymentChains.map((chain, index) => (
          <View key={index} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedChain(expandedChain === chain.id ? null : chain.id)}
            >
              <View style={styles.cardHeaderLeft}>
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={24}
                  color={colors.secondary}
                />
                <Text style={styles.cardTitle}>{chain.recipientLabel}</Text>
              </View>
              <IconSymbol
                ios_icon_name={expandedChain === chain.id ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={expandedChain === chain.id ? 'expand-less' : 'expand-more'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.chainInfo}>
              <Text style={styles.chainLabel}>Addresses: {chain.addresses.length}</Text>
              <Text style={styles.chainLabel}>
                Notification: {chain.notificationSent ? '✓ Sent' : '✗ Pending'}
              </Text>
            </View>

            {expandedChain === chain.id && (
              <View style={styles.addressList}>
                {chain.addresses.map((addr, addrIndex) => (
                  <View key={addrIndex} style={styles.addressItem}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressIndex}>#{addr.index}</Text>
                      {addr.used && (
                        <View style={[styles.badge, { backgroundColor: colors.success }]}>
                          <Text style={styles.badgeText}>Used</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressText} numberOfLines={1}>
                      {addr.address}
                    </Text>
                    <Text style={styles.addressStats}>
                      Balance: {addr.balance} BTC • Txs: {addr.transactions}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: colors.secondary }]}
        onPress={() => {
          if (!selectedCode) {
            Alert.alert('Error', 'Please import a payment code first');
            return;
          }
          setScanMode('chain');
          setShowScanner(true);
        }}
      >
        <IconSymbol
          ios_icon_name="qrcode.viewfinder"
          android_material_icon_name="qr-code-scanner"
          size={24}
          color={colors.text}
        />
        <Text style={styles.scanButtonText}>Scan Recipient Payment Code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSSOHistory = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SSO History</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auth47</Text>
          <Switch
            value={useAuth47}
            onValueChange={setUseAuth47}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <ExpandableTooltip
        title="Auth47 SSO"
        brief="Quantum-safe authentication using SPHINCS+"
        detailed="Auth47 SSO uses your BIP47 payment code to sign service challenges with SPHINCS+ post-quantum signatures. This provides quantum-resistant authentication while maintaining compatibility with standard ECDSA signatures. When enabled, each login generates both an ECDSA signature (for current compatibility) and a SPHINCS+ signature (for quantum safety)."
        icon="shield.checkered"
        iconAndroid="security"
      />

      {ssoSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="person.badge.key.fill"
            android_material_icon_name="vpn-key"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No SSO sessions yet</Text>
          <Text style={styles.emptySubtext}>Scan a service QR code to login</Text>
        </View>
      ) : (
        ssoSessions.map((session, index) => (
          <View key={index} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            >
              <View style={styles.cardHeaderLeft}>
                <IconSymbol
                  ios_icon_name="person.badge.key.fill"
                  android_material_icon_name="vpn-key"
                  size={24}
                  color={colors.primary}
                />
                <View>
                  <Text style={styles.cardTitle}>{session.serviceName}</Text>
                  <Text style={styles.cardSubtext}>{session.serviceUrl}</Text>
                </View>
              </View>
              <View style={styles.sessionBadges}>
                {session.auth47Enabled && (
                  <View style={[styles.badge, { backgroundColor: colors.success }]}>
                    <Text style={styles.badgeText}>Auth47</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        session.status === 'active'
                          ? colors.success
                          : session.status === 'expired'
                          ? colors.warning
                          : colors.error,
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{session.status}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.sessionTime}>
              {session.timestamp.toLocaleString()}
            </Text>

            {expandedSession === session.id && (
              <View style={styles.sessionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Challenge:</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {session.challenge}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expires:</Text>
                  <Text style={styles.detailValue}>
                    {session.expiresAt.toLocaleString()}
                  </Text>
                </View>
                {session.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.revokeButton, { backgroundColor: colors.error }]}
                    onPress={() => handleRevokeSession(session.id)}
                  >
                    <Text style={styles.revokeButtonText}>Revoke Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (!selectedCode) {
            Alert.alert('Error', 'Please import a payment code first');
            return;
          }
          setScanMode('sso');
          setShowScanner(true);
        }}
      >
        <IconSymbol
          ios_icon_name="qrcode.viewfinder"
          android_material_icon_name="qr-code-scanner"
          size={24}
          color={colors.text}
        />
        <Text style={styles.scanButtonText}>Scan Service QR Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keep47</Text>
        <Text style={styles.headerSubtitle}>
          BIP47 Payment Codes • PayNym Compatible • Auth47 SSO
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'codes' && styles.activeTab]}
          onPress={() => setActiveTab('codes')}
        >
          <IconSymbol
            ios_icon_name="qrcode"
            android_material_icon_name="qr-code"
            size={20}
            color={activeTab === 'codes' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'codes' && { color: colors.primary, fontWeight: '600' },
            ]}
          >
            Codes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'chains' && styles.activeTab]}
          onPress={() => setActiveTab('chains')}
        >
          <IconSymbol
            ios_icon_name="link"
            android_material_icon_name="link"
            size={20}
            color={activeTab === 'chains' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'chains' && { color: colors.primary, fontWeight: '600' },
            ]}
          >
            Chains
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sso' && styles.activeTab]}
          onPress={() => setActiveTab('sso')}
        >
          <IconSymbol
            ios_icon_name="person.badge.key.fill"
            android_material_icon_name="vpn-key"
            size={20}
            color={activeTab === 'sso' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'sso' && { color: colors.primary, fontWeight: '600' },
            ]}
          >
            SSO
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'codes' && renderPaymentCodes()}
        {activeTab === 'chains' && renderPaymentChains()}
        {activeTab === 'sso' && renderSSOHistory()}
      </ScrollView>

      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
        title={
          scanMode === 'sso' 
            ? 'Scan Service QR Code' 
            : scanMode === 'import'
            ? 'Scan Payment Code to Import'
            : 'Scan Recipient Payment Code'
        }
      />

      <Modal visible={showImportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Payment Code</Text>
            <Text style={styles.modalDescription}>
              Enter your existing BIP47 payment code from your wallet
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter label (e.g., My Wallet)"
              placeholderTextColor={colors.textSecondary}
              value={importCodeLabel}
              onChangeText={setImportCodeLabel}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste payment code (PM8T...)"
              placeholderTextColor={colors.textSecondary}
              value={importCodeValue}
              onChangeText={setImportCodeValue}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.highlight }]}
                onPress={() => {
                  setShowImportModal(false);
                  setImportCodeLabel('');
                  setImportCodeValue('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleImportCode}
              >
                <Text style={styles.modalButtonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNewChainModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Payment Chain</Text>
            <Text style={styles.modalDescription}>
              Create a payment chain with a recipient
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Recipient label"
              placeholderTextColor={colors.textSecondary}
              value={newChainLabel}
              onChangeText={setNewChainLabel}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Recipient payment code"
              placeholderTextColor={colors.textSecondary}
              value={newChainRecipient}
              onChangeText={setNewChainRecipient}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.highlight }]}
                onPress={() => {
                  setShowNewChainModal(false);
                  setNewChainLabel('');
                  setNewChainRecipient('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateChain}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  tabContent: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  codeBox: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  chainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chainLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addressList: {
    gap: 8,
    marginTop: 8,
  },
  addressItem: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
  },
  addressStats: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  sessionTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionDetails: {
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
  },
  revokeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  revokeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.text,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.highlight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
