export type SpiceLevel = 'non_pimente' | 'pimente' | 'doux' | 'releve' | 'piquant' | 'none';

export interface ModifierOption {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'chawarma' | 'degue' | 'jus';
  price: number; // in FCFA
  description: string;
  image: string;
  badge?: string;
  specialtyTag?: 'signature' | 'artisanal' | 'epice' | 'frais';
  spiceLevel: SpiceLevel;
  prepTime: string;
  tags: string[];
  customizable: boolean;
  options?: {
    sizes?: { label: string; priceDelta: number; default?: boolean }[];
    spices?: { id: SpiceLevel; label: string; desc: string }[];
    sauces?: { id: string; label: string; default?: boolean }[];
    extras?: { id: string; label: string; priceDelta: number }[];
  };
}

export interface CartItem {
  cartId: string;
  menuItem: MenuItem;
  quantity: number;
  variant?: string;
  size?: { label: string; priceDelta: number };
  spice?: { id: SpiceLevel; label: string };
  sauces: string[];
  extras: { id: string; label: string; priceDelta: number }[];
  instructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'received' | 'preparing' | 'braising' | 'delivering' | 'delivered';

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    neighborhood: string;
    deliveryType: 'delivery' | 'pickup';
    paymentMethod: 'fedapay' | 'cash' | 'momo_mtn' | 'momo_moov' | 'celtiis';
    notes?: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
    plateNumber: string;
    avatar: string;
  };
}
