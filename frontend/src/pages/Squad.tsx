import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../config/env';

import { drawWheel, spinWheel } from '../utils/wheel';
import { careTaker, cgi } from '../utils/wheel';

import Navbar from '../components/Navbar';

export default function Squad() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<string>('Loading...');

  useEffect(() => {
    // Make API call to /test endpoint
    fetch(`${API_URL}/test`)
      .then(response => response.json())
      .then(data => setMessage(data))
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Error fetching data from backend');
      });

      drawWheel();
      spinWheel();
  }, []);

  return (
    <div className="Mn">
      <Navbar />
      <div className="BH_DS">
      <h1 id="WGM_label_squad" >Who's Got Mom? {careTaker}, {cgi}</h1><hr className="hrstyles"></hr>
      <div id="spinner">

        <div id="wheel" className="game-section active">

                    <div className="wheel-container">
                        <div className="wheel-wrapper"> <br></br><br></br>
                            <div id="pointer"></div> <br></br><br></br>
                            <canvas id="wheelCanvas" width="500" height="500"></canvas>
                        </div>
                    </div>
                </div>


      </div>
      <p>Lots to fix here lol</p>
      <p>User id: {id}</p>
      <h2>Backend Response:</h2>
      <p>{message}</p>
      </div>
    </div>
  );
}
