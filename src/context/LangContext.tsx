import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'bn' | 'en';

type T = { [key: string]: string };

export const BN: T = {
  home: 'হোম',
  funds: 'ফান্ড যোগ করুন',
  orders: 'অর্ডার',
  keys: 'আমার কী',
  account: 'অ্যাকাউন্ট',
  bundles: 'বান্ডেল',
  stock_request: 'স্টক রিকোয়েস্ট',
  login: 'লগ ইন',
  register: 'নিবন্ধন',
  logout: 'লগ আউট',
  balance: 'ব্যালেন্স',
  buy_now: 'এখনই কিনুন',
  select_package: 'প্যাকেজ বেছে নিন',
  purchase: 'ক্রয় করুন',
  out_of_stock: 'স্টক নেই',
  in_stock: 'স্টক আছে',
  all: 'সব',
  search: 'খুঁজুন...',
  description: 'বিবরণ ও নির্দেশনা',
  promo_code: 'প্রোমো কোড',
  apply: 'প্রয়োগ করুন',
  copy_code: 'কোড কপি করুন',
  copied: 'কপি হয়েছে!',
  purchase_complete: 'ক্রয় সম্পন্ন!',
  key_delivered: 'আপনার লাইসেন্স কী পৌঁছে দেওয়া হয়েছে। এখনই কপি করুন!',
  go_home: 'হোমে যান',
  my_keys: 'আমার কী',
  login_to_purchase: 'ক্রয় করতে লগ ইন করুন',
  add_funds: 'ফান্ড যোগ করুন →',
  insufficient: 'ব্যালেন্স কম।',
  instant_delivery: 'তাৎক্ষণিক ডেলিভারি',
  genuine: 'আসল পণ্য',
  wallet_payment: 'ওয়ালেট পেমেন্ট',
  setup_video: 'সেটআপ ভিডিও',
  watch_setup: 'সেটআপ দেখুন',
  days: 'দিন',
  your_balance: 'আপনার ব্যালেন্স',
  product_not_found: 'পণ্য পাওয়া যায়নি!',
  return_gallery: 'মার্কেটে ফিরুন',
  install_app: 'অ্যাপ ইনস্টল করুন',
  install_desc: 'ক্রোমের মতো ইনস্টল করুন — দ্রুত ও সহজ',
  install_btn: 'ইনস্টল করুন',
  install_later: 'পরে',
  notif_title: 'নোটিফিকেশন চালু করুন',
  notif_desc: 'নতুন স্টক ও অফারের আপডেট পান',
  notif_allow: 'অনুমতি দিন',
  trusted: 'বিশ্বস্ত',
  no_packages: 'এই পণ্যের কোনো প্যাকেজ নেই।',
  loading: 'লোড হচ্ছে...',
  nothing_found: 'কিছু পাওয়া যায়নি',
  reset_filters: 'ফিল্টার রিসেট করুন',
};

export const EN: T = {
  home: 'Home',
  funds: 'Add Funds',
  orders: 'Orders',
  keys: 'My Keys',
  account: 'Account',
  bundles: 'Bundles',
  stock_request: 'Stock Request',
  login: 'Login',
  register: 'Register',
  logout: 'Log Out',
  balance: 'Balance',
  buy_now: 'Buy Now',
  select_package: 'Select Package',
  purchase: 'Purchase',
  out_of_stock: 'Out of Stock',
  in_stock: 'In Stock',
  all: 'All',
  search: 'Search products...',
  description: 'Description & Instructions',
  promo_code: 'Promo code',
  apply: 'Apply',
  copy_code: 'Copy Code',
  copied: 'Copied!',
  purchase_complete: 'Purchase Complete!',
  key_delivered: 'Your license key has been delivered. Copy it now!',
  go_home: 'Home',
  my_keys: 'My Keys',
  login_to_purchase: 'Login to Purchase',
  add_funds: 'Add Funds →',
  insufficient: 'Insufficient balance.',
  instant_delivery: 'Instant Delivery',
  genuine: 'Genuine Keys',
  wallet_payment: 'Wallet Payment',
  setup_video: 'Setup Video',
  watch_setup: 'Watch Setup',
  days: 'Days',
  your_balance: 'Your Balance',
  product_not_found: 'Product not found!',
  return_gallery: 'Return to Gallery',
  install_app: 'Install App',
  install_desc: 'Install like an app — fast & offline ready',
  install_btn: 'Install',
  install_later: 'Later',
  notif_title: 'Enable Notifications',
  notif_desc: 'Get alerts for new stock & offers',
  notif_allow: 'Allow',
  trusted: 'Trusted',
  no_packages: 'No packages available for this product.',
  loading: 'Loading...',
  nothing_found: 'Nothing found',
  reset_filters: 'Reset filters',
};

interface LangCtx { lang: Lang; t: T; toggle: () => void; }
const LangContext = createContext<LangCtx>({ lang: 'bn', t: BN, toggle: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('pb_lang') as Lang) || 'bn'; } catch { return 'bn'; }
  });
  const toggle = () => {
    const next = lang === 'bn' ? 'en' : 'bn';
    setLang(next);
    try { localStorage.setItem('pb_lang', next); } catch {}
  };
  const t = lang === 'bn' ? BN : EN;
  return <LangContext.Provider value={{ lang, t, toggle }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }
