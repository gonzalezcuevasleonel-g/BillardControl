import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase, loginUser } from '../../utils/supabase';
import type { DbProduct, DbTable, DbTableSession, DbSale, DbSaleItem } from '../../utils/supabase';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
}

export interface Table {
  id: number;
  name: string;
  hourly_rate: number;
  status: 'available' | 'occupied';
  startTime: number | null;
  elapsedSeconds: number;
  products: CartItem[];
  sessionId: number | null;
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
  startTableSession: (tableId: number) => Promise<void>;
  endTableSession: (tableId: number) => Promise<void>;
  addProductToTable: (tableId: number, product: Product, quantity: number) => void;
  createPOSSale: (items: CartItem[]) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addTable: (name: string, hourly_rate?: number) => Promise<void>;
  updateTable: (id: number, newName: string, hourly_rate?: number) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  closeDailyCut: (cashDifference: number) => void;
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
  };
}

function dbTableToTable(db: DbTable, session?: DbTableSession): Table {
  const startTime = session?.start_time ? new Date(session.start_time).getTime() : null;
  const elapsedSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

  return {
    id: db.id,
    name: db.name,
    hourly_rate: db.hourly_rate,
    status: db.status,
    startTime,
    elapsedSeconds,
    products: [],
    sessionId: session?.id || null,
  };
}

function dbSaleToSale(db: DbSale, items: DbSaleItem[] = []): Sale {
  return {
    id: db.id_sale,
    timestamp: new Date(db.created_at).getTime(),
    user_id: db.user_id,
    session_id: db.session_id || undefined,
    total: db.total_sale,
    items: items.map(i => ({
      productId: i.product_id ?? 0,
      name: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
    })),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const savedUser = localStorage.getItem('billarUserSession');
    const userSession: UserSession | null = savedUser ? JSON.parse(savedUser) : null;
    return {
      tables: [],
      products: [],
      sales: [],
      dailyEarnings: 0,
      isAuthenticated: !!userSession,
      currentUser: userSession?.username || null,
      currentUserId: userSession ? Number(userSession.id_user) : null,
      currentUserRoleId: userSession ? Number(userSession.id_rol) : null,
      isLoading: true,
    };
  });

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
        .select('*')
        .eq('is_active', true);

      if (sessionsError) throw sessionsError;

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const products = (productsData || []).map(dbProductToProduct);

      const activeSessionsMap = new Map<number, DbTableSession>();
      (sessionsData || []).forEach(s => activeSessionsMap.set(s.table_id, s));

      const tables = (tablesData || []).map(t => {
        const session = activeSessionsMap.get(t.id);
        return dbTableToTable(t, session);
      });

      const sales = (salesData || []).map((s: any) => dbSaleToSale(s, s.sale_items || []));

      const dailyEarnings = sales
        .filter(s => {
          const saleDate = new Date(s.timestamp);
          const today = new Date();
          return saleDate.toDateString() === today.toDateString();
        })
        .reduce((sum, s) => sum + s.total, 0);

      setState(prev => ({
        ...prev,
        products,
        tables,
        sales,
        dailyEarnings,
      }));
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Error al cargar datos: ' + (err.message || 'Desconocido'));
    }
  }, []);

  // Check auth state and fetch data on mount
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('billarUserSession');
      if (savedUser) {
        await loadData();
      }
      setState(prev => ({ ...prev, isLoading: false }));
    };
    init();
  }, []);

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
      if (error || !data || data.length === 0) {
        console.error('Login error:', error);
        return false;
      }

      const user = data[0];

      const userSession: UserSession = {
        id_user: Number(user.id_user),
        username: user.username,
        id_rol: Number(user.id_rol),
      };
      localStorage.setItem('billarUserSession', JSON.stringify(userSession));

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

  const logout = (): void => {
    localStorage.removeItem('billarUserSession');
    setState({
      tables: [],
      products: [],
      sales: [],
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

  const startTableSession = async (tableId: number) => {
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

    toast.success('Sesión finalizada');
    await loadData();
  };

  const addProductToTable = (tableId: number, product: Product, quantity: number) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        const existing = t.products.find(p => p.productId === product.id);
        return {
          ...t,
          products: existing
            ? t.products.map(p =>
                p.productId === product.id
                  ? { ...p, quantity: p.quantity + quantity }
                  : p
              )
            : [...t.products, {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity,
              }],
        };
      }),
    }));
  };

  const createPOSSale = async (items: CartItem[]) => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const userId = state.currentUserId;
    if (!userId) return;

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        total_sale: total,
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
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar producto: ' + error.message);
      return;
    }
  };

  const closeDailyCut = async (cashDifference: number) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener IDs de las ventas del día
    const todaySales = state.sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const saleIds = todaySales.map(s => s.id);

    if (saleIds.length > 0) {
      // Eliminar sale_items del día
      await supabase.from('sale_items').delete().in('sale_id', saleIds);

      // Eliminar sales del día
      await supabase.from('sales').delete().in('id_sale', saleIds);
    }

    // Reiniciar el estado
    setState(prev => ({
      ...prev,
      sales: [],
      dailyEarnings: 0,
    }));

    console.log('Corte cerrado. Diferencia de efectivo:', cashDifference);
  } catch (err: any) {
    console.error('Error al cerrar corte:', err);
    toast.error('Error al cerrar corte: ' + (err.message || 'Desconocido'));
  }
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
        createPOSSale,
        updateProduct,
        addProduct,
        addTable,
        updateTable,
        deleteTable,
        closeDailyCut,
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
