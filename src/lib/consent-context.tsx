import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { deleteData, getConsent, setConsentAccepted } from '@/lib/store';

interface ConsentContextValue {
  ready: boolean;
  accepted: boolean;
  accept: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    getConsent().then((c) => {
      if (!active) return;
      setAccepted(c.accepted);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const accept = async () => {
    await setConsentAccepted();
    setAccepted(true);
  };

  const resetAll = async () => {
    await deleteData();
    setAccepted(false);
  };

  return (
    <ConsentContext.Provider value={{ ready, accepted, accept, resetAll }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within a ConsentProvider');
  return ctx;
}
