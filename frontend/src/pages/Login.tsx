import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/env';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - store userId and navigate to dashboard
        localStorage.setItem('userId', data.userId);
        navigate(`/dashboard/${data.userId}`);
      } else {
        // Login failed - show error message
        setError(data.message || 'Invalid username or password. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="Mn">
      <div id="WGM_logo">
        <img src="/WGM_logo.png" alt="Who's Got Mom Logo" style={{ width: '200px', marginBottom: '1rem' }} />
      </div>
      <h1 id="login-header">Sign in</h1>
      {error && (
        <p style={{ color: '#e74c3c', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
