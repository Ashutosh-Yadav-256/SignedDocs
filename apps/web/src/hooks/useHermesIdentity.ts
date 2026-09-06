import { useEffect, useState } from 'react';
import { generateIdentity, HermesIdentity } from '@hermes/crypto';
import { HermesStorage } from '@hermes/storage';

export function useHermesIdentity(storage: HermesStorage) {
  const [identity, setIdentity] = useState<HermesIdentity | null>(null);
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem('hermes_display_name') || 'Author ' + Math.floor(Math.random() * 1000);
  });
  const [userColor, setUserColor] = useState<string>(() => {
    const colors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
    return localStorage.getItem('hermes_user_color') || colors[Math.floor(Math.random() * colors.length)];
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initIdentity() {
      try {
        let id = await storage.loadIdentity();
        if (!id) {
          id = await generateIdentity(true);
          await storage.saveIdentity(id);
        }
        if (isMounted) {
          setIdentity(id);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize cryptographic identity', err);
        // Fallback in-memory identity
        const fallbackId = await generateIdentity(true);
        if (isMounted) {
          setIdentity(fallbackId);
          setIsLoading(false);
        }
      }
    }

    initIdentity();

    return () => {
      isMounted = false;
    };
  }, [storage]);

  const updateDisplayName = (name: string) => {
    setDisplayName(name);
    localStorage.setItem('hermes_display_name', name);
  };

  const updateUserColor = (color: string) => {
    setUserColor(color);
    localStorage.setItem('hermes_user_color', color);
  };

  return {
    identity,
    displayName,
    userColor,
    isLoading,
    updateDisplayName,
    updateUserColor,
  };
}
