import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConsentGate } from '@/components/consent-gate';
import { ConsentProvider, useConsent } from '@/lib/consent-context';

function Gate() {
  const { ready, accepted, accept } = useConsent();
  if (!ready) return null;
  if (!accepted) return <ConsentGate onAccept={() => void accept()} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ConsentProvider>
        <Gate />
      </ConsentProvider>
    </SafeAreaProvider>
  );
}
