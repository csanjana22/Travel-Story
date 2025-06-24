import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await axios.post(`http://localhost:8000/reset-password/${token}`, { password });
      setMsg(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-cyan-50">
      <form onSubmit={handleReset} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-xl mb-4 font-semibold text-center">Reset Password</h2>
        <input
          type="password"
          placeholder="New Password"
          className="input-box mb-3"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        {msg && <p className="mt-2 text-center text-sm text-cyan-700">{msg}</p>}
      </form>
    </div>
  );
};

export default ResetPassword;
