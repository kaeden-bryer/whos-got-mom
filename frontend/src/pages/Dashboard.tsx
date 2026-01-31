import { useParams } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useParams<{ user: string }>();

  return (
    <div>
      <h1>Dashboard - {user}</h1>
      <p>Welcome to your dashboard, {user}!</p>
    </div>
  );
}
