export type OriginCategory =
  | 'HUMAN_TYPED'
  | 'AI_ASSISTED'
  | 'EXTERNAL_PASTE'
  | 'IMPORTED';

export interface KeystrokeCadenceProfile {
  averageIntervalMs: number;
  varianceMs: number;
  samplesCount: number;
  isNaturalHuman: boolean;
}

export interface AttributionSpan {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  origin: OriginCategory;
  authorFingerprint: string;
  timestamp: number;
  cadence?: KeystrokeCadenceProfile;
  aiManifestHash?: string;
  aiModel?: string;
  humanReviewerFingerprint?: string;
}

export interface ForensicsBreakdown {
  totalChars: number;
  humanTypedChars: number;
  aiAssistedChars: number;
  pastedChars: number;
  humanPercentage: number;
  aiPercentage: number;
  pastePercentage: number;
}

export interface ForensicsManifest {
  version: 1;
  documentId: string;
  documentTitle: string;
  breakdown: ForensicsBreakdown;
  spans: AttributionSpan[];
  generatedAt: number;
}
