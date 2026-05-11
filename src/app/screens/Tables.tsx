import { useState } from 'react';
import { motion } from 'motion/react';
import { Circle, Play, Square, Clock, Plus, DollarSign, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';
import { Pencil, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

const TABLE_TYPES = [
  { label: "Billar", rate: 50 },
  { label: "Snorkel", rate: 60 },
  { label: "Carambola", rate: 70 },
];

function getTypeByRate(rate: number) {
  return TABLE_TYPES.find((t) => t.rate === rate)?.label || "Mesa";
}

export function Tables() {
  const { tables, startTableSession, currentUserRoleId, updateTableStatus } = useApp();
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");

  const handleStartSessionClick = (tableId: number) => {
    setSelectedTableId(tableId);
    setCustomerName("");
    setIsModalOpen(true);
  };

  const confirmStartSession = () => {
    if (selectedTableId !== null) {
      startTableSession(selectedTableId, customerName || "Cliente");
      setIsModalOpen(false);
      setSelectedTableId(null);
      setCustomerName("");
    }
  };

  const handleManageSession = (tableId: number) => {
    navigate(`/tables/${tableId}`);
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Mesas</h1>
          <p className="text-zinc-500">Administra las sesiones de billar</p>
          {Number(currentUserRoleId) === 1 && (
            <div className="flex">
              <Button
                onClick={() => navigate('/tables/edit')}
                className="ml-auto bg-green-500 hover:bg-green-600 text-black font-semibold shadow-lg shadow-green-500/30"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar Mesas
              </Button>
            </div>
          )}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`
                rounded-xl border-2 p-6 shadow-xl transition-all relative overflow-hidden
                ${table.status === 'occupied'
                  ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/50 shadow-green-500/20'
                  : table.status === 'maintenance'
                    ? 'bg-zinc-800/50 border-zinc-700 opacity-75 grayscale'
                    : 'bg-zinc-900 border-zinc-800'
                }
              `}
            >
              {/* Glowing background effect for occupied tables */}
              {table.status === 'occupied' && (
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-green-500/10 blur-2xl"
                />
              )}

              {/* Content */}
              <div className="relative z-10">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      p-3 rounded-lg
                      ${table.status === 'occupied'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : table.status === 'maintenance'
                        ? 'bg-zinc-900 border border-zinc-800'
                        : 'bg-zinc-800 border border-zinc-700'
                      }
                    `}
                    >
                      {table.status === 'maintenance' ? (
                        <Wrench className="w-6 h-6 text-zinc-600" />
                      ) : (
                        <Circle
                          className={`w-6 h-6 ${table.status === 'occupied' ? 'text-green-400' : 'text-zinc-500'}`}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{table.name}</h3>
                      <div className="flex gap-1 items-center">
                        <p
                          className={`text-sm font-medium ${
                            table.status === 'occupied' 
                              ? 'text-green-400' 
                              : table.status === 'maintenance'
                              ? 'text-zinc-500'
                              : 'text-zinc-500'
                          }`}
                        >
                          {table.status === 'occupied' 
                            ? 'Ocupada' 
                            : table.status === 'maintenance' 
                            ? 'Fuera de servicio' 
                            : 'Disponible'}
                        </p>
                        <span className="px-2 py-0.5 bg-zinc-700 text-xs rounded-full text-zinc-400">
                          {getTypeByRate(table.hourly_rate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Info for available tables */}
                {(table.status === 'available' || table.status === 'maintenance') && (
                  <div className="mb-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-zinc-400">Precio por hora</span>
                    </div>
                    <p className="text-xl font-bold text-white">${table.hourly_rate}</p>
                  </div>
                )}

                {/* Timer for occupied tables */}
                {table.status === 'occupied' && (
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cliente</span>
                      </div>
                      <p className="text-white font-semibold truncate">{table.customerName || "Cliente"}</p>
                    </div>

                    <div className="p-3 bg-black/30 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tiempo transcurrido</span>
                      </div>
                      <p className="text-xl font-mono font-bold text-green-400">
                        {formatTime(table.elapsedSeconds)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Products consumed */}
                {table.status === 'occupied' && table.products.length > 0 && (
                  <div className="mb-4 p-3 bg-black/30 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-2">Productos consumidos:</p>
                    <div className="space-y-1">
                      {table.products.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-green-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {table.status === 'available' ? (
                    <Button
                      onClick={() => handleStartSessionClick(table.id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold shadow-lg shadow-green-500/30"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                  ) : table.status === 'occupied' ? (
                    <Button
                      onClick={() => handleManageSession(table.id)}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Gestionar Sesión
                    </Button>
                  ) : (
                    <div className="py-2.5 text-center bg-zinc-800/50 rounded-lg border border-zinc-700 text-zinc-500 text-sm font-medium">
                      Mesa no disponible
                    </div>
                  )}

                  {Number(currentUserRoleId) === 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => updateTableStatus(table.id, table.status === 'maintenance' ? 'available' : 'maintenance')}
                      disabled={table.status === 'occupied'}
                      className="w-full text-zinc-500 hover:text-white hover:bg-zinc-800 text-xs h-8"
                    >
                      <Wrench className="w-3 h-3 mr-2" />
                      {table.status === 'maintenance' ? 'Habilitar Mesa' : 'Inhabilitar Mesa'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Play className="text-green-500" />
              Iniciar Sesión
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Ingresa el nombre del cliente responsable de la mesa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Nombre del Cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                  placeholder="ej: Juan Pérez"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-transparent border-zinc-800 text-white hover:bg-zinc-900"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmStartSession}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                Iniciar Mesa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
