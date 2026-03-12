import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller is admin
  const { data: { user: caller } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!caller) return new Response('Unauthorized', { status: 401 });

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'Admin');
  if (!roles?.length) return new Response('Forbidden', { status: 403 });

  const { user_id } = await req.json();
  if (!user_id) return new Response('Missing user_id', { status: 400 });
  if (user_id === caller.id) return new Response('Cannot delete yourself', { status: 400 });

  const { error } = await supabase.auth.admin.deleteUser(user_id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
