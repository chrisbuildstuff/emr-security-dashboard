import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Shield, Users, Activity, Lock, Eye, Download, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [summary, setSummary] = useState({});
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [violations, setViolations] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const [eventsByType, setEventsByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [summaryRes, eventsRes, timelineRes, violationsRes, usersRes, typesRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/summary`),
        fetch(`${API_BASE}/events?limit=100`),
        fetch(`${API_BASE}/events/timeline?days=7`),
        fetch(`${API_BASE}/violations`),
        fetch(`${API_BASE}/users/suspicious`),
        fetch(`${API_BASE}/events/by-type?days=7`)
      ]);

      setSummary(await summaryRes.json());
      setEvents(await eventsRes.json());
      setTimeline(await timelineRes.json());
      setViolations(await violationsRes.json());
      setSuspiciousUsers(await usersRes.json());
      setEventsByType(await typesRes.json());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const SEVERITY_COLORS = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    CRITICAL: '#dc2626'
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-12 h-12 opacity-20" style={{ color }} />
      </div>
    </div>
  );

  const getSeverityBadge = (severity) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[severity]}`}>
        {severity}
      </span>
    );
  };

  const filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(e => e.severity === selectedFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">EMR Security Dashboard</h1>
                <p className="text-blue-100 text-sm">Real-time Healthcare Security Monitoring</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Last Updated</p>
              <p className="font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Activity}
            title="Total Events (24h)"
            value={summary.total_events || 0}
            subtitle="Security events logged"
            color="#3b82f6"
          />
          <StatCard
            icon={AlertTriangle}
            title="Critical Events"
            value={summary.critical_events || 0}
            subtitle="Requiring immediate attention"
            color="#dc2626"
          />
          <StatCard
            icon={Lock}
            title="Failed Logins"
            value={summary.failed_logins || 0}
            subtitle="Potential unauthorized access"
            color="#f59e0b"
          />
          <StatCard
            icon={Eye}
            title="Policy Violations"
            value={summary.unresolved_violations || 0}
            subtitle="Unresolved incidents"
            color="#ef4444"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Events Timeline (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="CRITICAL" stroke="#dc2626" strokeWidth={2} />
                <Line type="monotone" dataKey="HIGH" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="MEDIUM" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="LOW" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Event Types Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Events by Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_type" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Suspicious Users & Violations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Suspicious Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Suspicious User Activity
            </h2>
            <div className="space-y-3">
              {suspiciousUsers.slice(0, 5).map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-gray-600">{user.role} • ID: {user.user_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{user.event_count} events</p>
                    <p className="text-sm font-semibold text-red-600">{user.high_severity_count} high severity</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Violations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Unresolved Violations
            </h2>
            <div className="space-y-3">
              {violations.slice(0, 5).map((violation, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-sm">{violation.violation_type.replace(/_/g, ' ')}</p>
                    {getSeverityBadge(violation.severity)}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{violation.description}</p>
                  <p className="text-xs text-gray-500">User: {violation.username} • {new Date(violation.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Events Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Download className="w-5 h-5" />
              Recent Security Events
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded text-sm ${selectedFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                All
              </button>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
                <button
                  key={severity}
                  onClick={() => setSelectedFilter(severity)}
                  className={`px-3 py-1 rounded text-sm ${selectedFilter === severity ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Event Type</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.slice(0, 20).map((event) => (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{event.event_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{getSeverityBadge(event.severity)}</td>
                    <td className="px-4 py-3">{event.user_id}</td>
                    <td className="px-4 py-3">{event.user_role}</td>
                    <td className="px-4 py-3 font-mono text-xs">{event.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        event.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>EMR Security Dashboard • Compliant with PIPEDA & PHIPA</p>
          <p className="mt-1">Monitoring healthcare data access and security events in real-time</p>
        </div>
      </div>
    </div>
  );
}

export default App;