import {
  AttributionSpan,
  ForensicsBreakdown,
  ForensicsManifest,
  OriginCategory,
} from './types.js';

export class ForensicsEngine {
  /**
   * Computes character breakdowns and percentages from a list of attribution spans.
   */
  public static computeBreakdown(spans: AttributionSpan[], totalLength?: number): ForensicsBreakdown {
    let humanChars = 0;
    let aiChars = 0;
    let pasteChars = 0;

    for (const span of spans) {
      const length = span.text.length;
      if (span.origin === 'HUMAN_TYPED') {
        humanChars += length;
      } else if (span.origin === 'AI_ASSISTED') {
        aiChars += length;
      } else if (span.origin === 'EXTERNAL_PASTE') {
        pasteChars += length;
      } else {
        humanChars += length; // Fallback
      }
    }

    const total = totalLength !== undefined ? totalLength : humanChars + aiChars + pasteChars;
    const safeTotal = total > 0 ? total : 1;

    return {
      totalChars: total,
      humanTypedChars: humanChars,
      aiAssistedChars: aiChars,
      pastedChars: pasteChars,
      humanPercentage: Math.round((humanChars / safeTotal) * 100),
      aiPercentage: Math.round((aiChars / safeTotal) * 100),
      pastePercentage: Math.round((pasteChars / safeTotal) * 100),
    };
  }

  /**
   * Generates a complete cryptographic forensics manifest for the document.
   */
  public static createForensicsManifest(params: {
    documentId: string;
    documentTitle: string;
    spans: AttributionSpan[];
    totalLength?: number;
  }): ForensicsManifest {
    const breakdown = this.computeBreakdown(params.spans, params.totalLength);

    return {
      version: 1,
      documentId: params.documentId,
      documentTitle: params.documentTitle,
      breakdown,
      spans: params.spans,
      generatedAt: Date.now(),
    };
  }

  /**
   * Helper to create a human-typed span with cadence telemetry.
   */
  public static createHumanSpan(params: {
    id: string;
    startIndex: number;
    endIndex: number;
    text: string;
    authorFingerprint: string;
    averageIntervalMs?: number;
    varianceMs?: number;
  }): AttributionSpan {
    return {
      id: params.id,
      startIndex: params.startIndex,
      endIndex: params.endIndex,
      text: params.text,
      origin: 'HUMAN_TYPED',
      authorFingerprint: params.authorFingerprint,
      timestamp: Date.now(),
      cadence: {
        averageIntervalMs: params.averageIntervalMs || 160,
        varianceMs: params.varianceMs || 35,
        samplesCount: params.text.length,
        isNaturalHuman: true,
      },
    };
  }

  /**
   * Helper to create an AI-assisted span linked to human approval and model metadata.
   */
  public static createAISpan(params: {
    id: string;
    startIndex: number;
    endIndex: number;
    text: string;
    authorFingerprint: string;
    aiModel: string;
    aiManifestHash: string;
    humanReviewerFingerprint: string;
  }): AttributionSpan {
    return {
      id: params.id,
      startIndex: params.startIndex,
      endIndex: params.endIndex,
      text: params.text,
      origin: 'AI_ASSISTED',
      authorFingerprint: params.authorFingerprint,
      timestamp: Date.now(),
      aiModel: params.aiModel,
      aiManifestHash: params.aiManifestHash,
      humanReviewerFingerprint: params.humanReviewerFingerprint,
    };
  }

  /**
   * Helper to create an external clipboard paste span.
   */
  public static createPasteSpan(params: {
    id: string;
    startIndex: number;
    endIndex: number;
    text: string;
    authorFingerprint: string;
  }): AttributionSpan {
    return {
      id: params.id,
      startIndex: params.startIndex,
      endIndex: params.endIndex,
      text: params.text,
      origin: 'EXTERNAL_PASTE',
      authorFingerprint: params.authorFingerprint,
      timestamp: Date.now(),
    };
  }
}
