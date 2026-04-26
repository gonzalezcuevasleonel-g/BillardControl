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
} from 'lucide-react';
import { useState } from 'react';
import { useApp, Sale } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  Dialog,
  DialogContent,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';

export function Dashboard() {
  const { tables, dailyEarnings, sales, products } = useApp();
  const [selectedReceipt, setSelectedReceipt] = useState<Sale | null>(null);

  const activeTables = tables.filter((t) => t.status === 'occupied').length;
  const availableTables = tables.filter((t) => t.status === 'available').length;
  const productsSoldToday = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  const recentActivity = [...sales]
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
      value: sales.length,
      icon: TrendingUp,
      color: 'orange',
      glow: 'shadow-orange-500/20',
    },
  ];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-zinc-500">
            Resumen general de operaciones - {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
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
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-green-400" />
              Estado de Mesas
            </h2>

            <div className="grid grid-cols-4 gap-3">
              {tables.map((table) => (
                <motion.div
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    aspect-square rounded-lg border-2 flex flex-col items-center justify-center
                    transition-all relative overflow-hidden
                    ${
                      table.status === 'occupied'
                        ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20'
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
                  <Circle
                    className={`w-6 h-6 mb-1 relative z-10 ${
                      table.status === 'occupied' ? 'text-green-400' : 'text-zinc-600'
                    }`}
                  />
                  <p
                    className={`text-xs font-medium relative z-10 ${
                      table.status === 'occupied' ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    {table.name}
                  </p>
                  <p
                    className={`text-[10px] relative z-10 ${
                      table.status === 'occupied' ? 'text-green-300' : 'text-zinc-600'
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
                        <p className="text-green-400 font-bold">${sale.total.toFixed(2)}</p>
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
                    <button
                      onClick={() => setSelectedReceipt(sale)}
                      className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors flex-shrink-0"
                      title="Ver recibo"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            Alertas de Inventario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Receipt Modal */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md w-full p-0 overflow-hidden">
          {selectedReceipt && (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Recibo de Venta</h2>
                    <p className="text-purple-100 text-sm">
                      {formatFullDate(selectedReceipt.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Body */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="px-6 py-5 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Tipo</span>
                  <span className="text-white font-medium">
                    {selectedReceipt.session_id ? 'Venta de Mesa' : 'Venta Directa'}
                  </span>
                </div>

                <div className="border-t border-dashed border-zinc-700" />

                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Productos</p>
                  <div className="space-y-2">
                    {selectedReceipt.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-sm tabular-nums w-5 text-right">{item.quantity}×</span>
                          <span className="text-zinc-300 text-sm">{item.name}</span>
                        </div>
                        <span className="text-white text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-700" />

                {/* Total */}
                <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-white font-bold text-lg">TOTAL</span>
                  <span className="text-3xl font-bold text-purple-400">${selectedReceipt.total.toFixed(2)}</span>
                </div>
              </motion.div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full mb-3 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  onClick={() => setSelectedReceipt(null)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

