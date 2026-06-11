/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
  balance: number;
  role: 'user' | 'admin';
  referrer_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  category_id?: string | null;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Package {
  id: string;
  product_id: string;
  days: 1 | 3 | 7 | 15 | 30;
  price: number;
  is_active: boolean;
  stock_count?: number;
}

export interface StockItem {
  id: string;
  package_id: string;
  item_type: 'key' | 'credentials' | 'custom';
  key_value: string | null;
  username: string | null;
  password: string | null;
  is_sold: boolean;
  sold_to: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  source: 'package' | 'bundle';
  package_id: string | null;
  bundle_id: string | null;
  amount_paid: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  delivered_at: string | null;
  packages?: {
    days: number;
    price: number;
    product_id: string;
    products?: { name: string; image_url: string; };
  };
  custom_bundles?: { name: string; };
}

export interface OrderItem {
  id: string;
  order_id: string;
  stock_item_id: string;
  stock_items?: StockItem;
}

export interface CustomBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface BundleComponent {
  id: string;
  bundle_id: string;
  package_id: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'topup' | 'purchase' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  ref_id: string | null;
  note: string | null;
  created_at: string;
}

export interface TopupSession {
  id: string;
  user_id: string;
  amount: number;
  vt_session_id: string | null;
  merchant_order_id: string | null;
  info_type: string | null;
  status: 'pending' | 'completed' | 'failed';
  txn_id: string | null;
  mfs_type: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface StockRequest {
  id: string;
  user_id: string;
  product_name: string;
  note: string | null;
  stat: 'pending' | 'done';
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_logo_url: string;
  primary_color: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency';
  is_active: boolean;
  created_at: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
