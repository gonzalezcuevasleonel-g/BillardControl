import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, loginUser } from '../../utils/supabase';
import type { DbProduct, DbTable, DbTableSession, DbSale, DbSaleItem } from '../../utils/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Table {
  id: string;
  name: string;
  hourly_rate: number;
  status: 'available' | 'occupied';
  startTime: number | null;
  elapsedSeconds: number;
  products: CartItem[];
  sessionId: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  user_id: string;
  session_id?: string;
  total: number;
  items: CartItem[];
}

interface UserSession {
  id: string;
  username: string;
  role: string;
  id_role: number;
}

interface AppState {
  tables: Table[];
  products: Product[];
  sales: Sale[];
  dailyEarnings: number;
  isAuthenticated: boolean;
  currentUser: string | null;
  currentUserId: string | null;
  currentUserRole: string | null;
  currentUserRoleId: number | null;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  startTableSession: (tableId: string) => Promise<void>;
  endTableSession: (tableId: string) => Promise<void>;
  addProductToTable: (tableId: string, product: Product, quantity: number) => void;
  createPOSSale: (items: CartItem[]) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addTable: (name: string, hourly_rate?: number) => Promise<void>;
  updateTable: (id: string, newName: string, hourly_rate?: number) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  closeDailyCut: (cashDifference: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function dbProductToProduct(db: DbProduct): Product {
  return {
    id: db.id,
    name: db.name,
    price: db.price,
    stock: db.stock,
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
      productId: i.product_id || '',
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
      currentUserId: userSession?.id || null,
      currentUserRole: userSession?.role || null,
      currentUserRoleId: userSession?.id_role || null,
      isLoading: true,
    };
  });

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

  const loadData = useCallback(async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (productsError) throw productsError;

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .order('created_at', { ascending: true });

      if (tablesError) throw tablesError;

      // Fetch active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('is_active', true);

      if (sessionsError) throw sessionsError;

      // Fetch sales with items
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const products = (productsData || []).map(dbProductToProduct);

      const activeSessionsMap = new Map<string, DbTableSession>();
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
    }
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
      
      // Fallback: if id_role is missing from RPC response, fetch it directly
      let idRole = user.id_role;
      let userRole = user.role;
      if (idRole === undefined || idRole === null) {
        console.log('id_role missing from RPC, fetching from users table...');
        const { data: userData } = await supabase
          .from('users')
          .select('id_role, role')
          .eq('username', username)
          .single();
        if (userData) {
          idRole = userData.id_role;
          userRole = userData.role;
          console.log('Fetched from users table:', { idRole, userRole });
        }
      }
      
      const userSession: UserSession = {
        id: user.id,
        username: user.username,
        role: userRole,
        id_role: idRole,
      };
      localStorage.setItem('billarUserSession', JSON.stringify(userSession));
      
      console.log('Login success - session:', userSession);

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: user.username,
        currentUserId: user.id,
        currentUserRole: userRole,
        currentUserRoleId: idRole,
      }));

      await loadData();
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
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
      currentUserRole: null,
      currentUserRoleId: null,
      isLoading: false,
    });
  };

  const register = async (username: string, email: string, password: string) => {
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
        email,
        password,
        id_role: 2,
        role: 'trabajador',
      });

      if (error) {
        console.error('Error registering user:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Register error:', err);
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
      return;
    }

    setState(prev => ({
      ...prev,
      tables: [...prev.tables, dbTableToTable(data)],
    }));
  };

  const updateTable = async (id: string, newName: string, newRate?: number) => {
    const updates: Partial<DbTable> = { name: newName };
    if (newRate !== undefined) updates.hourly_rate = newRate;

    const { error } = await supabase.from('tables').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating table:', error);
      return;
    }

    setState(prev => ({
      ...prev,
      tables: prev.tables.map(t =>
        t.id === id ? { ...t, name: newName, ...(newRate !== undefined && { hourly_rate: newRate }) } : t
      ),
    }));
  };

  const deleteTable = async (id: string) => {
    const table = state.tables.find(t => t.id === id);
    if (table?.status === 'occupied') {
      alert('No puedes eliminar una mesa en uso');
      return;
    }

    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) {
      console.error('Error deleting table:', error);
      return;
    }

    setState(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t.id !== id),
    }));
  };

  const startTableSession = async (tableId: string) => {
    const userId = state.currentUserId;
    if (!userId) return;

    const now = new Date().toISOString();

    // Create table session
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
      return;
    }

    // Update table status
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

  const endTableSession = async (tableId: string) => {
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

    // Update table session
    await supabase
      .from('table_sessions')
      .update({
        end_time: new Date().toISOString(),
        total_time_price: tableCost,
        is_active: false,
      })
      .eq('id', table.sessionId);

    // Create sale
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
      return;
    }

    // Create sale items
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
      }
    }

    // Update product stock
    for (const item of table.products) {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    // Update table status
    await supabase.from('tables').update({ status: 'available' }).eq('id', tableId);

    // Refresh data
    await loadData();
  };

  const addProductToTable = (tableId: string, product: Product, quantity: number) => {
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
    }

    // Update stock
    for (const item of items) {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    await loadData();
  };

  const updateProduct = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
      })
      .eq('id', product.id);

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === product.id ? product : p),
    }));
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      return;
    }

    setState(prev => ({
      ...prev,
      products: [...prev.products, dbProductToProduct(data)],
    }));
  };

  const closeDailyCut = (cashDifference: number) => {
    console.log('Corte:', cashDifference);
    setState(prev => ({
      ...prev,
      dailyEarnings: 0,
    }));
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

