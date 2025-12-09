
// BIP47 Types and Interfaces

export interface PaymentCode {
  id: string;
  code: string; // Base58 encoded payment code
  label: string;
  version: number;
  publicKey: string;
  chainCode: string;
  createdAt: Date;
  isPayNymCompatible: boolean;
}

export interface PaymentChain {
  id: string;
  paymentCodeId: string;
  recipientCode: string;
  recipientLabel: string;
  addresses: DerivedAddress[];
  notificationTxId?: string;
  notificationSent: boolean;
  createdAt: Date;
}

export interface DerivedAddress {
  index: number;
  address: string;
  publicKey: string;
  used: boolean;
  balance: number;
  transactions: number;
}

export interface SSOSession {
  id: string;
  serviceName: string;
  serviceUrl: string;
  challenge: string;
  signature: string;
  paymentCodeId: string;
  timestamp: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
  auth47Enabled: boolean;
}

export interface SSOChallenge {
  challenge: string;
  serviceName: string;
  serviceUrl: string;
  timestamp: number;
  nonce: string;
}
