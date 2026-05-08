import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Trash2, 
  MoreVertical,
  Search,
  UserCheck,
  UserX,
  Lock,
  User,
  KeyRound
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import type { DbUser } from '../../utils/supabase';

export function Users() {
  const { fetchUsers, deleteUser, updateUserRole, register, currentUserId, updateUserPassword } = useApp();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Password Modal
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setIsCreating(true);
    const result = await register(newUsername, newPassword);
    setIsCreating(false);

    if (result.success) {
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !updatedPassword) return;

    setIsUpdatingPassword(true);
    await updateUserPassword(editingUser.id_user, updatedPassword);
    setIsUpdatingPassword(false);
    
    setEditingUser(null);
    setUpdatedPassword('');
  };

  const handleDeleteUser = async (id: number) => {
    if (id === currentUserId) {
      alert('No puedes eliminarte a ti mismo');
      return;
    }
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const toggleRole = async (user: DbUser) => {
    if (user.id_user === currentUserId) {
      alert('No puedes cambiar tu propio rol');
      return;
    }
    const newRole = user.id_rol === 1 ? 2 : 1;
    await updateUserRole(user.id_user, newRole);
    loadUsers();
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-green-400" />
              Gestión de Usuarios
            </h1>
            <p className="text-zinc-500">
              Administra los accesos y roles del personal del billar.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-black font-bold gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl">
            <p className="text-zinc-500 text-sm mb-1">Total Usuarios</p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          
          <div className="md:col-span-2 flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-xl">
            <Search className="w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de usuario..." 
              className="bg-transparent border-none focus:ring-0 text-white w-full py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Usuario</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                  <th className="px-6 py-4 font-semibold">Fecha Registro</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <AnimatePresence mode='popLayout'>
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id_user}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${user.id_rol === 1 ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.username}</p>
                            <p className="text-xs text-zinc-500">ID: {user.id_user}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.id_rol === 1 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {user.id_rol === 1 ? 'Administrador' : 'Empleado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Cambiar contraseña"
                          >
                            <KeyRound className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleRole(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.id_rol === 1 
                                ? 'text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10' 
                                : 'text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10'
                            }`}
                            title={user.id_rol === 1 ? "Cambiar a Empleado" : "Cambiar a Administrador"}
                          >
                            {user.id_rol === 1 ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id_user)}
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <UserPlus className="text-green-400" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Registra un nuevo miembro del personal. Por defecto se creará como Empleado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Nombre de Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                  placeholder="ej: juan_perez"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 bg-transparent border-zinc-800 text-white hover:bg-zinc-900"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                {isCreating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Password Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <KeyRound className="text-yellow-500" />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Estás actualizando la contraseña de <b>{editingUser?.username}</b>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input 
                  type="password"
                  value={updatedPassword}
                  onChange={(e) => setUpdatedPassword(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-transparent border-zinc-800 text-white hover:bg-zinc-900"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdatingPassword}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {isUpdatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
