import * as Y from 'yjs';

/**
 * Safely extracts plain text content from a Y.Doc field ('default')
 * regardless of whether it was stored as Y.XmlFragment (TipTap) or Y.Text.
 */
export function extractTextFromYDoc(doc: Y.Doc, fieldName: string = 'default'): string {
  try {
    const fragment = doc.getXmlFragment(fieldName);
    const rawXml = fragment ? fragment.toString() : '';
    if (rawXml && rawXml.trim()) {
      return rawXml
        .replace(/<\/?[^>]+(>|$)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const ytext = doc.getText(fieldName);
    return ytext ? ytext.toString().trim() : '';
  } catch {
    return '';
  }
}

/**
 * Replaces the entire content of a Y.Doc field ('default') with new plain text.
 */
export function replaceYDocContent(doc: Y.Doc, newContent: string, fieldName: string = 'default'): void {
  doc.transact(() => {
    try {
      const fragment = doc.getXmlFragment(fieldName);
      while (fragment.length > 0) {
        fragment.delete(0, 1);
      }
      const p = new Y.XmlElement('paragraph');
      p.insert(0, [new Y.XmlText(newContent)]);
      fragment.insert(0, [p]);
    } catch {
      const ytext = doc.getText(fieldName);
      if (ytext) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, newContent);
      }
    }
  });
}
