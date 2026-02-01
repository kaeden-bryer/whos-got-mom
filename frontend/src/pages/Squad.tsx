import { useEffect, useState } from 'react';
import { API_URL } from '../config/env';

import { drawWheel, spinWheel, careTaker, setOnSpinComplete } from '../utils/wheel';

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

export default function Squad() {
  const [currentCareTaker, setCurrentCareTaker] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);

  // Fetch users and draw wheel when component mounts
  useEffect(() => {
    // Set up callback for when spin completes
    setOnSpinComplete(() => {
      setCurrentCareTaker(careTaker);
      setIsSpinning(false);
    });

    fetch(`${API_URL}/users`)
      .then(response => response.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          // Extract nameFirst and nameLast, combine into full names
          const fullNames = data.data.map((user: User) => 
            `${user.nameFirst} ${user.nameLast}`
          );
          
          // Draw the wheel with the fetched names
          drawWheel(fullNames);
          setCurrentCareTaker(careTaker);
        }
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }, []);

  const handleSpin = () => {
    setIsSpinning(true);
    setCurrentCareTaker("Spinning...");
    spinWheel();
  };

  return (
    <div className="Mn">
      <Navbar />
      <div className="page-content">
        <div className="BH_DS">
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
        </div>
      </div>
    </div>
  );
}
