import { useEffect, useState } from 'react';
import { generateIdentity, HermesIdentity } from '@hermes/crypto';
import { HermesStorage } from '@hermes/storage';

export function useHermesIdentity(storage: HermesStorage) {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const peerSuffix = searchParams?.get('peer') || searchParams?.get('author') || '';
  const identityKey = peerSuffix ? `peer_identity_${peerSuffix}` : 'primary_identity';
  const nameStorageKey = peerSuffix ? `hermes_display_name_${peerSuffix}` : 'hermes_display_name';
  const colorStorageKey = peerSuffix ? `hermes_user_color_${peerSuffix}` : 'hermes_user_color';
  const customSetKey = peerSuffix ? `hermes_custom_name_set_${peerSuffix}` : 'hermes_custom_name_set';

  const [identity, setIdentity] = useState<HermesIdentity | null>(null);
  const [displayName, setDisplayName] = useState<string>(() => {
    const stored = localStorage.getItem(nameStorageKey);
    if (stored && !stored.toLowerCase().includes('ashutosh')) return stored;
    return 'Author';
  });
  const [userColor, setUserColor] = useState<string>(() => {
    const colors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#c96846'];
    const defaultIdx = peerSuffix ? Math.abs(peerSuffix.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length : 0;
    return localStorage.getItem(colorStorageKey) || colors[defaultIdx];
  });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [hasCustomName, setHasCustomName] = useState(() => {
    return localStorage.getItem(customSetKey) === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initIdentity() {
      try {
        let id = await storage.loadIdentity(identityKey);
        if (!id) {
          id = await generateIdentity(true);
          await storage.saveIdentity(id, identityKey);
        }
        if (isMounted) {
          setIdentity(id);
          const shortHex = id.fingerprint.replace('hermes:', '').slice(0, 8);
          const cryptoAuthorId = `Author #${shortHex}`;
          const stored = localStorage.getItem(nameStorageKey);
          const isCustomSet = localStorage.getItem(customSetKey) === 'true';
          
          if (!stored || (!isCustomSet && (stored.toLowerCase().includes('ashutosh') || stored.startsWith('Author ')))) {
            setDisplayName(cryptoAuthorId);
            localStorage.setItem(nameStorageKey, cryptoAuthorId);
            // Prompt the user to enter their custom name on first visit
            setIsNameModalOpen(true);
          } else {
            setDisplayName(stored);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize cryptographic identity', err);
        // Fallback in-memory identity
        const fallbackId = await generateIdentity(true);
        if (isMounted) {
          setIdentity(fallbackId);
          const shortHex = fallbackId.fingerprint.replace('hermes:', '').slice(0, 8);
          setDisplayName(`Author #${shortHex}`);
          setIsNameModalOpen(true);
          setIsLoading(false);
        }
      }
    }

    initIdentity();

    return () => {
      isMounted = false;
    };
  }, [storage, identityKey, nameStorageKey, customSetKey]);

  const updateDisplayName = (name: string) => {
    setDisplayName(name);
    localStorage.setItem(nameStorageKey, name);
    localStorage.setItem(customSetKey, 'true');
    setHasCustomName(true);
  };

  const updateUserColor = (color: string) => {
    setUserColor(color);
    localStorage.setItem(colorStorageKey, color);
  };

  return {
    identity,
    displayName,
    userColor,
    isLoading,
    isNameModalOpen,
    setIsNameModalOpen,
    hasCustomName,
    updateDisplayName,
    updateUserColor,
  };
}
