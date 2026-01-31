import { useParams } from 'react-router-dom';

export default function Squad() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>Who's Got Mom?</h1>
      <p>Lots to fix here lol</p>
      <p>User id: {id}</p>
    </div>
  );
}
