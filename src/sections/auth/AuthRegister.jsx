import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { emailSchema, passwordSchema } from 'utils/validationSchema';

// Assets
import BackgroundImage from 'assets/images/background login.jpg';
import Logo from 'assets/images/logo indocement 1.png';
import Gradient from 'assets/images/image 4.png';

// ==============================|| AUTH REGISTER FORM ||============================== //

export default function AuthRegisterForm({ link }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  // ==============================|| REGISTER ||============================== //

  const onSubmit = async (data) => {
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message);
        return;
      }

      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
      alert('Tidak dapat terhubung ke server.');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        minHeight: '0',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* ================= BACKGROUND ================= */}

      <img
        src={BackgroundImage}
        alt="Background"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      />

      {/* Blue-white gradient */}

      <img
        src={Gradient}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1
        }}
      />

      {/* ================= REGISTER CARD ================= */}

      <div
        style={{
          position: 'absolute',
          zIndex: 2,

          top: '50%',
          right: '6%',
          transform: 'translateY(-50%)',

          width: 'min(520px, 44vw)',
          height: 'min(715px, 79vh)',

          minWidth: '520px',
          minHeight: '570px',

          background: '#ffffff',

          border: '1px solid #f3f4f6',
          borderRadius: '10px',

          boxShadow: '0px 8px 24px rgba(0,0,0,0.30)',

          boxSizing: 'border-box',

          padding: '30px 40px',

          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {/* ================= LOGO ================= */}

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          <img
            src={Logo}
            alt="Indocement"
            style={{
              width: '75px',
              height: '90px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* ================= TITLE ================= */}

        <h1
          style={{
            margin: '0',
            textAlign: 'center',
            color: '#234F9A',
            fontSize: '31px',
            fontWeight: 700,
            lineHeight: '35px'
          }}
        >
          Create Account
        </h1>

        <p
          style={{
            margin: '5px 0 22px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '16px',
            lineHeight: '24px'
          }}
        >
          Register to access the system
        </p>

        {/* ================= FORM ================= */}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username */}

          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                width: '100%',
                height: '52px',

                display: 'flex',
                alignItems: 'center',

                padding: '0 16px',

                backgroundColor: '#ffffff',

                border: '2px solid #DDDDDD',
                borderRadius: '10px',

                boxSizing: 'border-box',

                boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.08)'
              }}
            >
              <i
                className="ti ti-user"
                style={{
                  fontSize: '21px',
                  color: '#6B7280',
                  marginRight: '16px',
                  flexShrink: 0
                }}
              />

              <input
                type="text"
                placeholder="username"
                {...register('username', {
                  required: 'Username is required'
                })}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  color: '#4B5563'
                }}
              />
            </div>

            {errors.username && (
              <small
                style={{
                  display: 'block',
                  marginTop: '4px',
                  color: '#dc3545'
                }}
              >
                {errors.username.message}
              </small>
            )}
          </div>

          {/* Email */}

          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                width: '100%',
                height: '52px',

                display: 'flex',
                alignItems: 'center',

                padding: '0 16px',

                backgroundColor: '#ffffff',

                border: '2px solid #DDDDDD',
                borderRadius: '10px',

                boxSizing: 'border-box',

                boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.08)'
              }}
            >
              <i
                className="ti ti-mail"
                style={{
                  fontSize: '21px',
                  color: '#6B7280',
                  marginRight: '16px',
                  flexShrink: 0
                }}
              />

              <input
                type="email"
                placeholder="email"
                {...register('email', emailSchema)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  color: '#4B5563'
                }}
              />
            </div>

            {errors.email && (
              <small
                style={{
                  display: 'block',
                  marginTop: '4px',
                  color: '#dc3545'
                }}
              >
                {errors.email.message}
              </small>
            )}
          </div>

          {/* Password */}

          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                width: '100%',
                height: '52px',

                display: 'flex',
                alignItems: 'center',

                padding: '0 16px',

                backgroundColor: '#ffffff',

                border: '2px solid #DDDDDD',
                borderRadius: '10px',

                boxSizing: 'border-box',

                boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.08)'
              }}
            >
              <i
                className="ti ti-lock"
                style={{
                  fontSize: '21px',
                  color: '#6B7280',
                  marginRight: '16px',
                  flexShrink: 0
                }}
              />

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="password"
                {...register('password', passwordSchema)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  color: '#4B5563'
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#999999',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i
                  className={
                    showPassword ? 'ti ti-eye' : 'ti ti-eye-off'
                  }
                />
              </button>
            </div>

            {errors.password && (
              <small
                style={{
                  display: 'block',
                  marginTop: '4px',
                  color: '#dc3545'
                }}
              >
                {errors.password.message}
              </small>
            )}
          </div>

          {/* Confirm Password */}

          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                width: '100%',
                height: '52px',

                display: 'flex',
                alignItems: 'center',

                padding: '0 16px',

                backgroundColor: '#ffffff',

                border: '2px solid #DDDDDD',
                borderRadius: '10px',

                boxSizing: 'border-box',

                boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.08)'
              }}
            >
              <i
                className="ti ti-lock"
                style={{
                  fontSize: '21px',
                  color: '#6B7280',
                  marginRight: '16px',
                  flexShrink: 0
                }}
              />

              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="confirm password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match'
                })}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  color: '#4B5563'
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#999999',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i
                  className={
                    showConfirmPassword ? 'ti ti-eye' : 'ti ti-eye-off'
                  }
                />
              </button>
            </div>

            {errors.confirmPassword && (
              <small
                style={{
                  display: 'block',
                  marginTop: '4px',
                  color: '#dc3545'
                }}
              >
                {errors.confirmPassword.message}
              </small>
            )}
          </div>

          {/* ================= REGISTER BUTTON ================= */}

          <button
            type="submit"
            style={{
              width: '100%',
              height: '58px',

              border: 'none',
              borderRadius: '7px',

              backgroundColor: '#234F9A',

              color: '#ffffff',

              fontSize: '18px',
              fontWeight: 700,

              cursor: 'pointer',

              boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.08)'
            }}
          >
            Register
          </button>
        </form>

        {/* ================= LOGIN LINK ================= */}

        <div
          style={{
            textAlign: 'center',
            color: '#4B5563',
            fontSize: '14px',
            marginTop: '14px'
          }}
        >
          Already have account?{' '}
          <Link
            to={link}
            style={{
              color: '#234F9A',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

AuthRegisterForm.propTypes = {
  className: PropTypes.string,
  link: PropTypes.string
};