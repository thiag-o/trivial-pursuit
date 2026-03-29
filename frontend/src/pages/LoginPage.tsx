import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isAuthenticated, setToken, setNickname } from '../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [nickname, setNicknameValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/start');
    }
  }, [navigate]);

  function validate(value: string): string | null {
    if (!value || !value.trim()) return 'O apelido não pode ser vazio.';
    if (value.length > 30) return 'O apelido deve ter no máximo 30 caracteres.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>('/auth/login', {
        nickname: nickname.trim(),
      });
      setToken(data.token);
      setNickname(nickname.trim());
      navigate('/start');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        const msg = response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : msg || 'Erro ao fazer login.');
      } else {
        setError('Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          Trivia Pursuit
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
              Apelido
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNicknameValue(e.target.value)}
              placeholder="Digite seu apelido"
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
