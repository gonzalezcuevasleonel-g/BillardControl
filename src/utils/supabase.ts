import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be defined in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// DATABASE TYPES
// ============================================

export type TableStatus = 'available' | 'occupied';

export interface DbUser {
  id_user: string;
  username: string;
  id_rol: number;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
  updated_at: string;
}

export interface DbTable {
  id: string;
  name: string;
  hourly_rate: number;
  status: TableStatus;
}

export interface DbTableSession {
  id: string;
  table_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  total_time_price: number;
  is_active: boolean;
}

export interface DbSale {
  id_sale: string;
  user_id: string;
  session_id: string | null;
  total_sale: number;
  created_at: string;
}

export interface DbSaleItem {
  id_detail: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

// ============================================
// AUTH HELPERS (Custom users table)
// ============================================

export async function loginUser(username: string, password: string) {
  const { data, error } = await supabase.rpc('login_user', {
    p_username: username,
    p_password: password,
  });
  return { data: data as { id_user: string; username: string; id_rol: number; created_at: string; updated_at: string }[] | null, error };
}

export async function insertUser(user: { username: string; password: string; id_rol?: number }) {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();
  return { data: data as DbUser | null, error };
}

// ============================================
// DATA HELPERS
// ============================================

// Products
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  return { data: data as DbProduct[] | null, error };
}

export async function insertProduct(product: Omit<DbProduct, 'id' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  return { data: data as DbProduct | null, error };
}

export async function updateProduct(id: string, updates: Partial<DbProduct>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data: data as DbProduct | null, error };
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { error };
}

// Tables
export async function fetchTables() {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('name');
  return { data: data as DbTable[] | null, error };
}

export async function insertTable(table: Omit<DbTable, 'id'>) {
  const { data, error } = await supabase
    .from('tables')
    .insert(table)
    .select()
    .single();
  return { data: data as DbTable | null, error };
}

export async function updateTable(id: string, updates: Partial<DbTable>) {
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data: data as DbTable | null, error };
}

export async function deleteTable(id: string) {
  const { error } = await supabase.from('tables').delete().eq('id', id);
  return { error };
}

// Table Sessions
export async function fetchActiveSessions() {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('is_active', true);
  return { data: data as DbTableSession[] | null, error };
}

export async function insertTableSession(session: Omit<DbTableSession, 'id' | 'start_time' | 'end_time' | 'total_time_price'>) {
  const { data, error } = await supabase
    .from('table_sessions')
    .insert(session)
    .select()
    .single();
  return { data: data as DbTableSession | null, error };
}

export async function updateTableSession(id: string, updates: Partial<DbTableSession>) {
  const { data, error } = await supabase
    .from('table_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data: data as DbTableSession | null, error };
}

// Sales
export async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (*)
    `)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function insertSale(
  sale: Omit<DbSale, 'id_sale' | 'created_at'>,
  items: Omit<DbSaleItem, 'id_detail' | 'sale_id' | 'subtotal'>[]
) {
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .single();

  if (saleError || !saleData) return { data: null, error: saleError };

  const saleItems = items.map((item) => ({
    ...item,
    sale_id: saleData.id_sale,
  }));

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

  return { data: saleData as DbSale, error: itemsError };
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from('sales').delete().eq('id_sale', id);
  return { error };
}

