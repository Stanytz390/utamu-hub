import { supabase } from '@/integrations/supabase/client';

export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) throw new Error('Admin access required');
  return true;
}

export async function getAdminEmails() {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'admin_emails')
    .single();
  return data?.value?.split(',') || [];
}