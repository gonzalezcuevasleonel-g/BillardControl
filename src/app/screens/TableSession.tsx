import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Clock,
  Plus,
  Minus,
  DollarSign,
  Receipt,
  ArrowLeft,
  CheckCircle,
  Printer,
  Trash2,
  User,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { TicketModal } from '../components/TicketModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../components/ui/alert-dialog';

export function TableSession() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { tables, products, addProductToTable, removeProductFromTable, endTableSession, currentUser } = useApp();
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [showEndSessionAlert, setShowEndSessionAlert] = useState(false);

  // Receipt state — stores a snapshot of the session when "Finalizar" is pressed
  const [receipt, setReceipt] = useState<{
    tableName: string;
    hourlyRate: number;
    elapsedSeconds: number;
    products: { name: string; price: number; quantity: number }[];
    tableCost: number;
    productsCost: number;
    totalCost: number;
    endTime: Date;
    customerName: string;
    usageTime: string;
    sellerName?: string;
  } | null>(null);

  const table = tables.find((t) => t.id === Number(tableId));

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show receipt modal if we have a snapshot (session already ended)
  if (receipt) {
    return (
      <Layout>
        <TicketModal
          isOpen={true}
          onClose={() => navigate('/tables')}
          data={{
            folio: table?.sessionId || 'S/N',
            customerName: receipt.customerName,
            items: receipt.products,
            tableCost: receipt.tableCost,
            productsCost: receipt.productsCost,
            totalCost: receipt.totalCost,
            endTime: receipt.endTime,
            usageTime: receipt.usageTime,
            sellerName: receipt.sellerName
          }}
        />
      </Layout>
    );
  }

  if (!table || table.status !== 'occupied') {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-zinc-400">Mesa no encontrada o no está activa</p>
          <Button onClick={() => navigate('/tables')} className="mt-4">
            Volver a Mesas
          </Button>
        </div>
      </Layout>
    );
  }

  const timeInHours = table.elapsedSeconds / 3600;
  const tableCost = timeInHours * table.hourly_rate;
  const productsCost = table.products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalCost = tableCost + productsCost;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (selectedProduct && quantity > 0) {
      await addProductToTable(table.id, selectedProduct, quantity);
      setShowProductModal(false);
      setQuantity(1);
      setSelectedProduct(null);
    }
  };

  const handleEndSession = () => {
    const timeInHours = table.elapsedSeconds / 3600;
    const tCost = timeInHours * table.hourly_rate;
    const pCost = table.products.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 1. Snapshot the data into local state
    setReceipt({
      tableName: table.name,
      hourlyRate: table.hourly_rate,
      elapsedSeconds: table.elapsedSeconds,
      products: [...table.products],
      tableCost: tCost,
      productsCost: pCost,
      totalCost: tCost + pCost,
      endTime: new Date(),
      customerName: table.customerName || "Cliente",
      usageTime: formatTime(table.elapsedSeconds),
      sellerName: currentUser || 'Sistema',
    });

    // 2. End the session
    endTableSession(table.id);
  };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowProductModal(true);
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/tables')}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{table.name}</h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold">
                  <User className="w-4 h-4" />
                  {table.customerName || "Cliente"}
                </div>
              </div>
              <p className="text-zinc-500 mt-1">Sesión activa · ${table.hourly_rate}/hr</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timer Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border-2 border-green-500/50 p-6 shadow-xl shadow-green-500/20 relative overflow-hidden"
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-green-500/10 blur-2xl"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-zinc-400">Tiempo transcurrido</span>
                </div>
                <p className="text-5xl font-mono font-bold text-green-400 mb-4">
                  {formatTime(table.elapsedSeconds)}
                </p>
                <div className="p-3 bg-black/30 rounded-lg border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Costo por tiempo</span>
                    <span className="text-lg font-bold text-green-400">
                      ${tableCost.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">${table.hourly_rate}/hora</p>
                </div>
              </div>
            </motion.div>

            {/* Total Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-zinc-400">Resumen de Costos</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tiempo de mesa</span>
                  <span className="text-white">${tableCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Productos</span>
                  <span className="text-white">${productsCost.toFixed(2)}</span>
                </div>
                <div className="h-px bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold text-purple-400">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* End Session Button */}
            <Button
              onClick={() => setShowEndSessionAlert(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Finalizar Sesión
            </Button>
          </div>

          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Products */}
            {table.products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  Productos Consumidos
                </h2>
                <div className="space-y-3">
                  {table.products.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700"
                    >
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-sm text-zinc-400">
                          ${item.price} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-green-400">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeProductFromTable(table.id, item.productId)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Add Products Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-white whitespace-nowrap">Agregar Productos</h2>
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openProductModal(product)}
                    disabled={product.stock === 0}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${product.stock === 0
                        ? 'bg-zinc-800 border-zinc-700 opacity-50 cursor-not-allowed'
                        : 'bg-zinc-800 border-zinc-700 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Plus className="w-5 h-5 text-green-400" />
                      {product.stock < 10 && product.stock > 0 && (
                        <span className="text-xs text-orange-400">Bajo</span>
                      )}
                    </div>
                    <p className="text-white font-medium mb-1">{product.name}</p>
                    <p className="text-green-400 font-bold">${product.price}</p>
                    <p className="text-xs text-zinc-500 mt-1">Stock: {product.stock}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Agregar {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400">Precio unitario</span>
                <span className="text-xl font-bold text-green-400">
                  ${selectedProduct?.price}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Stock disponible</span>
                <span className="text-white">{selectedProduct?.stock} unidades</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Cantidad</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border-zinc-700"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 text-center">
                  <p className="text-3xl font-bold text-white">{quantity}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedProduct?.stock || 1, quantity + 1)
                    )
                  }
                  className="border-zinc-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total a agregar</span>
                <span className="text-2xl font-bold text-purple-400">
                  ${((selectedProduct?.price || 0) * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowProductModal(false)}
                className="flex-1 border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddProduct}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold"
              >
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert */}
      <AlertDialog open={showEndSessionAlert} onOpenChange={setShowEndSessionAlert}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Estás seguro de finalizar la sesión?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta acción cerrará la cuenta de la mesa **{table.name}**. Una vez finalizada, ya no hay vuelta atrás y se generará el ticket de venta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndSession}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Sí, Cobrar y Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

