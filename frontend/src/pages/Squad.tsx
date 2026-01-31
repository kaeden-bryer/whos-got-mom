import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Squad() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<string>('Loading...');

  useEffect(() => {
    // Make API call to /test endpoint
    fetch('http://localhost:8000/test')
      .then(response => response.json())
      .then(data => setMessage(data))
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Error fetching data from backend');
      });
  }, []);

  return (
    <div>
      <h1>Who's Got Mom?</h1>
      <p>Lots to fix here lol</p>
      <p>User id: {id}</p>
      <h2>Backend Response:</h2>
      <p>{message}</p>
    </div>
  );
}
