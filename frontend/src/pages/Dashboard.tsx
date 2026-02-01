import { useParams, useNavigate } from 'react-router-dom';
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

interface Squad {
  id: string;
  name: string;
  nameMom: string;
}

export default function Dashboard() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Squads state
  const [squads, setSquads] = useState<Squad[]>([]);
  const [squadsLoading, setSquadsLoading] = useState(true);
  const [squadsError, setSquadsError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [momName, setMomName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch user data
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

  // Fetch squads
  const fetchSquads = () => {
    setSquadsLoading(true);
    fetch(`${API_URL}/squads`)
      .then(response => response.json())
      .then(data => {
        if (data.data) {
          setSquads(data.data);
        } else {
          setSquadsError(data.message || 'No squads found');
        }
        setSquadsLoading(false);
      })
      .catch(() => {
        setSquadsError('Failed to fetch squads');
        setSquadsLoading(false);
      });
  };

  useEffect(() => {
    fetchSquads();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/squads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: squadName,
          nameMom: momName,
          user_id: userId,  // Include user_id so they become admin
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh squads list and close modal
        fetchSquads();
        setShowModal(false);
        setSquadName('');
        setMomName('');
      } else {
        alert(data.message || 'Failed to create squad');
      }
    } catch {
      alert('Failed to create squad');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to squad page
  const handleSquadClick = (squadId: string) => {
    navigate(`/squad/${squadId}`);
  };

  // Handle overlay click (close modal when clicking outside content)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
      setSquadName('');
      setMomName('');
    }
  };

  return (
    <div className="Mn">
      <Navbar />
      <div className="page-content">
        {loading && <h1>Loading...</h1>}
        {error && <h1 style={{ color: '#e74c3c' }}>{error}</h1>}
        {user && <h1>Hello, {user.nameFirst} {user.nameLast}!</h1>}

        <h2 className="section-title">Your Squads</h2>
        
        <div className="squads-grid">
          {/* Create Squad Button */}
          <div className="create-squad-card" onClick={() => setShowModal(true)}>
            <span className="plus-icon">+</span>
            <span className="create-text">Create Squad</span>
          </div>

          {/* Existing Squads */}
          {squadsLoading && <p>Loading squads...</p>}
          {squadsError && <p style={{ color: '#e74c3c' }}>{squadsError}</p>}
          {squads.map(squad => (
            <div 
              key={squad.id} 
              className="squad-card clickable" 
              onClick={() => handleSquadClick(squad.id)}
            >
              <h3 className="squad-name">{squad.name}</h3>
              <p className="squad-mom">Mom: {squad.nameMom}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <h2>Create New Squad</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="squadName">Squad Name</label>
                <input
                  type="text"
                  id="squadName"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  required
                  placeholder="Enter squad name"
                />
              </div>
              <div>
                <label htmlFor="momName">Mom Name</label>
                <input
                  type="text"
                  id="momName"
                  value={momName}
                  onChange={(e) => setMomName(e.target.value)}
                  required
                  placeholder="Enter mom's name"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Submit'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setSquadName('');
                    setMomName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
