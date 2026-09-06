import * as Y from 'yjs';

/**
 * Safely extracts plain text content from a Y.Doc field ('default')
 * regardless of whether it was stored as Y.XmlFragment (TipTap) or Y.Text.
 */
export function extractTextFromYDoc(doc: Y.Doc, fieldName: string = 'default'): string {
  try {
    const share = (doc as any).share;
    if (share && share.has(fieldName)) {
      const type = share.get(fieldName);
      // Check if it's an XmlFragment or has toJSON
      if (type instanceof Y.XmlFragment || type?.constructor?.name === 'XmlFragment') {
        const fragment = doc.getXmlFragment(fieldName);
        return formatXmlFragmentToText(fragment);
      }
      if (type instanceof Y.Text || type?.constructor?.name === 'Text') {
        const ytext = doc.getText(fieldName);
        return ytext.toString();
      }
    }

    // Default attempt: try XmlFragment first (TipTap standard)
    const fragment = doc.getXmlFragment(fieldName);
    return formatXmlFragmentToText(fragment);
  } catch {
    try {
      const ytext = doc.getText(fieldName);
      return ytext.toString();
    } catch {
      return '';
    }
  }
}

function formatXmlFragmentToText(fragment: Y.XmlFragment): string {
  try {
    const rawXml = fragment.toString();
    if (!rawXml) return '';
    return rawXml
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return '';
  }
}
