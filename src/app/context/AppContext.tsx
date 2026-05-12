import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase, loginUser } from '../../utils/supabase';
import type { DbProduct, DbTable, DbTableSession, DbSale, DbSaleItem, DbUser, DbSessionItem } from '../../utils/supabase';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
  cost: number;
}

export interface Table {
  id: number;
  name: string;
  hourly_rate: number;
  status: 'available' | 'occupied' | 'maintenance';
  startTime: number | null;
  elapsedSeconds: number;
  products: CartItem[];
  sessionId: number | null;
  customerName?: string | null;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: number;
  timestamp: number;
  user_id: number;
  session_id?: number | null;
  total: number;
  items: CartItem[];
  customer_name?: string | null;
  // New fields for table sessions
  table_name?: string;
  start_time?: string;
  end_time?: string;
  total_time_price?: number;
  seller_name?: string;
}

interface UserSession {
  id_user: number;
  username: string;
  id_rol: number;
}

interface AppState {
  tables: Table[];
  products: Product[];
  sales: Sale[];
  todaySales: Sale[];
  dailyEarnings: number;
  isAuthenticated: boolean;
  currentUser: string | null;
  currentUserId: number | null;
  currentUserRoleId: number | null;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  startTableSession: (tableId: number, customerName?: string) => Promise<void>;
  endTableSession: (tableId: number) => Promise<void>;
  addProductToTable: (tableId: number, product: Product, quantity: number) => Promise<void>;
  removeProductFromTable: (tableId: number, productId: number) => Promise<void>;
  createPOSSale: (items: CartItem[], customerName?: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addTable: (name: string, hourly_rate?: number) => Promise<void>;
  updateTable: (id: number, newName: string, hourly_rate?: number) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  closeDailyCut: (cashDifference: number) => void;
  fetchUsers: () => Promise<DbUser[]>;
  deleteUser: (id_user: number) => Promise<void>;
  updateUserRole: (id_user: number, id_rol: number) => Promise<void>;
  updateUserPassword: (id_user: number, newPassword: string) => Promise<void>;
  updateTableStatus: (tableId: number, status: 'available' | 'occupied' | 'maintenance') => Promise<void>;
  cancelSale: (saleId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function dbProductToProduct(db: DbProduct): Product {
  return {
    id: db.id,
    name: db.name,
    price: db.price,
    stock: db.stock,
    min_stock: db.min_stock,
    category: db.category,
    cost: db.cost || 0,
  };
}

function dbTableToTable(db: DbTable, session?: DbTableSession & { session_items?: DbSessionItem[] }): Table {
  const startTime = session?.start_time ? new Date(session.start_time).getTime() : null;
  const elapsedSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

  const products: CartItem[] = (session?.session_items || []).map(item => ({
    productId: item.product_id || 0,
    name: item.product_name,
    price: item.unit_price,
    quantity: item.quantity
  }));

  return {
    id: db.id,
    name: db.name,
    hourly_rate: db.hourly_rate,
    status: db.status,
    startTime,
    elapsedSeconds,
    products,
    sessionId: session?.id || null,
    customerName: session?.customer_name || null,
  };
}

function dbSaleToSale(db: any, items: DbSaleItem[] = []): Sale {
  return {
    id: db.id_sale,
    timestamp: new Date(db.created_at).getTime(),
    user_id: db.user_id,
    session_id: db.session_id || undefined,
    total: db.total_sale,
    customer_name: db.table_sessions?.customer_name || null,
    table_name: db.table_sessions?.tables?.name || undefined,
    start_time: db.table_sessions?.start_time || undefined,
    end_time: db.table_sessions?.end_time || undefined,
    total_time_price: db.table_sessions?.total_time_price || undefined,
    seller_name: db.users?.username || 'Sistema',
    items: items.map(i => ({
      productId: i.product_id ?? 0,
      name: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
    })),

    // Extra fields used by Dashboard receipt (kept loose to avoid changing Sale interface)
    ...(tableSession ? { table_session: tableSession, table: table } : {}),
  } as any;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const savedUser = localStorage.getItem('billarUserSession');
    const userSession: UserSession | null = savedUser ? JSON.parse(savedUser) : null;
    return {
      tables: [],
      products: [],
      sales: [],
      todaySales: [],
      dailyEarnings: 0,
      isAuthenticated: !!userSession,
      currentUser: userSession?.username || null,
      currentUserId: userSession ? Number(userSession.id_user) : null,
      currentUserRoleId: userSession ? Number(userSession.id_rol) : null,
      isLoading: true,
    };
  });

  const [lastCutTimestamp, setLastCutTimestamp] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .order('name');

      if (tablesError) throw tablesError;

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('table_sessions')
        .select('*, session_items(*)')
        .eq('is_active', true);

      if (sessionsError) throw sessionsError;

      const { data: cutsData } = await supabase
        .from('cash_cuts')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastCutTime = cutsData?.[0]?.created_at ? new Date(cutsData[0].created_at).getTime() : 0;
      setLastCutTimestamp(lastCutTime);

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(*), table_sessions(*, tables(name)), users(username)')
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const products = (productsData || []).map(dbProductToProduct);

      const activeSessionsMap = new Map<number, DbTableSession & { session_items?: DbSessionItem[] }>();
      (sessionsData || []).forEach(s => activeSessionsMap.set(s.table_id, s));

      const tables = (tablesData || []).map(t => {
        const session = activeSessionsMap.get(t.id);
        return dbTableToTable(t, session);
      });

      const sales = (salesData || []).map((s: any) => dbSaleToSale(s, s.sale_items || []));

      const todaySales = sales.filter(s => {
        const saleDate = new Date(s.timestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString() && s.timestamp > lastCutTime;
      });

      const dailyEarnings = todaySales.reduce((sum, s) => sum + s.total, 0);

      setState(prev => ({
        ...prev,
        products,
        tables,
        sales,
        todaySales,
        dailyEarnings,
      }));
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Error al cargar datos: ' + (err.message || 'Desconocido'));
    }
  }, [lastCutTimestamp]);

  // Check auth state and fetch data on mount
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('billarUserSession');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        // Ensure user is marked as online on refresh
        await supabase
          .from('users')
          .update({ is_online: true, last_login: new Date().toISOString() })
          .eq('id_user', user.id_user);

        await loadData();
      }
      setState(prev => ({ ...prev, isLoading: false }));
    };
    init();
  }, []);

  // Heartbeat to keep user online
  useEffect(() => {
    if (!state.isAuthenticated || !state.currentUserId) return;

    const heartbeat = setInterval(async () => {
      await supabase
        .from('users')
        .update({ is_online: true, last_login: new Date().toISOString() })
        .eq('id_user', state.currentUserId);
    }, 60000); // Every minute

    return () => clearInterval(heartbeat);
  }, [state.isAuthenticated, state.currentUserId]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        return {
          ...prev,
          tables: prev.tables.map((table) =>
            table.status === 'occupied' && table.startTime
              ? {
                ...table,
                elapsedSeconds: Math.floor((now - table.startTime) / 1000),
              }
              : table
          ),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await loginUser(username, password);
      if (error) {
        console.error('Login error:', error);
        toast.error('Error login (DB): ' + error.message);
        return false;
      }
      if (!data || data.length === 0) {
        console.error('Login error: no data for user');
        toast.error('Usuario o contraseña incorrectos');
        return false;
      }


      const user = data[0];

      const userSession: UserSession = {
        id_user: Number(user.id_user),
        username: user.username,
        id_rol: Number(user.id_rol),
      };
      localStorage.setItem('billarUserSession', JSON.stringify(userSession));

      // Mark user as online
      await supabase
        .from('users')
        .update({ is_online: true, last_login: new Date().toISOString() })
        .eq('id_user', user.id_user);

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: user.username,
        currentUserId: Number(user.id_user),
        currentUserRoleId: Number(user.id_rol),
      }));

      await loadData();
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Error al iniciar sesión: ' + (err.message || 'Desconocido'));
      return false;
    }
  };

  const logout = async () => {
    if (state.currentUserId) {
      await supabase
        .from('users')
        .update({ is_online: false })
        .eq('id_user', state.currentUserId);
    }
    localStorage.removeItem('billarUserSession');
    setState({
      tables: [],
      products: [],
      sales: [],
      todaySales: [],
      dailyEarnings: 0,
      isAuthenticated: false,
      currentUser: null,
      currentUserId: null,
      currentUserRoleId: null,
      isLoading: false,
    });
  };

  const register = async (username: string, password: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { success: false, error: 'El usuario ya existe' };
      }

      const { error } = await supabase.from('users').insert({
        username,
        password,
        id_rol: 2,
      });

      if (error) {
        console.error('Error registering user:', error);
        toast.error('Error al registrar: ' + error.message);
        return { success: false, error: error.message };
      }

      toast.success('Usuario registrado exitosamente');
      return { success: true };
    } catch (err: any) {
      console.error('Register error:', err);
      toast.error('Error al registrar: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  const addTable = async (name: string, hourly_rate: number = 50) => {
    const { data, error } = await supabase
      .from('tables')
      .insert({ name, hourly_rate, status: 'available' })
      .select()
      .single();

    if (error) {
      console.error('Error adding table:', error);
      toast.error('Error al agregar mesa: ' + error.message);
      return;
    }

    toast.success('Mesa agregada');
    setState(prev => ({
      ...prev,
      tables: [...prev.tables, dbTableToTable(data)],
    }));
  };

  const updateTable = async (id: number, newName: string, newRate?: number) => {
    const updates: Partial<DbTable> = { name: newName };
    if (newRate !== undefined) updates.hourly_rate = newRate;

    const { error } = await supabase.from('tables').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating table:', error);
      toast.error('Error al actualizar mesa: ' + error.message);
      return;
    }

    toast.success('Mesa actualizada');
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(t =>
        t.id === id ? { ...t, name: newName, ...(newRate !== undefined && { hourly_rate: newRate }) } : t
      ),
    }));
  };
  //Arreglado el error de eliminar las mesas
  const deleteTable = async (id: number) => {
    const table = state.tables.find(t => t.id === id);
    if (table?.status === 'occupied') {
      toast.error('No puedes eliminar una mesa en uso');
      return;
    }

    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) {
      console.error('Error deleting table:', error);
      toast.error('Error al eliminar mesa: ' + error.message);
      return;
    }

    toast.success('Mesa eliminada');
    setState(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t.id !== id),
    }));
  };

  const startTableSession = async (tableId: number, customerName?: string) => {
    const userId = state.currentUserId;
    if (!userId) return;

    const now = new Date().toISOString();

    const { data: sessionData, error: sessionError } = await supabase
      .from('table_sessions')
      .insert({
        table_id: tableId,
        user_id: userId,
        start_time: now,
        is_active: true,
        customer_name: customerName || null,
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      toast.error('Error al iniciar sesión: ' + (sessionError?.message || 'Desconocido'));
      return;
    }

    await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);

    setState(prev => ({
      ...prev,
      tables: prev.tables.map(t =>
        t.id === tableId
          ? {
            ...t,
            status: 'occupied',
            startTime: Date.now(),
            elapsedSeconds: 0,
            products: [],
            sessionId: sessionData.id,
            customerName: sessionData.customer_name,
          }
          : t
      ),
    }));
  };

  const endTableSession = async (tableId: number) => {
    const table = state.tables.find(t => t.id === tableId);
    if (!table || table.status !== 'occupied' || !table.sessionId) return;

    const userId = state.currentUserId;
    if (!userId) return;

    const timeInHours = table.elapsedSeconds / 3600;
    const tableCost = timeInHours * table.hourly_rate;
    const productsCost = table.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = tableCost + productsCost;

    await supabase
      .from('table_sessions')
      .update({
        end_time: new Date().toISOString(),
        total_time_price: tableCost,
        is_active: false,
      })
      .eq('id', table.sessionId);

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        session_id: table.sessionId,
        total_sale: total,
      })
      .select()
      .single();

    if (saleError || !saleData) {
      console.error('Error creating sale:', saleError);
      toast.error('Error al crear venta: ' + (saleError?.message || 'Desconocido'));
      return;
    }

    if (table.products.length > 0) {
      const saleItems = table.products.map(p => ({
        sale_id: saleData.id_sale,
        product_id: p.productId,
        product_name: p.name,
        unit_price: p.price,
        quantity: p.quantity,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) {
        console.error('Error creating sale items:', itemsError);
        toast.error('Error al registrar productos: ' + itemsError.message);
      }
    }

    for (const item of table.products) {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    await supabase.from('tables').update({ status: 'available' }).eq('id', tableId);

    // Limpiar items de la sesión activa ya que ahora están en sale_items
    await supabase.from('session_items').delete().eq('session_id', table.sessionId);

    toast.success('Sesión finalizada');
    await loadData();
  };

  const addProductToTable = async (tableId: number, product: Product, quantity: number) => {
    const table = state.tables.find(t => t.id === tableId);
    if (!table || !table.sessionId) return;

    const existing = table.products.find(p => p.productId === product.id);
    const newQuantity = existing ? existing.quantity + quantity : quantity;

    // Persistir en Supabase (Usar upsert para manejar incrementos)
    const { error } = await supabase
      .from('session_items')
      .upsert({
        session_id: table.sessionId,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: newQuantity,
      }, { onConflict: 'session_id,product_id' });

    if (error) {
      console.error('Error adding product to session:', error);
      toast.error('Error al guardar producto: ' + error.message);
      return;
    }

    await loadData();
  };

  const removeProductFromTable = async (tableId: number, productId: number) => {
    const table = state.tables.find(t => t.id === tableId);
    if (!table || !table.sessionId) return;

    const { error } = await supabase
      .from('session_items')
      .delete()
      .eq('session_id', table.sessionId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing product from session:', error);
      toast.error('Error al eliminar producto');
      return;
    }

    await loadData();
  };

  const createPOSSale = async (items: CartItem[], customerName?: string) => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const userId = state.currentUserId;
    if (!userId) return;

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        total_sale: total,
        customer_name: customerName || 'Venta al público',
      })
      .select()
      .single();

    if (saleError || !saleData) {
      console.error('Error creating POS sale:', saleError);
      toast.error('Error al crear venta: ' + (saleError?.message || 'Desconocido'));
      return;
    }

    const saleItems = items.map(i => ({
      sale_id: saleData.id_sale,
      product_id: i.productId,
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) {
      console.error('Error creating sale items:', itemsError);
      toast.error('Error al registrar productos: ' + itemsError.message);
    }

    for (const item of items) {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    toast.success('Venta registrada');
    await loadData();
  };

  const updateProduct = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        price: product.price,
        stock: product.stock,
        min_stock: product.min_stock,
        category: product.category,
        cost: product.cost,
      })
      .eq('id', product.id);

    if (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar producto: ' + error.message);
      return;
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        stock: product.stock,
        min_stock: product.min_stock,
        category: product.category,
        cost: product.cost,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar producto: ' + error.message);
      return;
    }
  };

  const cancelSale = async (saleId: number) => {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;

    // 1. Restaurar stock de productos
    for (const item of sale.items) {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    // 2. Eliminar la venta
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id_sale', saleId);

    if (error) {
      console.error('Error cancelling sale:', error);
      toast.error('Error al cancelar venta: ' + error.message);
      return;
    }

    toast.success('Venta cancelada y stock restaurado');
    await loadData();
  };

  const updateTableStatus = async (tableId: number, status: 'available' | 'occupied' | 'maintenance') => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      await loadData();
      toast.success(status === 'maintenance' ? 'Mesa puesta fuera de servicio' : 'Mesa habilitada');
    } catch (err: any) {
      console.error('Error updating table status:', err);
      toast.error('Error al actualizar estado de la mesa: ' + (err.message || 'Desconocido'));
    }
  };

  const closeDailyCut = async (cashDifference: number) => {
    const userId = state.currentUserId;
    if (!userId) return;

    const { error } = await supabase.from('cash_cuts').insert({
      user_id: userId,
      total_expected: state.dailyEarnings,
      cash_in_box: state.dailyEarnings + cashDifference,
      difference: cashDifference,
    });

    if (error) {
      console.error('Error recording cash cut:', error);
      toast.error('Error al registrar corte de caja');
      return;
    }

    await loadData(); // Reload to update lastCutTimestamp
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        startTableSession,
        endTableSession,
        addProductToTable,
        removeProductFromTable,
        createPOSSale,
        updateProduct,
        updateTableStatus,
        addProduct,
        addTable,
        updateTable,
        deleteTable,
        closeDailyCut,
        fetchUsers: async () => {
          const { data, error } = await supabase.from('users').select('*').order('username');
          if (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
            return [];
          }
          return data as DbUser[];
        },
        deleteProduct: async (id: number) => {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) {
            console.error('Error deleting product:', error);
            toast.error('No se puede eliminar: el producto tiene ventas registradas.');
            return;
          }
          toast.success('Producto eliminado');
          await loadData();
        },
        deleteUser: async (id_user: number) => {
          const { error } = await supabase.from('users').delete().eq('id_user', id_user);
          if (error) {
            console.error('Error deleting user:', error);
            toast.error('Error al eliminar usuario');
            return;
          }
          toast.success('Usuario eliminado');
        },
        updateUserRole: async (id_user: number, id_rol: number) => {
          const { error } = await supabase.from('users').update({ id_rol }).eq('id_user', id_user);
          if (error) {
            console.error('Error updating user role:', error);
            toast.error('Error al actualizar rol');
            return;
          }
          toast.success('Rol actualizado');
        },
        updateUserPassword: async (id_user: number, newPassword: string) => {
          const { error } = await supabase.from('users').update({ password: newPassword }).eq('id_user', id_user);
          if (error) {
            console.error('Error updating password:', error);
            toast.error('Error al actualizar contraseña');
            return;
          }
          toast.success('Contraseña actualizada correctamente');
        },
        cancelSale,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
