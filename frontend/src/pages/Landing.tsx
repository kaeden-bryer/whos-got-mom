import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-body">
            <div className="landing-content">
                <div className="title-container">
                    <h1 className="title-word title-word-1">Who's</h1>
                    <h1 className="title-word title-word-2">Got</h1>
                    <h1 className="title-word title-word-3">Mom?</h1>
                </div>

                <div className="logo-container">
                    <img 
                        src="/WGM_logo.png" 
                        alt="Who's Got Mom Logo" 
                        className="wgm-logo"
                    />
                </div>

                <div className="button-container">
                    <button 
                        className="landing-btn login-btn"
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </button>
                    <button 
                        className="landing-btn signup-btn"
                        onClick={() => navigate('/register')}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    )
}
export default Landing;