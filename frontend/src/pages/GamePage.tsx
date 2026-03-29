import { getNickname } from '../services/auth';

export default function GamePage() {
  const nickname = getNickname();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          🎲 Jogo iniciado!
        </h1>
        <p className="text-gray-300 mb-2">
          O tabuleiro será renderizado em breve.
        </p>
        <p className="text-gray-400 text-sm">
          Jogador: {nickname}
        </p>
      </div>
    </div>
  );
}
