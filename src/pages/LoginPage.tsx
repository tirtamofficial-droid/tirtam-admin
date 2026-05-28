import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = signIn(username, password);
    if (res.error) setError(res.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-5">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-[20px] font-semibold text-zinc-900">Tirtam OS</h1>
          <p className="text-[14px] text-zinc-400 mt-1">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-[15px] bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-300"
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-[15px] bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-300"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 text-white text-[15px] font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            Sign In <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-[11px] text-zinc-300 text-center mt-8">Tirtam OS v1.0</p>
      </div>
    </div>
  );
}
