import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Squad from './pages/Squad';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import './App.css';

// Component to handle catch-all redirect based on auth state
function CatchAllRedirect() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    return <Navigate to={`/dashboard/${userId}`} replace />;
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard/:userId" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/squad/:squadId" element={<Squad />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
