import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StartPage from './pages/StartPage';
import GamePage from './pages/GamePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/start" element={<StartPage />} />
        <Route path="/game" element={<GamePage />} />
      </Route>
      <Route path="/" element={<Navigate to="/start" replace />} />
      <Route path="*" element={<Navigate to="/start" replace />} />
    </Routes>
  );
}
