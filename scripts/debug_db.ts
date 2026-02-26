import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Adjust path if needed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('Testing organization_course_assignments...');
  const { data: assignments, error: assignmentsError } = await supabase
    .from('organization_course_assignments')
    .select(`
      id,
      user_id,
      organization_id,
      course_id,
      due_date,
      hard_due_date,
      status,
      assigned_at,
      courses ( id, title )
    `)
    .limit(5);

  console.log('Assignments Error:', assignmentsError);
  console.log('Assignments:', JSON.stringify(assignments, null, 2));

  console.log('Testing planner_policies...');
  const { data: policies } = await supabase.from('planner_policies').select('*').limit(5);
  console.log('Policies:', JSON.stringify(policies, null, 2));
}

testQuery();
