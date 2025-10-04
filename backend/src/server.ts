import dotenv from 'dotenv';
import app from './app';
import pool from './config/database';
import { ensureDatabaseConstraints } from './config/database-fix';

dotenv.config();

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'onyx'}`);
    release();
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  
  // Fix database constraints on startup
  await ensureDatabaseConstraints();
});
