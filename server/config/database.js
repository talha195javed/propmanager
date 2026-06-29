const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        business_name VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        emirate VARCHAR(50),
        role ENUM('admin', 'landlord', 'tenant') DEFAULT 'landlord',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create properties table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100),
        type ENUM('apartment', 'villa', 'townhouse', 'commercial') DEFAULT 'apartment',
        bedrooms INT,
        bathrooms INT,
        area_sqft INT,
        rent_amount DECIMAL(10, 2),
        status ENUM('vacant', 'occupied', 'maintenance') DEFAULT 'vacant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create tenants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        emirates_id VARCHAR(50),
        lease_start_date DATE,
        lease_end_date DATE,
        rent_amount DECIMAL(10, 2),
        status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);

    // Create payments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        property_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE,
        due_date DATE NOT NULL,
        status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);

    // Create maintenance_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        tenant_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        assigned_to VARCHAR(255),
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
      )
    `);

    // Create owners table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS owners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        unique_id VARCHAR(20),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30),
        address_line VARCHAR(255),
        city VARCHAR(100),
        emirate VARCHAR(50),
        company VARCHAR(255),
        account_manager VARCHAR(255),
        agent VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create owner_properties link table (an owner can hold many properties;
    // a property can have multiple co-owners with split ownership)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS owner_properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        property_id INT NOT NULL,
        ownership_share DECIMAL(5, 2) DEFAULT 100,
        management_fee DECIMAL(5, 2) DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_owner_property (owner_id, property_id)
      )
    `);

    // Create units table (a property holds many units)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        unit_type VARCHAR(50),
        bedrooms INT,
        bathrooms INT,
        size_sqft INT,
        market_rent DECIMAL(12, 2),
        status ENUM('vacant', 'occupied', 'expiring', 'expired') DEFAULT 'vacant',
        tenant_name VARCHAR(255),
        tenant_email VARCHAR(255),
        tenant_phone VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);

    // Add the newer property columns introduced by the Add-Property wizard.
    // MySQL has no "ADD COLUMN IF NOT EXISTS", so check information_schema first.
    const ensureColumn = async (table, column, definition) => {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_NAME, table, column]
      );
      if (rows[0].c === 0) {
        await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    };

    await ensureColumn('properties', 'image_url', 'LONGTEXT');
    await ensureColumn('properties', 'units', 'INT DEFAULT 0');
    await ensureColumn('properties', 'property_type', "VARCHAR(50) DEFAULT 'Residential'");
    await ensureColumn('properties', 'phone', 'VARCHAR(30)');
    await ensureColumn('properties', 'email', 'VARCHAR(255)');
    await ensureColumn('properties', 'emirate', 'VARCHAR(50)');
    await ensureColumn('properties', 'operating_account', 'VARCHAR(100)');
    await ensureColumn('properties', 'rental_invoice', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('properties', 'manager', 'VARCHAR(255)');

    // Newer tenant columns for the Tenants CRUD + invite flow.
    await ensureColumn('tenants', 'user_id', 'INT NULL');        // linked tenant login account (users.id)
    await ensureColumn('tenants', 'unit_id', 'INT NULL');        // linked unit (units.id)
    await ensureColumn('tenants', 'dob', 'DATE NULL');           // date of birth
    await ensureColumn('tenants', 'owner_user_id', 'INT NULL');  // landlord/manager who owns this record (scoping)

    // User profile + billing columns (Settings screens).
    await ensureColumn('users', 'emirates_id', 'VARCHAR(50)');
    await ensureColumn('users', 'dob', 'DATE NULL');
    await ensureColumn('users', 'avatar_url', 'LONGTEXT');
    await ensureColumn('users', 'plan', "VARCHAR(40) DEFAULT 'pro'");
    await ensureColumn('users', 'billing_cycle', "VARCHAR(20) DEFAULT 'monthly'");
    await ensureColumn('users', 'plan_started', 'DATE NULL');

    // Team members (Roles & Permissions). Permissions are stored config
    // (rendered in Settings) — enforcement across the app is out of scope.
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_user_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30),
        emirates_id VARCHAR(50),
        dob DATE,
        admin_type ENUM('super_admin', 'view_only', 'custom') DEFAULT 'view_only',
        status ENUM('active', 'inactive') DEFAULT 'active',
        permissions LONGTEXT,
        property_permissions LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Newer maintenance (service request) columns.
    await ensureColumn('maintenance_requests', 'user_id', 'INT NULL');          // scoping (landlord/manager)
    await ensureColumn('maintenance_requests', 'reference_number', 'VARCHAR(20)');
    await ensureColumn('maintenance_requests', 'unit_id', 'INT NULL');
    await ensureColumn('maintenance_requests', 'category', 'VARCHAR(50)');
    await ensureColumn('maintenance_requests', 'photos', 'LONGTEXT');           // JSON array of data URLs
    // Widen the status set to the service-request lifecycle. Idempotent MODIFY;
    // guarded since it can fail if pre-existing rows hold out-of-range values.
    try {
      await connection.execute(
        `ALTER TABLE maintenance_requests
         MODIFY COLUMN status ENUM('in_progress','resolved','closed','reverted')
         DEFAULT 'in_progress'`
      );
    } catch (e) {
      console.warn('maintenance_requests status enum migration skipped:', e.message);
    }

    // Create leases table (one tenant may have leases over time; the latest
    // active lease drives the tenant's "current rent" and term in the list).
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS leases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        region VARCHAR(120),
        landlord_owner_id INT,
        tenant_id INT NOT NULL,
        property_id INT NOT NULL,
        unit_id INT,
        lease_type VARCHAR(40) DEFAULT 'Yearly',
        lease_length VARCHAR(40),
        start_date DATE,
        rental_invoice_date DATE,
        annual_rent DECIMAL(12, 2),
        payment_schedule VARCHAR(60),
        security_deposit DECIMAL(12, 2),
        key_deposit DECIMAL(12, 2),
        clauses TEXT,
        status ENUM('active', 'draft', 'expired', 'terminated') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);

    // Create tasks table (standalone operational tasks).
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        assign_to VARCHAR(255),
        due_date DATE,
        priority ENUM('low', 'medium', 'high') DEFAULT 'low',
        related_property_id INT,
        notification_emails TEXT,
        status ENUM('open', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = { pool, initDatabase };
