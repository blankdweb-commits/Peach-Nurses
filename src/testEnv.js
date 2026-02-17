// src/testEnv.js
console.log('=== ENVIRONMENT VARIABLES TEST ===');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log('All REACT_APP_ variables:');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('REACT_APP_')) {
    console.log(`  ${key}: ${process.env[key] ? '✅' : '❌'}`);
  }
});
console.log('===================================');