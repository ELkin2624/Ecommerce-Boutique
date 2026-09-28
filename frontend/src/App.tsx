import { useEffect } from 'react';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AppRouter } from '@/app/router/AppRouter';
import { useAuthStore } from '@/app/store/auth.store';
import { useSettingsStore } from '@/features/settings';

export function App() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Cargar automáticamente las preferencias asociadas a la cuenta del usuario activo (desde BD o localStorage)
    useSettingsStore.getState().loadUserSettings(user?.id || null, user?.preferences);
  }, [user?.id, user?.preferences]);

  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}

export default App;
