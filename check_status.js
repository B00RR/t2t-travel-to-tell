const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zlgxvogwyvqmezzhelfn:P51Crf$TDJA6%t@b3RRQ@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  try {
    await client.connect();

    // Check tables
    const tables = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename', ['public']);
    console.log('Tables:', tables.rows.map(r => r.tablename).join(', '));

    // Check functions
    const funcs = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND data_type = 'void' OR data_type = 'setof' ORDER BY routine_name");
    console.log('Functions (void/setof):', funcs.rows.map(r => r.routine_name).join(', ') || 'NONE');

    // Check search_diaries specifically
    const searchDiaries = await client.query("SELECT proname FROM pg_proc WHERE proname = 'search_diaries'");
    console.log('search_diaries exists:', searchDiaries.rows.length > 0);

    // Check push_tokens table
    const pushTokens = await client.query("SELECT tablename FROM pg_tables WHERE tablename = 'push_tokens'");
    console.log('push_tokens exists:', pushTokens.rows.length > 0);

    // Check diary_presence
    const presence = await client.query("SELECT tablename FROM pg_tables WHERE tablename = 'diary_presence'");
    console.log('diary_presence exists:', presence.rows.length > 0);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
