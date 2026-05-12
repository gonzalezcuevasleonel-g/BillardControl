import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  User, 
  TableProperties, 
  ChevronDown, 
  ChevronUp,
  Receipt,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { TicketModal } from '../components/TicketModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function History() {
  const { sales, currentUserRoleId } = useApp();
  const isAdmin = Number(currentUserRoleId) === 1;
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);

  const filteredHistory = useMemo(() => {
    return (sales ?? [])
      .filter((sale) => {
        const matchesSearch = 
          sale.id.toString().includes(searchTerm) || 
          (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.table_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.seller_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = !dateFilter || new Date(sale.timestamp).toISOString().split('T')[0] === dateFilter;
        
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, searchTerm, dateFilter]);

  const toggleExpand = (id: number) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  const exportToCSV = () => {
    let csv = "Folio,Fecha,Cliente,Vendedor,Tipo,Total\n";
    filteredHistory.forEach(s => {
      const date = new Date(s.timestamp).toLocaleString();
      const type = s.session_id ? 'Mesa' : 'Venta Directa';
      csv += `${s.id},${date},${s.customer_name || 'N/A'},${s.seller_name},${type},${s.total}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `historial_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-blue-400" />
              Historial de Ventas
            </h1>
            <p className="text-zinc-500">
              Consulta todas las transacciones realizadas en el sistema.
            </p>
          </div>
          <Button 
            onClick={exportToCSV}
            variant="outline" 
            className="border-zinc-800 text-zinc-400 hover:text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-xl">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input 
              placeholder="Buscar por folio, cliente, vendedor o mesa..." 
              className="pl-10 bg-zinc-900 border-zinc-800 text-white w-full h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input 
              type="date"
              className="pl-10 bg-zinc-900 border-zinc-800 text-white w-full h-12"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Sales Table/List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Folio</th>
                  <th className="px-6 py-4 font-semibold">Fecha / Hora</th>
                  <th className="px-6 py-4 font-semibold">Cliente / Mesa</th>
                  <th className="px-6 py-4 font-semibold">Vendedor</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredHistory.map((sale) => (
                  <AnimatePresence key={sale.id}>
                    <tr className={`group hover:bg-zinc-800/30 transition-colors ${expandedSaleId === sale.id ? 'bg-zinc-800/50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-mono text-zinc-400">#{sale.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">
                          {new Date(sale.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-zinc-500 text-xs">
                          {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded ${sale.session_id ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {sale.session_id ? <TableProperties className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                          </span>
                          <span className="text-white text-sm font-medium">
                            {sale.customer_name || (sale.session_id ? (sale.table_name || 'Mesa') : 'Venta Directa')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <User className="w-3 h-3" />
                          {sale.seller_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-bold">${sale.total.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleExpand(sale.id)}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                          >
                            {expandedSaleId === sale.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => {
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
                                tableCost: sale.total_time_price,
                                productsCost: sale.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0),
                                totalCost: sale.total,
                                endTime: sale.timestamp,
                                usageTime: usageTime,
                                customerName: sale.customer_name || (sale.session_id ? (sale.table_name || 'Mesa') : 'Venta Directa'),
                                sellerName: sale.seller_name
                              });
                            }}
                            className="p-2 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedSaleId === sale.id && (
                      <motion.tr 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-800/20"
                      >
                        <td colSpan={6} className="px-8 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Productos del Ticket</h4>
                              <div className="space-y-2">
                                {sale.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-sm bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                      <span className="text-zinc-500 font-mono w-6">{item.quantity}x</span>
                                      <span className="text-white font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-green-400 font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                {sale.items.length === 0 && <p className="text-zinc-600 text-sm italic">Sin productos</p>}
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resumen Financiero</h4>
                              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 space-y-3">
                                {sale.session_id && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Costo de Mesa:</span>
                                    <span className="text-white">${(sale.total_time_price || 0).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-400">Total Productos:</span>
                                  <span className="text-white">${sale.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0).toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-zinc-800 my-2" />
                                <div className="flex justify-between text-lg font-bold">
                                  <span className="text-zinc-300">Total General:</span>
                                  <span className="text-green-400">${sale.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron ventas con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TicketModal 
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        data={selectedSale}
      />
    </Layout>
  );
}
