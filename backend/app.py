from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta

# Create Flask app
app = Flask(__name__)
CORS(app)  # Allow frontend to talk to backend

def get_db():
    """Connect to database"""
    conn = sqlite3.connect('emr_security.db')
    conn.row_factory = sqlite3.Row  # Return results as dictionaries
    return conn

@app.route('/')
def home():
    """Test endpoint"""
    return "EMR Security Dashboard API is running!"

@app.route('/api/dashboard/summary')
def get_summary():
    """Get summary statistics for the dashboard"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get timestamp for 24 hours ago
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    
    # Count total events in last 24 hours
    cursor.execute(
        'SELECT COUNT(*) as count FROM security_events WHERE timestamp > ?',
        (yesterday,)
    )
    total = cursor.fetchone()['count']
    
    # Count critical events
    cursor.execute(
        'SELECT COUNT(*) as count FROM security_events WHERE timestamp > ? AND severity = "CRITICAL"',
        (yesterday,)
    )
    critical = cursor.fetchone()['count']
    
    # Count failed logins
    cursor.execute(
        'SELECT COUNT(*) as count FROM security_events WHERE timestamp > ? AND event_type = "LOGIN_FAILED"',
        (yesterday,)
    )
    failed = cursor.fetchone()['count']
    
    # Count unresolved violations
    cursor.execute(
        'SELECT COUNT(*) as count FROM policy_violations WHERE resolved = 0'
    )
    violations = cursor.fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'total_events': total,
        'critical_events': critical,
        'failed_logins': failed,
        'unresolved_violations': violations
    })

@app.route('/api/events')
def get_events():
    """Get list of security events"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get recent events (limited to 100)
    cursor.execute(
        'SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 100'
    )
    events = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(events)

@app.route('/api/events/timeline')
def get_timeline():
    """Get events grouped by date for chart"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get last 7 days
    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT 
            DATE(timestamp) as date,
            severity,
            COUNT(*) as count
        FROM security_events
        WHERE timestamp > ?
        GROUP BY DATE(timestamp), severity
        ORDER BY date DESC
    ''', (start_date,))
    
    results = cursor.fetchall()
    conn.close()
    
    # Format data for the chart
    data_by_date = {}
    for row in results:
        date = row['date']
        if date not in data_by_date:
            data_by_date[date] = {
                'date': date,
                'LOW': 0,
                'MEDIUM': 0,
                'HIGH': 0,
                'CRITICAL': 0
            }
        data_by_date[date][row['severity']] = row['count']
    
    return jsonify(list(data_by_date.values()))

@app.route('/api/violations')
def get_violations():
    """Get policy violations"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT v.*, u.username, u.role, u.department
        FROM policy_violations v
        JOIN users u ON v.user_id = u.user_id
        WHERE v.resolved = 0
        ORDER BY v.timestamp DESC
    ''')
    
    violations = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(violations)

@app.route('/api/users/suspicious')
def get_suspicious_users():
    """Get users with suspicious activity"""
    conn = get_db()
    cursor = conn.cursor()
    
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    
    cursor.execute('''
        SELECT 
            e.user_id,
            u.username,
            u.role,
            COUNT(*) as event_count,
            SUM(CASE WHEN severity IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) as high_severity_count
        FROM security_events e
        JOIN users u ON e.user_id = u.user_id
        WHERE e.timestamp > ?
        GROUP BY e.user_id, u.username, u.role
        HAVING high_severity_count > 0
        ORDER BY high_severity_count DESC
        LIMIT 10
    ''', (yesterday,))
    
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(users)

@app.route('/api/events/by-type')
def get_events_by_type():
    """Get count of events by type"""
    conn = get_db()
    cursor = conn.cursor()
    
    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT event_type, COUNT(*) as count
        FROM security_events
        WHERE timestamp > ?
        GROUP BY event_type
        ORDER BY count DESC
    ''', (start_date,))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(results)

if __name__ == '__main__':
    print("🚀 Starting EMR Security Dashboard API...")
    print("📊 Dashboard will be available at http://localhost:3000")
    print("🔧 API running at http://localhost:5000")
    print("\nPress CTRL+C to stop the server")
    app.run(debug=True, port=5000)