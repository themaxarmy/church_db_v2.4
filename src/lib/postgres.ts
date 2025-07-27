import { Pool, type PoolClient } from 'pg';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://holy_hill_user:biogenesis@localhost:5432/holy_hill_records',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database connection helper
export class Database {
  static async query(text: string, params?: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getClient(): Promise<PoolClient> {
    return await pool.connect();
  }

  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close(): Promise<void> {
    await pool.end();
  }
}

// User interface
export interface User {
  updatedAt: string;
  createdAt: string;
  approvedAt: undefined;
  approvedBy: undefined;
  _id: string;
  id: string;
  email: string;
  password_hash: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin' | 'super_admin';
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Form record interface
export interface FormRecord {
  id: string; // Maps to _id from MongoDB
  firstName: string;
  lastName: string;
  otherNames: string;
  dateOfBirth: string;
  picture: string;
  timestamp: string; // Maps to createdAt from MongoDB
  // Add updatedAt if your API provides it or if you intend to track it
  // and map it from raw record data if available.
  updatedAt?: string; // Add this if you need to track updates and your API provides it
}

// User repository
export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await Database.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await Database.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(userData: {
    email: string;
    password_hash: string;
    status?: string;
    role?: string;
  }): Promise<User> {
    const { email, password_hash, status = 'pending', role = 'user' } = userData;
    
    // Special case for dinkomax@gmail.com
    const finalStatus = email === 'dinkomax@gmail.com' ? 'approved' : status;
    const finalRole = email === 'dinkomax@gmail.com' ? 'super_admin' : role;
    const approvedAt = email === 'dinkomax@gmail.com' ? new Date() : null;

    const result = await Database.query(
      `INSERT INTO users (email, password_hash, status, role, approved_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [email, password_hash, finalStatus, finalRole, approvedAt]
    );
    
    return result.rows[0];
  }

  static async findAll(): Promise<User[]> {
    const result = await Database.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async updateStatus(id: string, status: string, approvedBy?: string): Promise<User> {
    const approvedAt = status === 'approved' ? new Date() : null;
    
    const result = await Database.query(
      `UPDATE users 
       SET status = $1, approved_by = $2, approved_at = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [status, approvedBy, approvedAt, id]
    );
    
    return result.rows[0];
  }

  static async updateRole(id: string, role: string): Promise<User> {
    const result = await Database.query(
      `UPDATE users 
       SET role = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [role, id]
    );
    
    return result.rows[0];
  }
}

// Form record repository
export class FormRecordRepository {
  static async create(recordData: {
    first_name: string;
    last_name: string;
    other_names?: string;
    date_of_birth: string;
    picture?: string;
  }): Promise<FormRecord> {
    const { first_name, last_name, other_names, date_of_birth, picture } = recordData;
    
    const result = await Database.query(
      `INSERT INTO form_records (first_name, last_name, other_names, date_of_birth, picture) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [first_name, last_name, other_names, date_of_birth, picture]
    );
    
    return result.rows[0];
  }

  static async findAll(): Promise<FormRecord[]> {
    const result = await Database.query(
      'SELECT * FROM form_records ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async findById(id: string): Promise<FormRecord | null> {
    const result = await Database.query(
      'SELECT * FROM form_records WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id: string, updates: Partial<FormRecord>): Promise<FormRecord> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(field => updates[field as keyof FormRecord]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await Database.query(
      `UPDATE form_records 
       SET ${setClause}, updated_at = NOW() 
       WHERE id = $${fields.length + 1} 
       RETURNING *`,
      [...values, id]
    );
    
    return result.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const result = await Database.query(
      'DELETE FROM form_records WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }
}

export default Database;