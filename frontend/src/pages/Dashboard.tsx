import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../config/env';

interface User {
  id: string;
  nameFirst: string;
  nameLast: string;
  email: string;
  phoneNumber: string;
  hours: number;
  sessions: number;
}

export default function Dashboard() {
  const { user } = useParams<{ user: string }>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Fetch all users from the backend
    fetch(`${API_URL}/users`)
      .then(response => {
        // Check if response is ok (status 200-299)
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        setUsers(data.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setError(error.message || 'Failed to fetch users');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Dashboard - {user}</h1>
      <p>Welcome to your dashboard, {user}!</p>
      
      <h2>All Users</h2>
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && users.length === 0 && <p>No users found</p>}
      {!loading && !error && users.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>First Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Last Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Phone Number</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Hours</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{u.nameFirst}</td>
                <td style={{ padding: '10px' }}>{u.nameLast}</td>
                <td style={{ padding: '10px' }}>{u.email}</td>
                <td style={{ padding: '10px' }}>{u.phoneNumber}</td>
                <td style={{ padding: '10px' }}>{u.id}</td>
                <td style={{ padding: '10px' }}>{u.hours}</td>
                <td style={{ padding: '10px' }}>{u.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
