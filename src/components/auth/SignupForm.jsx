import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from './PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function SignupForm({ onSwitch }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const { signup } = useAuth();
  const navigate   = useNavigate();

  async function handleSignup() {
    const errs = {};
    if (!name)              errs.name     = true;
    if (!email)             errs.email    = true;
    if (password.length < 6) errs.password = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    // signup() stores the token and sets session — redirect straight to app
    const ok = await signup(name, email, password);
    setLoading(false);
    if (ok) navigate('/');
  }

  const base = 'w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-sm text-[#1a1a2e] outline-none transition-all duration-200';
  const ok   = 'border-[#e0e0e0] hover:border-[#b0b8e0] focus:border-[#3b5bdb] focus:shadow-[0_0_0_3px_rgba(59,91,219,0.12)] focus:bg-[#f8faff]';
  const err  = 'border-red-400 bg-red-50';

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-bold text-[#1a1a2e]">Full Name</label>
        <input
          type="text" value={name} placeholder="Your full name"
          onChange={(e) => { setName(e.target.value); setErrors({}); }}
          className={`${base} ${errors.name ? err : ok}`}
        />
        {errors.name && <p className="text-xs text-red-500">Name is required</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-bold text-[#1a1a2e]">Email</label>
        <input
          type="email" value={email} placeholder="you@example.com"
          onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
          className={`${base} ${errors.email ? err : ok}`}
        />
        {errors.email && <p className="text-xs text-red-500">Email is required</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-bold text-[#1a1a2e]">Password</label>
        <PasswordInput
          id="signupPassword" value={password} placeholder="Min 6 characters"
          onChange={(v) => { setPassword(v); setErrors({}); }}
          hasError={errors.password}
        />
        {errors.password && <p className="text-xs text-red-500">Password must be at least 6 characters</p>}
      </div>

      {/* Submit */}
      <button
        type="button" onClick={handleSignup} disabled={loading}
        className="mt-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg py-3 text-[15px] font-extrabold tracking-wide transition-all duration-200"
      >
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>

      <p className="text-center text-[13px] text-[#6b7280]">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-red-600 font-bold hover:underline">
          Login
        </button>
      </p>
    </div>
  );
}
