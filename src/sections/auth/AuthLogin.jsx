import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { passwordSchema } from 'utils/validationSchema';

// Assets
import BackgroundImage from 'assets/images/background login.jpg';
import Logo from 'assets/images/logo indocement 1.png';
import Gradient from 'assets/images/image 4.png';

// ==============================|| AUTH LOGIN FORM ||============================== //

export default function AuthLoginForm({ link }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // ==============================|| LOGIN ||============================== //

  const onSubmit = async (data) => {
    try {
      setLoginError('');

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginError(result.message || 'Username/email atau password salah');
        return;
      }

      // Simpan data user untuk ditampilkan di profile dashboard
      localStorage.setItem('username', result.user.username);
      localStorage.setItem('email', result.user.email);

      // Login berhasil → dashboard
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Akun tidak ditemukan.');
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
          zIndex: 0
        }}
      />

      {/* ================= LOGIN CARD ================= */}

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
          minHeight: '560px',

          background: '#ffffff',
          border: '1px solid #f3f4f6',
          borderRadius: '10px',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.30)',

          boxSizing: 'border-box',
          padding: '35px 40px',

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
            marginBottom: '14px'
          }}
        >
          <img
            src={Logo}
            alt="Indocement"
            style={{
              width: '90px',
              height: '110px',
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
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: '38px'
          }}
        >
          RFID Database
        </h1>

        <p
          style={{
            margin: '5px 0 28px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '16px',
            lineHeight: '24px'
          }}
        >
          Log in to access the system
        </p>

        {/* ================= FORM ================= */}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username / Email */}

          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                width: '100%',
                height: '58px',

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
                  fontSize: '22px',
                  color: '#6B7280',
                  marginRight: '16px',
                  flexShrink: 0
                }}
              />

              <input
                type="text"
                placeholder="username or email"
                {...register('identifier', {
                  required: 'Username or email is required'
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

            {errors.identifier && (
              <small
                style={{
                  display: 'block',
                  marginTop: '5px',
                  color: '#dc3545'
                }}
              >
                {errors.identifier.message}
              </small>
            )}
          </div>

          {/* Password */}

          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                width: '100%',
                height: '58px',

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
                  fontSize: '22px',
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
                  marginTop: '5px',
                  color: '#dc3545'
                }}
              >
                {errors.password.message}
              </small>
            )}
          </div>

          {/* Login Error */}

          {loginError && (
            <div
              style={{
                color: '#dc3545',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '16px'
              }}
            >
              {loginError}
            </div>
          )}

          {/* ================= LOGIN BUTTON ================= */}

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
            Login
          </button>
        </form>

        {/* ================= DIVIDER ================= */}

        <div
          style={{
            width: '100%',

            display: 'flex',
            alignItems: 'center',

            gap: '24px',

            marginTop: '24px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#B9BBC0'
            }}
          />

          <span
            style={{
              color: '#6B7280',
              fontSize: '14px'
            }}
          >
            or
          </span>

          <div
            style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#B9BBC0'
            }}
          />
        </div>

        {/* ================= REGISTER ================= */}

        <div
          style={{
            textAlign: 'center',

            color: '#4B5563',

            fontSize: '14px'
          }}
        >
          Don't have account yet?{' '}

          <Link
            to={link}
            style={{
              color: '#234F9A',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

AuthLoginForm.propTypes = {
  className: PropTypes.string,
  link: PropTypes.string
};