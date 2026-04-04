import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Error desconocido'
}

export async function GET() {
  try {
    const supabase = await createClient();
    const email = 'lordget_yt@hotmail.com';
    
    // 1. Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol, email')
      .eq('email', email)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', details: userError });
    }
    
    // 2. Get standard explicit memberships
    const { data: explicitMemberships, error: memError } = await supabase
      .from('organization_users')
      .select('organization_id, role, status, organizations(name, slug)')
      .eq('user_id', user.id);
      
    // 3. Get API memberships query
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

    return NextResponse.json({
      user,
      explicitMemberships: explicitMemberships || memError,
      apiMemberships: apiMemberships || apiError,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) });
  }
}
