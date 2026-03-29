import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getNickname } from '../services/auth';

export default function StartPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nickname = getNickname();

  async function handleStart() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/game/start');
      navigate('/game', { state: res.data });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        const msg = response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : msg || 'Erro ao iniciar o jogo.');
      } else {
        setError('Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo, {nickname}!
        </h1>
        <p className="text-gray-400 mb-8">
          Pronto para uma partida de Trivia Pursuit?
        </p>
        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Iniciando...' : 'Iniciar Jogo'}
        </button>
      </div>
    </div>
  );
}
