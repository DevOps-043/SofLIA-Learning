import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkUserOrgs() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const email = 'lordget_yt@hotmail.com';
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, cargo_rol, email')
    .eq('email', email)
    .single();
    
  if (userError || !user) {
    console.error('User not found:', email, userError);
    return;
  }
  
  console.log('User found:', { id: user.id, email: user.email, role: user.cargo_rol });
  
  const { data: memberships, error: memError } = await supabase
    .from('organization_users')
    .select('organization_id, role, status, organizations(name, slug)')
    .eq('user_id', user.id);
    
  if (memError) {
    console.error('Error fetching memberships:', memError);
  } else {
    console.log('Memberships length:', memberships.length);
    console.dir(memberships, { depth: null });
  }
  
  // also check how API fetches it based on exact the same query
  const { data: apiMemberships, error: apiError } = await supabase
      .from('organization_users')
      .select(`
        role,
        joined_at,
        organizations!inner (
          id,
          name,
          slug,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('organizations.is_active', true);

  console.log('API would return length:', apiMemberships?.length);
  console.dir(apiMemberships, { depth: null });
}

checkUserOrgs();
