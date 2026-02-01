import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button className="brand-button" onClick={() => navigate('/squad')}>
            <img src="/WGM_icon.png" alt="Who's Got Mom Logo" className="brand-logo" />
            <span>Who's Got Mom?</span>
          </button>
        </div>
        <ul className="navbar-menu">
          <li>
            <button
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${isActive('/squad') ? 'active' : ''}`}
              onClick={() => navigate('/squad')}
            >
              Squad
            </button>
          </li>
          <li>
            <button
              className="nav-link logout"
              onClick={() => {
                // Add logout logic here
                navigate('/login');
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
