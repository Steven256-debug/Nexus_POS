import type { LucideIcon } from 'lucide-react';

// ─── Database Model Types ────────────────────────────────────────

export interface CategoryInfo {
  id: string;
  name: string;
}

export interface BrandInfo {
  id: string;
  name: string;
}

export interface UnitInfo {
  id: string;
  name: string;
  shortName: string;
}

export interface ProductMetadataItem {
  id: string;
  productId: string;
  key: string;
  value: string;
}

export interface ProductWithRelations {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string | null;
  category: CategoryInfo | null;
  brandId: string | null;
  brand: BrandInfo | null;
  unitId: string | null;
  unit: UnitInfo | null;
  pricePerUnit: any;
  costPrice: any;
  stockQuantity: number;
  minStockAlert: number;
  imageUrl: string | null;
  isFeatured: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  metadata: ProductMetadataItem[];
}

export interface SaleItemWithProduct {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  priceAtSale: any;
  costAtSale: any;
  product: ProductWithRelations;
}

export interface PaymentRecord {
  id: string;
  saleId: string;
  method: string;
  amount: any;
  note: string | null;
  createdAt: Date;
}

export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  groupId: string | null;
  creditLimit: any;
}

export interface SaleWithRelations {
  id: string;
  invoiceNo: string;
  locationId: string | null;
  cashierId: string;
  cashier: UserInfo;
  customerId: string | null;
  customer: CustomerInfo | null;
  status: string;
  paymentMethod: string;
  totalAmount: any;
  discountAmount: any;
  taxAmount: any;
  paidAmount: any;
  changeAmount: any;
  note: string | null;
  createdAt: Date;
  items: SaleItemWithProduct[];
  payments?: PaymentRecord[];
}

// ─── POS / Cart Types ────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface PosClientProps {
  initialProducts: ProductWithRelations[];
  initialResumedCart?: CartItem[];
  resumedSaleId?: string | null;
  taxRate?: number;
}

// ─── Navigation Types ────────────────────────────────────────────

export interface NavSubItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  href?: string;
  subItems?: NavSubItem[];
}

// ─── Dashboard Types ─────────────────────────────────────────────

export interface DailyTrendData {
  date: string;
  sales: number;
  profit: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todaySalesCount: number;
  revenueGrowth: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: ProductWithRelations[];
  days30: DailyTrendData[];
  recentSales: SaleWithRelations[];
  categoryDistribution: CategoryDistribution[];
}
