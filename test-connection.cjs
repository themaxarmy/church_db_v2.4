import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://holy_hill_user:biogenesis@localhost:5432/holy_hill_records',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');

    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL');

    // Test database query
    const result = await client.query(
      'SELECT NOW() as current_time, version() as pg_version'
    );
    console.log('✅ Database query successful');
    console.log('Current time:', result.rows[0].current_time);
    console.log(
      'PostgreSQL version:',
      result.rows[0].pg_version.split(' ')[0]
    );

    // Test tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('✅ Available tables:');
    tablesResult.rows.forEach((row) => {
      console.log('  -', row.table_name);
    });

    // Test user count
    const userCount = await client.query(
      'SELECT COUNT(*) as count FROM users'
    );
    console.log('✅ Users in database:', userCount.rows[0].count);

    // Test form records count
    const recordCount = await client.query(
      'SELECT COUNT(*) as count FROM form_records'
    );
    console.log('✅ Form records in database:', recordCount.rows[0].count);

    client.release();
    console.log(
      '\n🎉 All tests passed! Your PostgreSQL setup is working correctly.'
    );
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check if the connection details in .env are correct');
      console.log('3. Verify the database and user exist');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed:');
      console.log('1. Check your username and password');
      console.log('2. Make sure the user has proper permissions');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist:');
      console.log('1. Create the database: CREATE DATABASE holy_hill_records;');
      console.log('2. Run the schema.sql script');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
