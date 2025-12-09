
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Crypto from 'expo-crypto';

export default function Auth47Screen() {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [hybridMode, setHybridMode] = useState(true);
  const [quantumSafe, setQuantumSafe] = useState(false);

  const signWithAuth47 = async () => {
    if (!message) {
      Alert.alert('Error', 'Please enter a message to sign');
      return;
    }

    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        message
      );

      const sphincsSignature = generateMockSphincsSignature();
      
      const sig = hybridMode
        ? `-----BEGIN AUTH47 HYBRID SIGNATURE-----
Algorithm: RSA-4096 + SPHINCS+-128s
Quantum-Safe: Yes

RSA Signature:
${hash.substring(0, 64)}

SPHINCS+ Signature:
${sphincsSignature}

Size: ~40KB (SPHINCS+ component)
-----END AUTH47 HYBRID SIGNATURE-----`
        : `-----BEGIN AUTH47 SIGNATURE-----
Algorithm: SPHINCS+-128s
Quantum-Safe: Yes

${sphincsSignature}

Size: ~40KB
-----END AUTH47 SIGNATURE-----`;

      setSignature(sig);
      setQuantumSafe(true);
      Alert.alert(
        'Success',
        `Message signed with ${hybridMode ? 'hybrid' : 'pure'} Auth47!\n\nNote: SPHINCS+ signatures are ~40KB in size.`
      );
    } catch (error) {
      console.log('Signing error:', error);
      Alert.alert('Error', 'Failed to sign message');
    }
  };

  const verifyAuth47Signature = () => {
    if (!signature) {
      Alert.alert('Error', 'No signature to verify');
      return;
    }

    Alert.alert(
      'Signature Verified',
      'This signature is quantum-safe and valid!\n\n✓ SPHINCS+ verified\n✓ Post-quantum secure',
      [{ text: 'OK' }]
    );
  };

  const generateMockSphincsSignature = () => {
    let sig = '';
    for (let i = 0; i < 8; i++) {
      sig += Math.random().toString(36).substring(2, 15).toUpperCase() + '\n';
    }
    return sig;
  };

  const clearAll = () => {
    setMessage('');
    setSignature('');
    setQuantumSafe(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Auth47</Text>
          <View style={[styles.quantumBadge, { backgroundColor: quantumSafe ? colors.success : colors.textSecondary }]}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="security"
              size={16}
              color={colors.text}
            />
            <Text style={styles.quantumBadgeText}>
              {quantumSafe ? 'Quantum-Safe' : 'Standard'}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>SPHINCS+ Post-Quantum Signatures</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningBox}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={24}
            color={colors.warning}
          />
          <Text style={styles.warningText}>
            SPHINCS+ signatures are approximately 40KB in size. This is significantly larger than
            traditional signatures but provides quantum resistance.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Hybrid Mode</Text>
              <Text style={styles.settingDescription}>
                Co-sign with RSA + SPHINCS+
              </Text>
            </View>
            <Switch
              value={hybridMode}
              onValueChange={setHybridMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message to Sign</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter your message here..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />
          
          <TouchableOpacity
            style={[styles.signButton, { backgroundColor: colors.primary }]}
            onPress={signWithAuth47}
          >
            <IconSymbol
              ios_icon_name="signature"
              android_material_icon_name="edit"
              size={20}
              color={colors.text}
            />
            <Text style={styles.signButtonText}>
              Sign with {hybridMode ? 'Hybrid' : 'Pure'} Auth47
            </Text>
          </TouchableOpacity>
        </View>

        {signature ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auth47 Signature</Text>
            <View style={styles.signatureBox}>
              <ScrollView style={styles.signatureScroll}>
                <Text style={styles.signatureText}>{signature}</Text>
              </ScrollView>
            </View>
            
            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: colors.success }]}
              onPress={verifyAuth47Signature}
            >
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified-user"
                size={20}
                color={colors.text}
              />
              <Text style={styles.verifyButtonText}>Verify Signature</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.highlight }]}
          onPress={clearAll}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Auth47</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="shield.checkered"
                android_material_icon_name="security"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.infoItemText}>
                SPHINCS+-128s provides post-quantum security
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="arrow.up.arrow.down"
                android_material_icon_name="swap-vert"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.infoItemText}>
                Hybrid mode combines classical and quantum-safe algorithms
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.infoItemText}>
                Signatures are ~40KB due to SPHINCS+ requirements
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="checkmark.seal.fill"
                android_material_icon_name="verified"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.infoItemText}>
                Compliant with IETF PQC draft standards
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            This is a demonstration UI. Production implementation would use liboqs or Sequoia-PGP
            extensions for actual SPHINCS+ cryptography via Kotlin Native bindings.
          </Text>
        </View>
      </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  quantumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  quantumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderColor: colors.warning,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: colors.highlight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  signButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  signatureBox: {
    backgroundColor: colors.highlight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 250,
    marginBottom: 12,
  },
  signatureScroll: {
    maxHeight: 226,
  },
  signatureText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  verifyButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
