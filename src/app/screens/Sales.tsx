import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ShoppingCart, Trash2, DollarSign, Search, Clock, Printer } from 'lucide-react';
import { useApp, Product, CartItem } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { TicketModal } from '../components/TicketModal';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';

export function Sales() {
  const { products, sales, createPOSSale, cancelSale, currentUserRoleId } = useApp();
  const isAdmin = Number(currentUserRoleId) === 1;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error('Producto sin stock');
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > product.stock) {
              toast.error('No hay suficiente stock');
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    await createPOSSale(cart, customerName);
    setCart([]);
    setCustomerName('');
    toast.success('Venta registrada exitosamente');
  };

  const categories = [
    { id: 'beer', name: 'Cervezas', color: 'green' },
    { id: 'drink', name: 'Bebidas', color: 'blue' },
    { id: 'snack', name: 'Snacks', color: 'orange' },
  ];

  const filteredSales = (sales ?? [])
    .filter((sale) => sale.id.toString().includes(saleSearch))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Punto de Venta</h1>
              <p className="text-zinc-500">Registra ventas directas de productos</p>
            </div>

            {categories.map((category, catIndex) => {
              const categoryProducts = products.filter(
                (p) => p.category === category.id
              );
              if (categoryProducts.length === 0) return null;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.1 }}
                  className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl"
                >
                  <h2 className="text-xl font-bold text-white mb-4">{category.name}</h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryProducts.map((product, idx) => (
                      <motion.button
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: catIndex * 0.1 + idx * 0.05 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`
                          p-4 rounded-lg border-2 transition-all
                          ${
                            product.stock === 0
                              ? 'bg-zinc-800 border-zinc-700 opacity-50 cursor-not-allowed'
                              : `bg-zinc-800 border-zinc-700 hover:border-${category.color}-500/50 hover:shadow-lg hover:shadow-${category.color}-500/20`
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Plus
                            className={`w-5 h-5 text-${category.color}-400`}
                          />
                          {product.stock < 10 && product.stock > 0 && (
                            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                              Bajo
                            </span>
                          )}
                          {product.stock === 0 && (
                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                              Agotado
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium mb-1 text-left">
                          {product.name}
                        </p>
                        <p
                          className={`text-${category.color}-400 font-bold text-left`}
                        >
                          ${product.price}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 text-left">
                          Stock: {product.stock}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sidebar Section (Cart + History) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cart Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl lg:sticky top-6 z-20"
            >
              <div className="flex items-center gap-2 mb-6">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Carrito</h2>
                {cart.length > 0 && (
                  <span className="ml-auto bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-sm font-semibold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">El carrito está vacío</p>
                  <p className="text-xs text-zinc-600 mt-2">
                    Selecciona productos para agregar
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.div
                          key={item.productId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-white font-medium">{item.name}</p>
                              <p className="text-sm text-zinc-400">
                                ${item.price} c/u
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.productId, -1)}
                                className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-white font-bold min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, 1)}
                                className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-green-400 font-bold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Total */}
                  <div className="border-t border-zinc-700 pt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-400">Subtotal</span>
                      <span className="text-white">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-white">Total</span>
                      <span className="text-3xl font-bold text-green-400">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer Name Input */}
                  <div className="mb-4">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2 block">
                      Nombre del Cliente
                    </label>
                    <Input
                      placeholder="Ej. Juan Pérez (Opcional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1 italic">
                      Default: Venta al público
                    </p>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold shadow-lg shadow-green-500/30"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Completar Venta
                  </Button>
                </>
              )}
            </motion.div>

            {/* Sales History Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-xl font-bold text-white">Ventas Recientes</h2>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Buscar por folio..."
                  value={saleSearch}
                  onChange={(e) => setSaleSearch(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white h-9 text-sm"
                />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredSales.length === 0 ? (
                  <p className="text-center text-zinc-600 py-8 text-sm italic">
                    No se encontraron ventas
                  </p>
                ) : (
                  filteredSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 hover:border-zinc-600 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Folio #{sale.id}
                          </p>
                          <p className="text-[10px] text-zinc-600">
                            {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-green-400">
                            ${sale.total.toFixed(2)}
                          </p>
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
                            className="p-1.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-green-400 transition-all"
                            title="Imprimir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de cancelar esta venta? El stock será restaurado.')) {
                                  cancelSale(sale.id);
                                }
                              }}
                              className="p-1.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400 transition-all"
                              title="Cancelar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {sale.items.map((item, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800"
                          >
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <TicketModal 
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          data={selectedSale}
        />
      </div>
    </Layout>
  );
}
