import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// Glow size configuration
const MIN_GLOW_SIZE = 100;  // px at velocity = 0
const MAX_GLOW_SIZE = 400;  // px at max velocity
const MAX_VELOCITY = 2000;  // pixels per second (fast mouse movement)
const EXPONENTIAL_FACTOR = 3; // Controls curve steepness (higher = more aggressive curve)
const SMOOTHING_FACTOR = 0.15; // Lower = smoother but slower response

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const glowOverlay = glowRef.current;
        if (!glowOverlay) return;

        // Track previous mouse state for velocity calculation
        let prevX = 0;
        let prevY = 0;
        let prevTime = performance.now();
        let currentGlowSize = MIN_GLOW_SIZE;

        const handleMouseMove = (event: MouseEvent) => {
            const x = event.clientX;
            const y = event.clientY;
            const currentTime = performance.now();

            // Calculate distance moved
            const dx = x - prevX;
            const dy = y - prevY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calculate time difference in seconds
            const dt = (currentTime - prevTime) / 1000;

            // Calculate velocity (pixels per second)
            // Avoid division by zero on first frame
            const velocity = dt > 0 ? distance / dt : 0;

            // Normalize velocity to 0-1 range, clamped
            const normalizedVelocity = Math.min(velocity / MAX_VELOCITY, 1);

            // Apply exponential function: f(v) = 1 - e^(-k * v)
            // This gives a curve that rises quickly at low velocities and asymptotes toward 1
            const exponentialValue = 1 - Math.exp(-EXPONENTIAL_FACTOR * normalizedVelocity);

            // Calculate target glow size
            const targetGlowSize = MIN_GLOW_SIZE + (MAX_GLOW_SIZE - MIN_GLOW_SIZE) * exponentialValue;

            // Apply smoothing (lerp toward target)
            currentGlowSize = currentGlowSize + (targetGlowSize - currentGlowSize) * SMOOTHING_FACTOR;

            // Update CSS properties
            glowOverlay.style.setProperty('--glow-x', `${x}px`);
            glowOverlay.style.setProperty('--glow-y', `${y}px`);
            glowOverlay.style.setProperty('--glow-size', `${currentGlowSize}px`);
            glowOverlay.style.setProperty('--glow-opacity', '1');

            // Store current values for next frame
            prevX = x;
            prevY = y;
            prevTime = currentTime;
        };

        const handleMouseLeave = () => {
            glowOverlay.style.setProperty('--glow-opacity', '0');
        };

        // Decay glow size back to minimum when mouse stops
        let decayInterval: number;
        const startDecay = () => {
            decayInterval = window.setInterval(() => {
                if (currentGlowSize > MIN_GLOW_SIZE + 1) {
                    currentGlowSize = currentGlowSize + (MIN_GLOW_SIZE - currentGlowSize) * 0.1;
                    glowRef.current?.style.setProperty('--glow-size', `${currentGlowSize}px`);
                }
            }, 50);
        };

        startDecay();

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearInterval(decayInterval);
        };
    }, []);

    return (
        <div className="landing-body">
            {/* Mouse glow overlay */}
            <div ref={glowRef} className="glow-overlay" />
            
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