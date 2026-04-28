const { createClient } = require('@supabase/supabase-js');
try {
  createClient('', 'fake');
  console.log("No error");
} catch (e) {
  console.error("Error:", e.message);
}
