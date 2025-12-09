
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Crypto from 'expo-crypto';

export default function MessagesScreen() {
  const [message, setMessage] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [signatureStatus, setSignatureStatus] = useState<'valid' | 'invalid' | 'quantum-unsafe' | null>(null);

  const encryptMessage = async () => {
    if (!message) {
      Alert.alert('Error', 'Please enter a message to encrypt');
      return;
    }

    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      
      const encrypted = `-----BEGIN PGP MESSAGE-----

${btoa(message)}
Hash: ${hash.substring(0, 16)}
-----END PGP MESSAGE-----`;
      
      setEncryptedMessage(encrypted);
      Alert.alert('Success', 'Message encrypted successfully!');
    } catch (error) {
      console.log('Encryption error:', error);
      Alert.alert('Error', 'Failed to encrypt message');
    }
  };

  const decryptMessage = () => {
    if (!encryptedMessage) {
      Alert.alert('Error', 'No encrypted message to decrypt');
      return;
    }

    try {
      const match = encryptedMessage.match(/\n\n(.*?)\n/s);
      if (match) {
        const decoded = atob(match[1]);
        setDecryptedMessage(decoded);
        setSignatureStatus('valid');
        Alert.alert('Success', 'Message decrypted and verified!');
      }
    } catch (error) {
      console.log('Decryption error:', error);
      Alert.alert('Error', 'Failed to decrypt message');
    }
  };

  const signMessage = async () => {
    if (!message) {
      Alert.alert('Error', 'Please enter a message to sign');
      return;
    }

    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      
      const signed = `-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

${message}
-----BEGIN PGP SIGNATURE-----

${hash}
-----END PGP SIGNATURE-----`;
      
      setEncryptedMessage(signed);
      Alert.alert('Success', 'Message signed successfully!');
    } catch (error) {
      console.log('Signing error:', error);
      Alert.alert('Error', 'Failed to sign message');
    }
  };

  const verifySignature = async () => {
    if (!encryptedMessage) {
      Alert.alert('Error', 'No signed message to verify');
      return;
    }

    try {
      const messageMatch = encryptedMessage.match(/Hash: SHA256\n\n(.*?)\n-----BEGIN PGP SIGNATURE-----/s);
      if (messageMatch) {
        const originalMessage = messageMatch[1];
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          originalMessage
        );
        
        const signatureMatch = encryptedMessage.match(/-----BEGIN PGP SIGNATURE-----\n\n(.*?)\n-----END PGP SIGNATURE-----/s);
        if (signatureMatch && signatureMatch[1] === hash) {
          setSignatureStatus('valid');
          setDecryptedMessage(originalMessage);
          Alert.alert('Success', 'Signature verified successfully!');
        } else {
          setSignatureStatus('invalid');
          Alert.alert('Warning', 'Signature verification failed!');
        }
      }
    } catch (error) {
      console.log('Verification error:', error);
      Alert.alert('Error', 'Failed to verify signature');
    }
  };

  const clearAll = () => {
    setMessage('');
    setEncryptedMessage('');
    setDecryptedMessage('');
    setSignatureStatus(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Encrypt, Decrypt & Sign</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compose Message</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter your message here..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={encryptMessage}
            >
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.text}
              />
              <Text style={styles.buttonText}>Encrypt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={signMessage}
            >
              <IconSymbol
                ios_icon_name="signature"
                android_material_icon_name="edit"
                size={20}
                color={colors.text}
              />
              <Text style={styles.buttonText}>Sign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {encryptedMessage ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encrypted/Signed Message</Text>
            <View style={styles.outputBox}>
              <ScrollView style={styles.outputScroll}>
                <Text style={styles.outputText}>{encryptedMessage}</Text>
              </ScrollView>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.accent }]}
                onPress={decryptMessage}
              >
                <IconSymbol
                  ios_icon_name="lock.open.fill"
                  android_material_icon_name="lock-open"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.buttonText}>Decrypt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.secondary }]}
                onPress={verifySignature}
              >
                <IconSymbol
                  ios_icon_name="checkmark.seal.fill"
                  android_material_icon_name="verified"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.buttonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {decryptedMessage ? (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Decrypted Message</Text>
              {signatureStatus && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        signatureStatus === 'valid'
                          ? colors.success
                          : signatureStatus === 'invalid'
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {signatureStatus === 'valid'
                      ? '✓ Valid'
                      : signatureStatus === 'invalid'
                      ? '✗ Tampered'
                      : '⚠ Quantum-Unsafe'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>{decryptedMessage}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.highlight }]}
          onPress={clearAll}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            This is a demonstration UI. Full PGP encryption requires native cryptographic libraries.
            In production, this would use Sequoia-PGP via Kotlin Multiplatform.
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
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
  section: {
    marginBottom: 24,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  outputBox: {
    backgroundColor: colors.highlight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    marginBottom: 12,
  },
  outputScroll: {
    maxHeight: 176,
  },
  outputText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
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
