import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/env';
import './Register.css';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  nameFirst: string;
  nameLast: string;
  email: string;
  phoneNumber: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  nameFirst?: string;
  nameLast?: string;
  email?: string;
  phoneNumber?: string;
  general?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    nameFirst: '',
    nameLast: '',
    email: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.trim().length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!formData.nameFirst.trim()) {
      newErrors.nameFirst = 'First name is required';
    } else if (formData.nameFirst.trim().length < 2) {
      newErrors.nameFirst = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.nameLast.trim()) {
      newErrors.nameLast = 'Last name is required';
    } else if (formData.nameLast.trim().length < 2) {
      newErrors.nameLast = 'Last name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^[\d\s\-()+]+$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    } else if (formData.phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = 'Phone number must have at least 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Exclude confirmPassword from the data sent to API
      const submitData = {
        username: formData.username,
        password: formData.password,
        nameFirst: formData.nameFirst,
        nameLast: formData.nameLast,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      };
      
      const response = await fetch(`${API_URL}/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Account created successfully! Redirecting to login...');
        setFormData({ username: '', password: '', confirmPassword: '', nameFirst: '', nameLast: '', email: '', phoneNumber: '' });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          // Check if the error is about username or email
          if (data.message?.toLowerCase().includes('username')) {
            setErrors({ username: data.message });
          } else {
            setErrors({ email: data.message || 'This email is already registered' });
          }
        } else if (response.status === 400) {
          setErrors({ general: data.message || 'Invalid information provided' });
        } else {
          setErrors({ general: data.message || 'Something went wrong. Please try again.' });
        }
      }
    } catch {
      setErrors({ general: 'Unable to connect to the server. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <p className="register-subtitle">Join Who's Got Mom today</p>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errors.general && (
          <div className="error-message general-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nameFirst">First Name</label>
              <input
                type="text"
                id="nameFirst"
                name="nameFirst"
                value={formData.nameFirst}
                onChange={handleChange}
                placeholder="Enter your first name"
                className={errors.nameFirst ? 'input-error' : ''}
                disabled={isSubmitting}
              />
              {errors.nameFirst && <span className="field-error">{errors.nameFirst}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="nameLast">Last Name</label>
              <input
                type="text"
                id="nameLast"
                name="nameLast"
                value={formData.nameLast}
                onChange={handleChange}
                placeholder="Enter your last name"
                className={errors.nameLast ? 'input-error' : ''}
                disabled={isSubmitting}
              />
              {errors.nameLast && <span className="field-error">{errors.nameLast}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className={errors.username ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="username"
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className={errors.email ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="(123) 456-7890"
              className={errors.phoneNumber ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className={errors.password ? 'input-error' : ''}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'input-error' : ''}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}
