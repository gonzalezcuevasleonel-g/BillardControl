import { motion } from 'motion/react';
import {
  DollarSign,
  TableProperties,
  ShoppingBag,
  TrendingUp,
  Circle,
  Clock,
  Receipt,
  Printer,
  Trash2,
  Wrench,
  Users as UsersIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp, Sale } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { TicketModal } from '../components/TicketModal';
import { Button } from '../components/ui/button';

export function Dashboard() {
  const navigate = useNavigate();
  const { tables, dailyEarnings, todaySales, products, cancelSale, currentUserRoleId, fetchUsers, currentUserId } = useApp();
  const isAdmin = Number(currentUserRoleId) === 1;
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    if (isAdmin) {
      const loadStaff = async () => {
        try {
          const users = await fetchUsers();
          setStaff(users);
        } catch (err) {
          console.error('Error in staff monitor:', err);
        }
      };
      loadStaff();
      const staffTimer = setInterval(loadStaff, 10000); // Update every 10s
      return () => {
        clearInterval(timer);
        clearInterval(staffTimer);
      };
    }
    
    return () => clearInterval(timer);
  }, [isAdmin]);

  const activeTables = (tables ?? []).filter((t) => t.status === 'occupied').length;
  const availableTables = (tables ?? []).filter((t) => t.status === 'available').length;

  const productsSoldToday = (todaySales ?? []).reduce(
    (sum, sale) => sum + (sale.items ?? []).reduce((s, item) => s + item.quantity, 0),
    0
  );

  const visibleTodaySales = isAdmin ? (todaySales ?? []) : (todaySales ?? []).filter(s => s.user_id === currentUserId);

  const recentActivity = [...visibleTodaySales]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  const statsCards = [
    {
      title: 'Ganancias Hoy',
      value: `$${dailyEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'green',
      glow: 'shadow-green-500/20',
    },
    {
      title: 'Mesas Activas',
      value: activeTables,
      icon: TableProperties,
      color: 'purple',
      glow: 'shadow-purple-500/20',
    },
    {
      title: 'Productos Vendidos',
      value: productsSoldToday,
      icon: ShoppingBag,
      color: 'blue',
      glow: 'shadow-blue-500/20',
    },
    {
      title: 'Ventas Totales',
      value: todaySales.length,
      icon: TrendingUp,
      color: 'orange',
      glow: 'shadow-orange-500/20',
    },
  ];

  const visibleStatsCards = isAdmin ? statsCards : statsCards.filter(s => s.title !== 'Ganancias Hoy');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTableType = (hourlyRate: number) => {
    switch (hourlyRate) {
      case 50:
        return 'Billar';
      case 60:
        return 'Snorkel';
      case 70:
        return 'Carambola';
      default:
        return 'Mesa';
    }
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-zinc-500">
              Resumen general de operaciones - {new Date().toLocaleDateString('es-MX')}
            </p>
          </div>

          {/* Neon Clock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-green-500/30 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* Pulsing Glow */}
            <motion.div
              animate={{
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-4 bg-green-500/5 blur-2xl"
            />

            <div className="relative flex items-center gap-4">
              <div className="flex flex-col items-center">
                {/* Date above time */}
                <span className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-bold mb-1">
                  {time.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')}
                </span>

                <span className="text-3xl font-black tracking-widest text-green-400 font-mono" style={{
                  textShadow: '0 0 10px rgba(74, 222, 128, 0.5), 0 0 20px rgba(74, 222, 128, 0.3)'
                }}>
                  {time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-green-500/60 font-bold">Reloj del Sistema</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleStatsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`
                  bg-zinc-900 rounded-xl border border-zinc-800 p-6
                  shadow-xl ${stat.glow} transition-all
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm mb-2">{stat.title}</p>
                    <p className={`text-3xl font-bold text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/20`}
                  >
                    <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tables Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tables Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-green-400" />
                Estado de Mesas
              </h2>
              <button
                onClick={() => navigate('/tables')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 hover:border-green-500/50 transition-all"
              >
                <TableProperties className="w-4 h-4" />
                Ir a mesas
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {tables.map((table) => (
                <motion.div
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    aspect-square rounded-lg border-2 flex flex-col items-center justify-center
                    transition-all relative overflow-hidden
                    ${table.status === 'occupied'
                      ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20'
                      : table.status === 'maintenance'
                        ? 'bg-zinc-900 border-zinc-800 opacity-50'
                        : 'bg-zinc-800 border-zinc-700'
                    }
                  `}
                >
                  {table.status === 'occupied' && (
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 bg-green-500/20 blur-md"
                    />
                  )}
                  {table.status === 'maintenance' ? (
                    <Wrench className="w-6 h-6 mb-1 relative z-10 text-zinc-700" />
                  ) : (
                    <Circle
                      className={`w-6 h-6 mb-1 relative z-10 ${table.status === 'occupied' ? 'text-green-400' : 'text-zinc-600'
                        }`}
                    />
                  )}
                  <p
                    className={`text-xs font-medium relative z-10 ${table.status === 'occupied' ? 'text-white' : 'text-zinc-500'
                      }`}
                  >
                    {table.name}
                  </p>
                  <p
                    className={`text-[10px] relative z-10 ${table.status === 'occupied' ? 'text-green-300' : 'text-zinc-600'
                      }`}
                  >
                    {getTableType(table.hourly_rate)}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-zinc-400">Ocupadas: {activeTables}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
                <span className="text-zinc-400">Disponibles: {availableTables}</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Actividad Reciente
            </h2>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">
                  No hay actividad registrada aún
                </p>
              ) : (
                recentActivity.map((sale) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">
                            {sale.session_id ? 'Venta de Mesa' : 'Venta Directa'}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(sale.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-green-400 font-bold">{isAdmin ? `$${sale.total.toFixed(2)}` : '***'}</p>
                          <button
                            onClick={() => {
                              const tableCost = sale.total_time_price || 0;
                              const productsCost = sale.total - tableCost;

                              let usageTime = undefined;
                              if (sale.start_time && sale.end_time) {
                                const diff = Math.floor((new Date(sale.end_time).getTime() - new Date(sale.start_time).getTime()) / 1000);
                                const h = Math.floor(diff / 3600);
                                const m = Math.floor((diff % 3600) / 60);
                                const s = diff % 60;
                                usageTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                              }

                              setSelectedSale({
                                folio: sale.id,
                                items: sale.items,
                                tableCost: sale.session_id ? tableCost : undefined,
                                productsCost: productsCost,
                                totalCost: sale.total,
                                endTime: sale.timestamp,
                                usageTime: usageTime,
                                customerName: sale.customer_name || (sale.session_id ? (sale.table_name || 'Venta de Mesa') : 'Venta Directa'),
                                sellerName: sale.seller_name
                              });
                            }}
                            className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-green-400 transition-all"
                            title="Imprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de cancelar esta venta? El stock será restaurado.')) {
                                  cancelSale(sale.id);
                                }
                              }}
                              className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-red-400 transition-all"
                              title="Cancelar Venta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {sale.items.map((item, idx) => (
                          <span key={idx}>
                            {item.quantity}x {item.name}
                            {idx < sale.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Low Stock Alert & Staff Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              Alertas de Inventario
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter((p) => p.stock <= p.min_stock)
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"
                  >
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-orange-400 text-sm mt-1">
                      Stock bajo: {product.stock} unidades
                    </p>
                  </div>
                ))}
              {products.filter((p) => p.stock <= p.min_stock).length === 0 && (
                <p className="text-zinc-500 text-sm col-span-full text-center py-4">
                  Todos los productos tienen stock suficiente
                </p>
              )}
            </div>
          </motion.div>

          {/* Staff Monitor (Admin Only) */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-blue-400" />
                Personal Activo
              </h2>
              <div className="space-y-4">
                {staff.filter(u => u.is_online).length === 0 ? (
                  <p className="text-zinc-500 text-sm italic text-center py-4">No hay personal en línea</p>
                ) : (
                  staff.filter(u => u.is_online).map(u => (
                    <div key={u.id_user} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <p className="text-white text-sm font-medium">{u.username}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {u.id_rol === 1 ? 'Administrador' : 'Empleado'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        Entró {new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        data={selectedSale}
      />
    </Layout>
  );
}
