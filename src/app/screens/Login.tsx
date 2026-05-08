import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Lock, User, Circle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-500 via-purple-500 to-green-500" />

          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div 
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -10, 10, -5, 5, 0],
                  x: [0, -5, 5, -2, 2, 0],
                  y: [0, 5, -5, 2, -2, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 300,
                  damping: 10
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4 relative cursor-pointer group"
              >
                <Circle className="w-12 h-12 text-green-400 group-hover:text-green-300 transition-colors" strokeWidth={2} />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                    boxShadow: [
                      "0 0 20px rgba(34, 197, 94, 0.2)",
                      "0 0 40px rgba(34, 197, 94, 0.4)",
                      "0 0 20px rgba(34, 197, 94, 0.2)"
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full bg-green-500/20 blur-md"
                />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Billar<span className="text-green-400">Control</span>
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-green-500 focus:ring-green-500/20"
                    placeholder="Ingresa tu usuario"
                    required
                  />
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-green-500 focus:ring-green-500/20"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
              </div>


              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50"
              >
                {isLoading
                  ? 'Procesando...'
                  : 'Iniciar Sesión'}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
