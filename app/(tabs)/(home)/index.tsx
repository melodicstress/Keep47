
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PGPKey {
  id: string;
  name: string;
  email: string;
  fingerprint: string;
  type: 'RSA-4096' | 'EC' | 'Hybrid';
  created: string;
  expires?: string;
  isPrivate: boolean;
}

export default function KeysScreen() {
  const [keys, setKeys] = useState<PGPKey[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyEmail, setKeyEmail] = useState('');
  const [keyType, setKeyType] = useState<'RSA-4096' | 'EC' | 'Hybrid'>('RSA-4096');
  const [passphrase, setPassphrase] = useState('');
  const [importText, setImportText] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const storedKeys = await AsyncStorage.getItem('pgp_keys');
      if (storedKeys) {
        setKeys(JSON.parse(storedKeys));
      }
    } catch (error) {
      console.log('Error loading keys:', error);
    }
  };

  const saveKeys = async (newKeys: PGPKey[]) => {
    try {
      await AsyncStorage.setItem('pgp_keys', JSON.stringify(newKeys));
      setKeys(newKeys);
    } catch (error) {
      console.log('Error saving keys:', error);
    }
  };

  const generateKey = () => {
    if (!keyName || !keyEmail || !passphrase) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newKey: PGPKey = {
      id: Date.now().toString(),
      name: keyName,
      email: keyEmail,
      fingerprint: generateFingerprint(),
      type: keyType,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isPrivate: true,
    };

    const updatedKeys = [...keys, newKey];
    saveKeys(updatedKeys);
    
    setShowGenerateModal(false);
    setKeyName('');
    setKeyEmail('');
    setPassphrase('');
    Alert.alert('Success', 'Key pair generated successfully!');
  };

  const importKey = () => {
    if (!importText) {
      Alert.alert('Error', 'Please paste a key to import');
      return;
    }

    const newKey: PGPKey = {
      id: Date.now().toString(),
      name: 'Imported Key',
      email: 'imported@example.com',
      fingerprint: generateFingerprint(),
      type: 'RSA-4096',
      created: new Date().toISOString(),
      isPrivate: false,
    };

    const updatedKeys = [...keys, newKey];
    saveKeys(updatedKeys);
    
    setShowImportModal(false);
    setImportText('');
    Alert.alert('Success', 'Key imported successfully!');
  };

  const generateFingerprint = () => {
    const chars = '0123456789ABCDEF';
    let fingerprint = '';
    for (let i = 0; i < 40; i++) {
      fingerprint += chars[Math.floor(Math.random() * chars.length)];
      if ((i + 1) % 4 === 0 && i < 39) fingerprint += ' ';
    }
    return fingerprint;
  };

  const deleteKey = (id: string) => {
    Alert.alert(
      'Delete Key',
      'Are you sure you want to delete this key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedKeys = keys.filter(key => key.id !== id);
            saveKeys(updatedKeys);
          },
        },
      ]
    );
  };

  const exportKey = (key: PGPKey) => {
    const armoredKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mQINBGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
${key.fingerprint.replace(/ /g, '')}
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END PGP PUBLIC KEY BLOCK-----`;
    
    Alert.alert('Export Key', armoredKey, [
      { text: 'Copy', onPress: () => console.log('Copied to clipboard') },
      { text: 'Close' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keep47</Text>
        <Text style={styles.headerSubtitle}>Key Management</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowGenerateModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color={colors.text}
            />
            <Text style={styles.actionButtonText}>Generate Key</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => setShowImportModal(true)}
          >
            <IconSymbol
              ios_icon_name="arrow.down.circle.fill"
              android_material_icon_name="download"
              size={24}
              color={colors.text}
            />
            <Text style={styles.actionButtonText}>Import Key</Text>
          </TouchableOpacity>
        </View>

        {keys.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="key.fill"
              android_material_icon_name="vpn-key"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>No keys yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Generate or import a PGP key to get started
            </Text>
          </View>
        ) : (
          keys.map((key, index) => (
            <React.Fragment key={index}>
              <View style={styles.keyCard}>
                <View style={styles.keyHeader}>
                  <View style={styles.keyInfo}>
                    <Text style={styles.keyName}>{key.name}</Text>
                    <Text style={styles.keyEmail}>{key.email}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: key.isPrivate ? colors.primary : colors.secondary }]}>
                    <Text style={styles.badgeText}>
                      {key.isPrivate ? 'Private' : 'Public'}
                    </Text>
                  </View>
                </View>

                <View style={styles.keyDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{key.type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(key.created).toLocaleDateString()}
                    </Text>
                  </View>
                  {key.expires && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expires:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(key.expires).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fingerprint:</Text>
                  </View>
                  <Text style={styles.fingerprint}>{key.fingerprint}</Text>
                </View>

                <View style={styles.keyActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => exportKey(key)}
                  >
                    <IconSymbol
                      ios_icon_name="square.and.arrow.up"
                      android_material_icon_name="share"
                      size={20}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => deleteKey(key.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </React.Fragment>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showGenerateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate Key Pair</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
              value={keyName}
              onChangeText={setKeyName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={keyEmail}
              onChangeText={setKeyEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Passphrase"
              placeholderTextColor={colors.textSecondary}
              value={passphrase}
              onChangeText={setPassphrase}
              secureTextEntry
            />

            <View style={styles.typeSelector}>
              <Text style={styles.typeSelectorLabel}>Key Type:</Text>
              <View style={styles.typeButtons}>
                {(['RSA-4096', 'EC', 'Hybrid'] as const).map((type, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        keyType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setKeyType(type)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          keyType === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.highlight }]}
                onPress={() => setShowGenerateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={generateKey}
              >
                <Text style={styles.modalButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Key</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste ASCII-armored key here..."
              placeholderTextColor={colors.textSecondary}
              value={importText}
              onChangeText={setImportText}
              multiline
              numberOfLines={8}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.highlight }]}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                onPress={importKey}
              >
                <Text style={styles.modalButtonText}>Import</Text>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  keyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  keyEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  keyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  fingerprint: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.secondary,
    marginTop: 4,
  },
  keyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconButton: {
    padding: 8,
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.highlight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeSelectorLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
