import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle2, Sun, Moon } from 'lucide-react';

interface AuthScreenProps {
  isDark: boolean;
  onToggleDark: () => void;
  onSuccess: (userData: any, showOnboarding?: boolean) => void;
}

export function AuthScreen({ isDark, onToggleDark, onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

      if (!isLogin && !validateEmail(formData.email)) {
          setError('Please enter a valid email address.');
          return; 
      }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // The keys here match the property names in your RegisterDto.cs and LoginDto.cs
      const authData = isLogin 
        ? {
            Email: formData.email,
            Password: formData.password
          }
        : {
            Username: formData.username,
            Email: formData.email,
            Password: formData.password
          };

      // Match the port found in your Backend's launchSettings.json
      // const BASE_URL = 'http://localhost:5232'; 
      const BASE_URL = 'https://kbk-picability-backend.onrender.com';
      const endpoint = isLogin ? `${BASE_URL}/api/auth/login` : `${BASE_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      const result = await response.json();

      if (response.ok) {
        if (isLogin) {
          setSuccess('Welcome back!');
          // Passes the C# result (id, userName, email) back to App.tsx
          setTimeout(() => {
              const pendingOnboardingEmail = localStorage.getItem('picabilityPendingOnboardingEmail');
              const shouldShowOnboarding =
                  pendingOnboardingEmail &&
                  pendingOnboardingEmail.toLowerCase() === result.email?.toLowerCase();

              if (shouldShowOnboarding) {
                  localStorage.removeItem('picabilityPendingOnboardingEmail');
              }

              onSuccess(result, !!shouldShowOnboarding);
          }, 1000);
        } else {
          setSuccess('Account created! Please sign in.');
          localStorage.setItem('picabilityPendingOnboardingEmail', formData.email);
          setFormData({ username: '', email: formData.email, password: '' });

          setTimeout(() => {
            setIsLogin(true); 
            setSuccess('');   
          }, 2500);
        }
      } else {
        // Identity sometimes returns an array of error objects
        const errorMsg = Array.isArray(result) 
          ? result[0].description 
          : result.message || 'Authentication failed.';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Server connection issue. Please ensure the Backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 flex flex-col ${
      isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      
      <div className="flex items-center justify-between mb-8">
        <div className="w-12 h-12" />
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          {isLogin ? 'Welcome Back' : 'Join Us'}
        </h1>
        <button
          onClick={onToggleDark}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      <div className="max-w-md mx-auto w-full">
        <div className={`rounded-3xl p-8 shadow-xl transition-all duration-300 ${
          isDark ? 'bg-slate-800/50 backdrop-blur-md border border-slate-700' : 'bg-white'
        }`}>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className={`text-sm font-medium ml-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="username"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none transition-all ${
                      isDark ? 'bg-slate-900 text-white focus:ring-2 ring-teal-500' : 'bg-slate-50 text-slate-900 focus:ring-2 ring-teal-600'
                    }`}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-sm font-medium ml-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Email or username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="name@email.com"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none transition-all ${
                    isDark ? 'bg-slate-900 text-white focus:ring-2 ring-teal-500' : 'bg-slate-50 text-slate-900 focus:ring-2 ring-teal-600'
                  }`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ml-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 rounded-2xl outline-none transition-all ${
                    isDark ? 'bg-slate-900 text-white focus:ring-2 ring-teal-500' : 'bg-slate-50 text-slate-900 focus:ring-2 ring-teal-600'
                  }`}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-teal-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-500/10 text-rose-500 text-sm border border-rose-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 text-sm border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              } bg-gradient-to-r from-teal-600 to-cyan-700 text-white`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className={`text-sm font-medium transition-colors hover:underline ${
                isDark ? 'text-slate-400 hover:text-teal-400' : 'text-slate-500 hover:text-teal-600'
              }`}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}