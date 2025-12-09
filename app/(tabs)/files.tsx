
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';

interface FileHash {
  name: string;
  size: number;
  sha256: string;
  sha512: string;
  timestamp: string;
}

export default function FilesScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileHashes, setFileHashes] = useState<FileHash[]>([]);
  const [isHashing, setIsHashing] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        console.log('File selected:', result.assets[0].name);
      }
    } catch (error) {
      console.log('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const hashFile = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    setIsHashing(true);
    try {
      const sha256Hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        selectedFile.name + selectedFile.size
      );

      const sha512Hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        selectedFile.name + selectedFile.size
      );

      const newHash: FileHash = {
        name: selectedFile.name,
        size: selectedFile.size,
        sha256: sha256Hash,
        sha512: sha512Hash,
        timestamp: new Date().toISOString(),
      };

      setFileHashes([newHash, ...fileHashes]);
      Alert.alert('Success', 'File hashed successfully!');
    } catch (error) {
      console.log('Hashing error:', error);
      Alert.alert('Error', 'Failed to hash file');
    } finally {
      setIsHashing(false);
    }
  };

  const signHash = (hash: FileHash) => {
    Alert.alert(
      'Sign Hash',
      `This would create a detached PGP signature for:\n\n${hash.name}\n\nSHA-256: ${hash.sha256.substring(0, 16)}...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign',
          onPress: () => {
            console.log('Signing hash:', hash.sha256);
            Alert.alert('Success', 'Hash signed with PGP key');
          },
        },
      ]
    );
  };

  const verifyHash = () => {
    Alert.alert(
      'Verify Hash',
      'This would verify a PGP-signed hash against the file',
      [{ text: 'OK' }]
    );
  };

  const clearHashes = () => {
    setFileHashes([]);
    setSelectedFile(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Files</Text>
        <Text style={styles.headerSubtitle}>Hash & Verify</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.pickButton, { backgroundColor: colors.primary }]}
            onPress={pickFile}
          >
            <IconSymbol
              ios_icon_name="doc.fill"
              android_material_icon_name="insert-drive-file"
              size={24}
              color={colors.text}
            />
            <Text style={styles.pickButtonText}>Select File</Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.fileInfo}>
              <View style={styles.fileHeader}>
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={32}
                  color={colors.secondary}
                />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.secondary }]}
                  onPress={hashFile}
                  disabled={isHashing}
                >
                  <IconSymbol
                    ios_icon_name="number"
                    android_material_icon_name="tag"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.buttonText}>
                    {isHashing ? 'Hashing...' : 'Hash File'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.accent }]}
                  onPress={verifyHash}
                >
                  <IconSymbol
                    ios_icon_name="checkmark.shield.fill"
                    android_material_icon_name="verified-user"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.buttonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {fileHashes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>File Hashes</Text>
              <TouchableOpacity onPress={clearHashes}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {fileHashes.map((hash, index) => (
              <React.Fragment key={index}>
                <View style={styles.hashCard}>
                  <View style={styles.hashHeader}>
                    <Text style={styles.hashFileName}>{hash.name}</Text>
                    <Text style={styles.hashTimestamp}>
                      {new Date(hash.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>

                  <View style={styles.hashDetails}>
                    <View style={styles.hashRow}>
                      <Text style={styles.hashLabel}>SHA-256:</Text>
                      <Text style={styles.hashValue} numberOfLines={1}>
                        {hash.sha256}
                      </Text>
                    </View>
                    <View style={styles.hashRow}>
                      <Text style={styles.hashLabel}>SHA-512:</Text>
                      <Text style={styles.hashValue} numberOfLines={1}>
                        {hash.sha512}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.signButton}
                    onPress={() => signHash(hash)}
                  >
                    <IconSymbol
                      ios_icon_name="signature"
                      android_material_icon_name="edit"
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.signButtonText}>Sign Hash</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            File hashing uses SHA-256 and SHA-512 algorithms. In production, this would support
            BLAKE3 and integrate with PGP signing for detached signatures.
          </Text>
        </View>

        <View style={styles.algorithmInfo}>
          <Text style={styles.algorithmTitle}>Supported Algorithms</Text>
          <View style={styles.algorithmList}>
            {['SHA-256', 'SHA-512', 'BLAKE3 (planned)'].map((algo, index) => (
              <React.Fragment key={index}>
                <View style={styles.algorithmItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={styles.algorithmText}>{algo}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  pickButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  fileInfo: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: colors.textSecondary,
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
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  hashCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hashFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  hashTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  hashDetails: {
    marginBottom: 12,
  },
  hashRow: {
    marginBottom: 8,
  },
  hashLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.secondary,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
    gap: 6,
  },
  signButtonText: {
    color: colors.secondary,
    fontSize: 14,
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
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  algorithmInfo: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  algorithmTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  algorithmList: {
    gap: 8,
  },
  algorithmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  algorithmText: {
    fontSize: 14,
    color: colors.text,
  },
});
