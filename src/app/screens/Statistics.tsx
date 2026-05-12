import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ShoppingBag, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';

export function Statistics() {
  const { sales, products } = useApp();
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');

  const stats = useMemo(() => {
    const now = new Date();
    const filterSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      if (view === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo;
      } else if (view === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return saleDate >= monthAgo;
      } else {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return saleDate >= yearAgo;
      }
    });

    const totalEarnings = filterSales.reduce((sum, s) => sum + s.total, 0);
    let totalProfit = 0;
    let totalCost = 0;
    const totalSalesCount = filterSales.length;
    const avgSale = totalSalesCount > 0 ? totalEarnings / totalSalesCount : 0;

    // Group by date for chart
    const groupedData: any = {};
    filterSales.forEach(sale => {
      const date = new Date(sale.timestamp);
      const key = view === 'year' 
        ? date.toLocaleString('es-MX', { month: 'short' })
        : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      
      groupedData[key] = (groupedData[key] || 0) + sale.total;

      // Profit calculation
      totalProfit += (sale.total_time_price || 0); // Mesa = 100%
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product?.cost || 0;
        totalCost += (cost * item.quantity);
        totalProfit += (item.price - cost) * item.quantity;
      });
    });

    const chartData = Object.keys(groupedData).map(key => ({
      name: key,
      total: groupedData[key]
    }));

    // Category breakdown
    const categoryData: any = {};
    filterSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product?.category || 'Otros';
        categoryData[cat] = (categoryData[cat] || 0) + (item.price * item.quantity);
      });
    });

    const pieData = Object.keys(categoryData).map(name => ({
      name,
      value: categoryData[name]
    }));

    return {
      totalEarnings,
      totalProfit,
      totalCost,
      totalSalesCount,
      avgSale,
      chartData,
      pieData,
      salesCount: filterSales.length
    };
  }, [sales, view, products]);

  const COLORS = ['#4ade80', '#60a5fa', '#fb923c', '#a78bfa', '#f472b6'];

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              Estadísticas y Reportes
            </h1>
            <p className="text-zinc-500">
              Análisis detallado de las ventas y el rendimiento del negocio.
            </p>
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {(['week', 'month', 'year'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${view === v 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
                `}
              >
                {v === 'week' ? 'Semana' : v === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-zinc-400 font-medium">Ingresos Totales</span>
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>En el periodo seleccionado</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <span className="text-zinc-400 font-medium">Inversión (Costos)</span>
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalCost.toFixed(2)}</p>
            <p className="text-zinc-500 text-sm mt-2">Costo de mercancía vendida</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl border-b-4 border-b-green-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-zinc-400 font-medium">Ganancia Real</span>
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalProfit.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-1 text-green-400 text-sm font-bold">
              <ArrowUpRight className="w-4 h-4" />
              <span>Utilidad neta</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-zinc-400 font-medium">Nº de Ventas</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalSalesCount}</p>
            <p className="text-zinc-500 text-sm mt-2">Total transacciones</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Tendencia de Ingresos
              </h3>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === stats.chartData.length - 1 ? '#a78bfa' : '#4f46e5'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              Ventas por Categoría
            </h3>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {entry.name}
                  </div>
                  <span className="text-white font-bold">${entry.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
