import { useState } from 'react';

const API_BASE_URL = 'http://localhost:8080/api/v1/auth';
const GOOGLE_AUTH_URL = 'http://localhost:8080/oauth2/authorization/google';
const GITHUB_AUTH_URL = 'http://localhost:8080/oauth2/authorization/github';

export default function Auth({ onLogin, onBack, showToast }) {
  const [activeTab, setActiveTab] = useState('login');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // General Auth States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState(1); 
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');

  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPw })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Invalid credentials!', 'error');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('userName', data.name);
      showToast(`Welcome back, ${data.name.split(' ')[0]}!`, 'success');
      setTimeout(onLogin, 1000);
    } catch (error) {
      showToast('Network error.', 'error');
    } finally { setIsLoading(false); }
  };

  // 2. SIGNUP (Instant verification, forces manual login)
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPw })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Signup failed.', 'error');
        setIsLoading(false);
        return;
      }
      
      showToast('Registered successfully! Please log in.', 'success');
      
      // Auto-fill login email, clear signup form, and switch to Login tab
      setLoginEmail(signupEmail);
      setLoginPw('');
      setSignupName('');
      setSignupEmail('');
      setSignupPw('');
      setActiveTab('login');

    } catch (error) {
      showToast('Network error.', 'error');
    } finally { setIsLoading(false); }
  };

  // 3. FORGOT PASSWORD FLOW
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forgotPassword/request?email=${encodeURIComponent(forgotEmail)}`, { method: 'POST' });
      if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || 'User not found.');
      showToast('OTP sent to your email!', 'success');
      setForgotStep(2);
    } catch (error) { showToast(error.message, 'error'); } finally { setIsLoading(false); }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forgotPassword/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || 'Invalid OTP.');
      showToast('OTP Verified!', 'success');
      setForgotStep(3);
    } catch (error) { showToast(error.message, 'error'); } finally { setIsLoading(false); }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forgotPassword/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPw })
      });
      if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || 'Failed to reset password.');
      showToast('Password reset successfully! You can now login.', 'success');
      resetForgotFlow();
    } catch (error) { showToast(error.message, 'error'); } finally { setIsLoading(false); }
  };

  const resetForgotFlow = () => {
    setIsForgotOpen(false);
    setTimeout(() => {
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp('');
      setForgotNewPw('');
    }, 500);
  };

  const cardBase = "col-start-1 row-start-1 bg-white p-8 transition-all duration-700 ease-in-out";
  const activeClass = "z-30 scale-100 translate-y-0 opacity-100 pointer-events-auto visible";
  const inactiveClass = "z-10 scale-[0.92] -translate-y-6 opacity-50 pointer-events-none rounded-2xl visible";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#eef1f6]">
      <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-primary font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm">
        ← Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-[920px] items-stretch bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="hidden md:flex w-[340px] flex-shrink-0 overflow-hidden">
          <img src="/app-icon.png" alt="Icon" className="w-full h-full object-cover object-center" />
        </div>

        <div className="flex-1 w-full flex flex-col border-l border-gray-100">
          <div className="flex bg-white pt-5 px-8 relative z-40 border-b border-gray-100">
            <button onClick={() => {setActiveTab('login'); resetForgotFlow();}} className={`flex-1 pb-4 text-sm font-bold uppercase relative transition-colors ${activeTab === 'login' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}>Login</button>
            <button onClick={() => {setActiveTab('signup'); resetForgotFlow();}} className={`flex-1 pb-4 text-sm font-bold uppercase relative transition-colors ${activeTab === 'signup' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}>Signup</button>
          </div>

          <div className="grid relative perspective-1000">
            {/* LOGIN FORM */}
            <form onSubmit={handleLogin} className={`${cardBase} ${activeTab === 'login' && !isForgotOpen ? activeClass : inactiveClass}`}>
              <div className="mb-4"><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="Email Address" /></div>
              <div className="mb-4"><input type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="Password" /></div>
              <div className="flex justify-end mb-4"><button type="button" onClick={() => setIsForgotOpen(true)} className="text-xs text-primary font-medium hover:underline">Forgot password?</button></div>
              <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-[#4A74CB] text-white font-bold uppercase text-[13px] py-3.5 rounded-lg shadow-md mb-6">{isLoading ? 'Wait...' : 'Login'}</button>
              
              <div className="relative flex items-center justify-center my-6"><div className="absolute border-t border-gray-200 w-full"></div><span className="bg-white px-3 text-xs text-gray-400 uppercase font-bold relative">Or Login With</span></div>
              
              <div className="flex gap-3">
                {/* Google Button with SVG */}
                <button type="button" onClick={() => window.location.href = GOOGLE_AUTH_URL} className="flex-1 flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                    <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                  </svg>
                  Google
                </button>
                
                {/* GitHub Button with SVG */}
                <button type="button" onClick={() => window.location.href = GITHUB_AUTH_URL} className="flex-1 flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#24292e" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </form>

            {/* SIGNUP FORM */}
            <form onSubmit={handleSignup} className={`${cardBase} ${activeTab === 'signup' && !isForgotOpen ? activeClass : inactiveClass}`}>
              <div className="mb-4"><input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="Full Name" /></div>
              <div className="mb-4"><input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="Email Address" /></div>
              <div className="mb-6"><input type="password" value={signupPw} onChange={e => setSignupPw(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="Password (Min 8 chars, 1 Upper, 1 Spec, 1 Num)" /></div>
              <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-[#4A74CB] text-white font-bold uppercase text-[13px] py-3.5 rounded-lg shadow-md">{isLoading ? 'Creating...' : 'Signup'}</button>
            </form>

            {/* FORGOT PASSWORD OVERLAY */}
            <div className={`col-start-1 row-start-1 bg-white p-8 transition-all duration-500 flex flex-col justify-center ${isForgotOpen ? 'z-40 scale-100 translate-y-0 opacity-100 pointer-events-auto visible' : 'z-20 scale-[0.92] translate-y-6 opacity-0 pointer-events-none invisible'}`}>
              <button type="button" onClick={resetForgotFlow} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-medium mb-6 w-fit">← Back to Login</button>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
              
              {forgotStep === 1 && (
                <form onSubmit={handleForgotRequest} className="flex flex-col gap-4 animate-fade-in">
                  <p className="text-sm text-gray-500 mb-2">Enter your registered email to receive a reset code.</p>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="Email Address" />
                  <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-[#4A74CB] text-white font-bold uppercase text-[13px] py-3.5 rounded-lg shadow-md mt-2">{isLoading ? 'Sending...' : 'Send OTP'}</button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleForgotVerify} className="flex flex-col gap-4 animate-fade-in">
                  <p className="text-sm text-gray-500 mb-2">Enter the 6-digit code sent to <b>{forgotEmail}</b></p>
                  <input type="text" maxLength="6" value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} required className="w-full p-4 bg-[#F9F9F9] border rounded-lg text-center text-2xl font-bold tracking-[0.5em] outline-none" placeholder="000000" />
                  <button type="submit" disabled={isLoading || forgotOtp.length !== 6} className="w-full bg-primary hover:bg-[#4A74CB] text-white font-bold uppercase text-[13px] py-3.5 rounded-lg shadow-md mt-2">{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleForgotReset} className="flex flex-col gap-4 animate-fade-in">
                  <p className="text-sm text-gray-500 mb-2">Create a secure new password.</p>
                  <input type="password" value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} required className="w-full p-3 bg-[#F9F9F9] border rounded-lg text-sm" placeholder="New Password" />
                  <button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-green-600 text-white font-bold uppercase text-[13px] py-3.5 rounded-lg shadow-md mt-2">{isLoading ? 'Updating...' : 'Update Password'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}