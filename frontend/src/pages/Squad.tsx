import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config/env';

import { drawWheel, spinWheel, careTaker, cgi, setOnSpinComplete, wheelColors } from '../utils/wheel';

import Navbar from '../components/Navbar';

interface SquadMember {
  id: string;
  user_id: string;
  squad_id: string;
  primary: boolean;
  joined_at: string;
  user: {
    id: string;
    nameFirst: string;
    nameLast: string;
  };
}

interface SearchUser {
  id: string;
  nameFirst: string;
  nameLast: string;
}

export default function Squad() {
  const { squadId } = useParams<{ squadId: string }>();
  const [currentCareTaker, setCurrentCareTaker] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Squad members state
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Default theme color constant
  const DEFAULT_THEME_COLOR = '#fe696e';

  // Helper to update theme color
  const setThemeColor = (color: string) => {
    document.documentElement.style.setProperty('--themecolor', color);
  };

  // Reset theme color when leaving the page
  useEffect(() => {
    return () => {
      setThemeColor(DEFAULT_THEME_COLOR);
    };
  }, []);
  
  // Add People modal state
  const [showAddPeopleModal, setShowAddPeopleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  // Fetch squad members
  const fetchMembers = useCallback(() => {
    if (!squadId) return;
    
    setMembersLoading(true);
    fetch(`${API_URL}/squad-memberships/${squadId}/members`)
      .then(response => response.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setMembers(data.data);
        }
        setMembersLoading(false);
      })
      .catch(error => {
        console.error('Error fetching squad members:', error);
        setMembersLoading(false);
      });
  }, [squadId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Draw wheel when we have 2+ members
  useEffect(() => {
    if (members.length >= 2) {
      // Set up callback for when spin completes
      setOnSpinComplete(() => {
        setCurrentCareTaker(careTaker);
        setIsSpinning(false);
        // Update theme color to match the winner's wheel segment
        const winnerColor = wheelColors[cgi % wheelColors.length];
        setThemeColor(winnerColor);
      });

      // Extract full names from members
      const fullNames = members.map(member => 
        `${member.user.nameFirst} ${member.user.nameLast}`
      );
      
      // Draw the wheel with the member names
      drawWheel(fullNames);
      setCurrentCareTaker(careTaker);
    }
  }, [members]);

  const handleSpin = () => {
    setIsSpinning(true);
    setCurrentCareTaker("Spinning...");
    spinWheel();
  };

  // Search users as they type
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(() => {
      setSearching(true);
      fetch(`${API_URL}/users/search?q=${encodeURIComponent(searchQuery)}`)
        .then(response => response.json())
        .then(data => {
          if (data.data && Array.isArray(data.data)) {
            // Filter out users already in the squad
            const memberUserIds = members.map(m => m.user_id);
            const filteredResults = data.data.filter(
              (user: SearchUser) => !memberUserIds.includes(user.id)
            );
            setSearchResults(filteredResults);
          }
          setSearching(false);
        })
        .catch(() => {
          setSearching(false);
        });
    }, 300); // Debounce search

    return () => clearTimeout(delaySearch);
  }, [searchQuery, members]);

  // Add user to squad
  const handleAddUser = async (user: SearchUser) => {
    if (!squadId) return;
    
    setAdding(true);
    try {
      const response = await fetch(`${API_URL}/squad-memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          squad_id: squadId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh members list
        fetchMembers();
        setSearchQuery('');
        setSearchResults([]);
        // Don't close modal so they can add more people
      } else {
        alert(data.message || 'Failed to add user');
      }
    } catch {
      alert('Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  // Handle Enter key in search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleAddUser(searchResults[0]);
    }
  };

  // Handle overlay click (close modal when clicking outside content)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowAddPeopleModal(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const hasEnoughMembers = members.length >= 2;

  return (
    <div className="Mn">
      <Navbar />
      <div className="page-content">
        <div className="BH_DS">
          {membersLoading ? (
            <h1>Loading...</h1>
          ) : hasEnoughMembers ? (
            <>
              <h1 id="WGM_label_squad">Who's Got Mom? {currentCareTaker || "Loading..."}</h1>
              <hr className="hrstyles" />
              <div id="spinner">
                <div id="wheel" className="game-section active">
                  <div className="wheel-container">
                    <div className="wheel-wrapper">
                      <div id="pointer"></div>
                      <div id="wheelSpinner">
                        <canvas id="wheelCanvas" width="500" height="500"></canvas>
                        <button 
                          id="spinButton"
                          onClick={handleSpin} 
                          disabled={isSpinning}
                        >
                          {isSpinning ? '...' : 'SPIN'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add People Button (below wheel) */}
              <div className="add-people-container">
                <button 
                  className="add-people-btn"
                  onClick={() => setShowAddPeopleModal(true)}
                >
                  + Add People
                </button>
              </div>
            </>
          ) : (
            <div className="empty-squad">
              <h1>No one here yet</h1>
              <p>Add people to this squad!</p>
              <button 
                className="add-people-btn-large"
                onClick={() => setShowAddPeopleModal(true)}
              >
                <span className="plus-icon-large">+</span>
                <span>Add People</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add People Modal */}
      {showAddPeopleModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <h2>Add People to Squad</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by first name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              {searching && <p className="searching-text">Searching...</p>}
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map(user => (
                    <div 
                      key={user.id} 
                      className="search-result-item"
                      onClick={() => handleAddUser(user)}
                    >
                      <span>{user.nameFirst} {user.nameLast}</span>
                      {adding ? (
                        <span className="adding-text">Adding...</span>
                      ) : (
                        <span className="add-icon">+</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && !searching && searchResults.length === 0 && (
                <p className="no-results">No users found</p>
              )}
            </div>
            
            {/* Current Members */}
            <div className="current-members">
              <h3>Current Members ({members.length})</h3>
              <ul>
                {members.map(member => (
                  <li key={member.id}>
                    {member.user.nameFirst} {member.user.nameLast}
                    {member.primary && <span className="admin-badge">Admin</span>}
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowAddPeopleModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
