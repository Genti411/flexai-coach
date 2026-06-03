import { getSession, sendCode } from '@/lib/auth';

describe('auth (unconfigured env)', () => {
  it('getSession returns null when Supabase is not configured', async () => {
    expect(await getSession()).toBeNull();
  });
  it('sendCode reports not configured', async () => {
    const r = await sendCode('a@b.com');
    expect(r.ok).toBe(false);
  });
});
