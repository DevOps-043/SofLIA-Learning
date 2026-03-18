import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrqnnmuckznvukjvfkly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycW5ubXVja3pudnVranZma2x5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzczNDUyMSwiZXhwIjoyMDgzMzEwNTIxfQ.BGR8J66Aou16S1hor4L--HJkrzffc0PZmSPf-0rWtD4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const moduleId = 'bd3ef202-34f1-4291-bd74-0c864742471f';
  console.log(`Fetching lessons for module ${moduleId}...`);
  
  const { data: lessons, error: fetchError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_order_index')
    .eq('module_id', moduleId)
    .order('lesson_order_index');
    
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  
  if (!lessons || lessons.length === 0) {
    console.log('No lessons found for this module.');
    return;
  }
  
  console.log('Current lessons:', lessons);
  
  // Try to swap the first and second
  if (lessons.length < 2) return;
  
  const newOrder = [
    { lesson_id: lessons[0].lesson_id, lesson_order_index: 2 },
    { lesson_id: lessons[1].lesson_id, lesson_order_index: 1 }
  ];
  
  console.log('Attempting to reorder to:', newOrder);
  
  // Step 1: Shift by 10000
  console.log('Step 1: Shifting by 10000 to avoid constraints...');
  const tempUpdates = newOrder.map(lesson => 
    supabase
      .from('course_lessons')
      .update({ lesson_order_index: lesson.lesson_order_index + 10000 })
      .eq('lesson_id', lesson.lesson_id)
  );
  
  const tempResults = await Promise.all(tempUpdates);
  const tempErrors = tempResults.filter(r => r.error);
  if (tempErrors.length > 0) {
    console.error('Step 1 Errors:', tempErrors.map(e => e.error));
    return;
  }
  console.log('Step 1 Success!');
  
  // Step 2: Final values
  console.log('Step 2: Updating to final values...');
  const finalUpdates = newOrder.map(lesson => 
    supabase
      .from('course_lessons')
      .update({ lesson_order_index: lesson.lesson_order_index })
      .eq('lesson_id', lesson.lesson_id)
  );
  
  const finalResults = await Promise.all(finalUpdates);
  const finalErrors = finalResults.filter(r => r.error);
  if (finalErrors.length > 0) {
    console.error('Step 2 Errors:', finalErrors.map(e => e.error));
    return;
  }
  console.log('Step 2 Success! Reordering completed.');
}

run().catch(console.error);
