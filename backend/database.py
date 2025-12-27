import sqlite3
from datetime import datetime, timedelta
import random

def init_db():
    """Create the database tables"""
    # Connect to database (creates it if it doesn't exist)
    conn = sqlite3.connect('emr_security.db')
    cursor = conn.cursor()
    
    # Create security events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS security_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME NOT NULL,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_role TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            action TEXT NOT NULL,
            resource_accessed TEXT,
            status TEXT NOT NULL,
            details TEXT,
            patient_id TEXT
        )
    ''')
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            department TEXT
        )
    ''')
    
    # Create policy violations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policy_violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME NOT NULL,
            user_id TEXT NOT NULL,
            violation_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT,
            resolved INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✓ Database tables created!")

def add_sample_data():
    """Add fake data for testing"""
    conn = sqlite3.connect('emr_security.db')
    cursor = conn.cursor()
    
    # Add some fake users
    users = [
        ('U001', 'dr.smith', 'Physician', 'Cardiology'),
        ('U002', 'nurse.johnson', 'Nurse', 'Emergency'),
        ('U003', 'admin.lee', 'Administrator', 'IT'),
        ('U004', 'dr.patel', 'Physician', 'Pediatrics'),
        ('U005', 'clerk.wong', 'Clerk', 'Registration')
    ]
    
    for user in users:
        cursor.execute('''
            INSERT OR IGNORE INTO users (user_id, username, role, department)
            VALUES (?, ?, ?, ?)
        ''', user)
    
    print("✓ Added sample users!")
    
    # Add fake security events
    event_types = ['LOGIN_FAILED', 'LOGIN_SUCCESS', 'DATA_ACCESS', 'DATA_EXPORT', 
                   'UNAUTHORIZED_ACCESS', 'POLICY_VIOLATION']
    severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    statuses = ['SUCCESS', 'FAILED', 'BLOCKED']
    
    now = datetime.now()
    
    # Create 100 fake events
    for i in range(100):
        # Random time in the last 7 days
        random_time = now - timedelta(
            days=random.randint(0, 7),
            hours=random.randint(0, 23)
        )
        
        # Pick random values
        user = random.choice(users)
        event_type = random.choice(event_types)
        severity = random.choice(severities)
        ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
        status = random.choice(statuses)
        
        cursor.execute('''
            INSERT INTO security_events 
            (timestamp, event_type, severity, user_id, user_role, ip_address, 
             action, status, details, patient_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            random_time.strftime('%Y-%m-%d %H:%M:%S'),
            event_type,
            severity,
            user[0],
            user[2],
            ip,
            f"Attempted {event_type}",
            status,
            f"Security event details {i}",
            f"P{random.randint(1000, 9999)}"
        ))
    
    print("✓ Added 100 sample security events!")
    
    # Add a few policy violations
    cursor.execute('''
        INSERT INTO policy_violations 
        (timestamp, user_id, violation_type, severity, description, resolved)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        now.strftime('%Y-%m-%d %H:%M:%S'),
        'U001',
        'EXCESSIVE_ACCESS',
        'HIGH',
        'Accessed 50+ patient records in 1 hour',
        0
    ))
    
    print("✓ Added sample policy violations!")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    print("Creating database...")
    init_db()
    add_sample_data()
    print("\n✅ Database setup complete! You can now run app.py")