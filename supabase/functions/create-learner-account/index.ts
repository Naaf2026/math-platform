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

    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (!['parent', 'guardian', 'admin'].includes(role?.role)) return json({ error: 'Parent access required' }, 403);

    if (role?.role === 'parent' || role?.role === 'guardian') {
      const { data: parentProfile, error: profileError } = await admin.from('profiles').select('mobile_phone').eq('id', user.id).single();
      if (profileError) return json({ error: 'Could not verify your parent profile. Please try again.' }, 500);
      if (!/^\+[1-9]\d{7,14}$/.test(parentProfile?.mobile_phone || '')) {
        return json({ error: 'Add your mobile phone number in Parent Profile before registering a learner.' }, 403);
      }
    }

    const body = await req.json().catch(() => ({}));
    const displayName = String(body.display_name || '').trim();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const grade = body.grade == null ? null : String(body.grade).trim();
    const schoolName = String(body.school_name || '').trim();
    const avatarEmoji = String(body.avatar_emoji || '🧑‍🎓').trim() || '🧑‍🎓';

    if (displayName.length < 2) return json({ error: 'Learner name is required' }, 400);
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) return json({ error: 'Username must be 3-32 characters using lowercase letters, numbers, dot, underscore or hyphen' }, 400);
    if (password.length < 6) return json({ error: 'Learner password must be at least 6 characters' }, 400);
    if (!schoolName || schoolName.length > 120) return json({ error: 'Please select or enter a school (up to 120 characters)' }, 400);

    const { data: existing } = await admin.from('parent_learner_accounts').select('learner_id').eq('username', username).maybeSingle();
    if (existing) return json({ error: 'That username is already in use' }, 409);

    const internalEmail = `${username}@learner.fahi-vissnun.local`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, full_name: displayName, learner_account: true },
      app_metadata: { provider: 'email', learner_account: true, parent_id: user.id },
    });
    if (createError || !created.user) return json({ error: createError?.message || 'Could not create learner account' }, 400);

    const learnerId = created.user.id;
    const profileResult = await admin.from('profiles').upsert({ id: learnerId, full_name: displayName, display_name: displayName, grade, school_name: schoolName, avatar_emoji: avatarEmoji, account_status: 'active' }, { onConflict: 'id' });
    if (profileResult.error) {
      await admin.auth.admin.deleteUser(learnerId);
      return json({ error: profileResult.error.message }, 500);
    }

    const roleResult = await admin.from('user_roles').insert({ user_id: learnerId, role: 'student' });
    if (roleResult.error) {
      await admin.auth.admin.deleteUser(learnerId);
      return json({ error: roleResult.error.message }, 500);
    }

    const linkResult = await admin.from('parent_learner_accounts').insert({ learner_id: learnerId, parent_id: user.id, username });
    if (linkResult.error) {
      await admin.auth.admin.deleteUser(learnerId);
      return json({ error: linkResult.error.message }, 500);
    }

    const relationship = await admin.from('student_relationships').insert({ student_id: learnerId, related_user_id: user.id, relationship: 'parent', status: 'active' });
    if (relationship.error) {
      await admin.auth.admin.deleteUser(learnerId);
      return json({ error: relationship.error.message }, 500);
    }

    return json({ success: true, learner_id: learnerId, username, display_name: displayName });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});