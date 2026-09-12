import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'Authorization required' }, 401);
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);
    const { data: role, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleError || !['parent', 'guardian', 'admin'].includes(role?.role)) return json({ error: 'Parent access required' }, 403);
    const body = await req.json().catch(() => ({}));
    const learnerId = String(body.learner_id || '').trim();
    const action = String(body.action || '').trim();
    const newPassword = String(body.new_password || '');
    if (!learnerId) return json({ error: 'Learner is required' }, 400);
    if (!['enable', 'disable', 'reset_password'].includes(action)) return json({ error: 'Invalid action' }, 400);
    if (role?.role !== 'admin') {
      const { data: link, error: linkError } = await admin.from('parent_learner_accounts').select('learner_id').eq('learner_id', learnerId).eq('parent_id', user.id).maybeSingle();
      if (linkError || !link) return json({ error: 'Learner is not linked to this parent' }, 403);
    }
    if (action === 'enable' || action === 'disable') {
      const accountStatus = action === 'enable' ? 'active' : 'disabled';
      const { error } = await admin.from('profiles').update({ account_status: accountStatus, updated_at: new Date().toISOString() }).eq('id', learnerId);
      if (error) return json({ error: error.message }, 500);
      if (action === 'disable') {
        const { error: signOutError } = await admin.auth.admin.signOut(learnerId, 'global');
        if (signOutError) return json({ error: signOutError.message }, 500);
      }
      return json({ success: true, action, account_status: accountStatus });
    }
    if (newPassword.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);
    if (newPassword.length > 128) return json({ error: 'Password is too long' }, 400);
    const { data: targetUser, error: targetError } = await admin.auth.admin.getUserById(learnerId);
    if (targetError || !targetUser.user) return json({ error: 'Learner account not found' }, 404);
    if (targetUser.user.user_metadata?.learner_account !== true) return json({ error: 'Target is not a learner account' }, 400);
    const { error: passwordError } = await admin.auth.admin.updateUserById(learnerId, { password: newPassword });
    if (passwordError) return json({ error: passwordError.message }, 500);
    return json({ success: true, action: 'reset_password' });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
