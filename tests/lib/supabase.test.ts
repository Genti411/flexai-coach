import { isSupabaseConfigured, supabase } from '@/lib/supabase';

describe('supabase client', () => {
  it('is unconfigured (null) when env vars are absent', () => {
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });
});
