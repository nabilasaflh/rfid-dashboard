import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const username = localStorage.getItem('username');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Semua field wajib diisi.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          oldPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Gagal mengubah password.');
        return;
      }

      setMessage('Password berhasil diubah.');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        minHeight: 'calc(100vh - 120px)'
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '6px'
          }}
        >
          Change Password
        </h2>

        <p
          style={{
            color: '#6c757d',
            marginBottom: '24px'
          }}
        >
          Change your account password
        </p>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '28px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Old Password */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontWeight: '500'
                }}
              >
                Current Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="form-control"
                  style={{ paddingRight: '45px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}
                >
                  <i
                    className={showOld ? 'ti ti-eye' : 'ti ti-eye-off'}
                    style={{ fontSize: '18px' }}
                  />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontWeight: '500'
                }}
              >
                New Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-control"
                  style={{ paddingRight: '45px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}
                >
                  <i
                    className={showNew ? 'ti ti-eye' : 'ti ti-eye-off'}
                    style={{ fontSize: '18px' }}
                  />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontWeight: '500'
                }}
              >
                Confirm New Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-control"
                  style={{ paddingRight: '45px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}
                >
                  <i
                    className={showConfirm ? 'ti ti-eye' : 'ti ti-eye-off'}
                    style={{ fontSize: '18px' }}
                  />
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: '#f8d7da',
                  color: '#842029',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  background: '#d1e7dd',
                  color: '#0f5132',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}
              >
                {message}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-light"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn"
                disabled={loading}
                style={{
                  backgroundColor: '#234F9A',
                  borderColor: '#234F9A',
                  color: '#ffffff'
                }}
              >
                {loading ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}