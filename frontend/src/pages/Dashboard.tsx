import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../config/env';
import Navbar from '../components/Navbar';

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
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_URL}/users/${userId}`)
      .then(response => response.json())
      .then(data => {
        if (data.data) {
          setUser(data.data);
        } else {
          setError(data.message || 'User not found');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch user data');
        setLoading(false);
      });
  }, [userId]);

  return (
    <div className="Mn">
      <Navbar />
      <div className="page-content">
        {loading && <h1>Loading...</h1>}
        {error && <h1 style={{ color: '#e74c3c' }}>{error}</h1>}
        {user && <h1>Hello, {user.nameFirst} {user.nameLast}!</h1>}
      </div>
    </div>
  );
}
