import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  Boxes,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  PackagePlus,
  Plus,
  Printer,
  Search,
  Store,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { formatFCFA } from '../data/menu';
import { DEMO_ADMIN_ACCOUNT, DEMO_STAFF_ACCOUNTS } from '../data/demoAccounts';
import { Order, OrderStatus } from '../types';

type AdminSection = 'overview' | 'orders' | 'couriers' | 'stock' | 'cash' | 'accounts';
type CourierStatus = 'available' | 'busy' | 'offline';
type CashEntryType = 'income' | 'expense';
type StaffRole = 'server' | 'courier' | 'cashier';

interface StaffAccount {
  id: string;
  username: string;
  name: string;
  role: StaffRole;
  passwordHash: string;
  enabled: boolean;
  courierId?: string;
}

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plateNumber: string;
  status: CourierStatus;
}

interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minimum: number;
}

interface CashEntry {
  id: string;
  type: CashEntryType;
  label: string;
  amount: number;
  createdAt: string;
}

const STORAGE_KEYS = {
  orders: 'chez_osi_orders',
  activeOrder: 'chez_osi_active_order',
  couriers: 'chez_osi_admin_couriers',
  stock: 'chez_osi_admin_stock',
  cash: 'chez_osi_admin_cash',
  accounts: 'chez_osi_staff_accounts'
} as const;

const INITIAL_STOCK: StockItem[] = [
  { id: 'meat', name: 'Viande', unit: 'kg', quantity: 8, minimum: 3 },
  { id: 'galettes', name: 'Galettes', unit: 'pièces', quantity: 40, minimum: 12 },
  { id: 'mil', name: 'Mil', unit: 'kg', quantity: 10, minimum: 3 },
  { id: 'yogurt', name: 'Yaourt', unit: 'L', quantity: 8, minimum: 3 },
  { id: 'charcoal', name: 'Charbon', unit: 'sacs', quantity: 5, minimum: 2 },
  { id: 'packaging', name: 'Emballages', unit: 'pièces', quantity: 60, minimum: 20 }
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Reçue',
  preparing: 'En préparation',
  braising: 'Cuisson / prête',
  delivering: 'En livraison',
  delivered: 'Terminée'
};

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Vue générale', icon: LayoutDashboard },
  { id: 'orders', label: 'Commandes', icon: ClipboardList },
  { id: 'couriers', label: 'Livreurs', icon: Bike },
  { id: 'stock', label: 'Stocks', icon: Boxes },
  { id: 'cash', label: 'Caisse & reçus', icon: Wallet },
  { id: 'accounts', label: 'Comptes équipe', icon: Users }
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from local storage:`, error);
    return fallback;
  }
}

function loadOrders(): Order[] {
  const savedOrders = readStored<Order[]>(STORAGE_KEYS.orders, []).map((order) => ({
    ...order,
    paymentStatus: order.paymentStatus || (order.customer.paymentMethod === 'fedapay' ? 'paid' as const : 'pending' as const)
  }));
  const activeOrder = readStored<Order | null>(STORAGE_KEYS.activeOrder, null);
  const normalizedActiveOrder = activeOrder ? {
    ...activeOrder,
    paymentStatus: activeOrder.paymentStatus || (activeOrder.customer.paymentMethod === 'fedapay' ? 'paid' as const : 'pending' as const)
  } : null;
  return normalizedActiveOrder && !savedOrders.some((order) => order.id === normalizedActiveOrder.id)
    ? [normalizedActiveOrder, ...savedOrders]
    : savedOrders;
}

function orderTimestamp(order: Order): number {
  const value = order.createdAtIso || order.createdAt;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export const AdminDashboard: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem('chez_osi_admin_unlocked') === 'true'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [couriers, setCouriers] = useState<Courier[]>(() => readStored(STORAGE_KEYS.couriers, []));
  const [stock, setStock] = useState<StockItem[]>(() => readStored(STORAGE_KEYS.stock, INITIAL_STOCK));
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => readStored(STORAGE_KEYS.cash, []));
  const [accounts, setAccounts] = useState<StaffAccount[]>(() => readStored(STORAGE_KEYS.accounts, []));
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [courierFormOpen, setCourierFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [cashFormOpen, setCashFormOpen] = useState(false);
  const [courierDraft, setCourierDraft] = useState({ name: '', phone: '', vehicle: '', plateNumber: '' });
  const [stockDraft, setStockDraft] = useState({ name: '', unit: '', quantity: '', minimum: '' });
  const [cashDraft, setCashDraft] = useState({ type: 'expense' as CashEntryType, label: '', amount: '' });
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountDraft, setAccountDraft] = useState({ name: '', username: '', role: 'server' as StaffRole, password: '', phone: '', vehicle: '', plateNumber: '' });
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    setIsAuthenticating(true);
    try {
      if (email.trim().toLocaleLowerCase() !== DEMO_ADMIN_ACCOUNT.email || password !== DEMO_ADMIN_ACCOUNT.password) {
        setAuthError('Adresse e-mail ou mot de passe incorrect.');
        return;
      }
      sessionStorage.setItem('chez_osi_admin_unlocked', 'true');
      setIsUnlocked(true);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Unable to authenticate admin locally:', error);
      setAuthError(error instanceof Error ? error.message : 'La connexion a échoué. Réessaie.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const lockAdmin = () => {
    sessionStorage.removeItem('chez_osi_admin_unlocked');
    setIsUnlocked(false);
    setEmail('');
    setPassword('');
  };

  const persist = <T,>(key: string, value: T, label: string) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setNotice(`${label} enregistré dans ce navigateur.`);
      window.setTimeout(() => setNotice(''), 3500);
    } catch (error) {
      console.error(`Unable to save ${key} to local storage:`, error);
      setNotice('Enregistrement impossible dans le stockage local de ce navigateur.');
    }
  };

  useEffect(() => {
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.orders || event.key === STORAGE_KEYS.activeOrder) {
        setOrders(loadOrders());
      } else if (event.key === STORAGE_KEYS.couriers) {
        setCouriers(readStored(STORAGE_KEYS.couriers, []));
      } else if (event.key === STORAGE_KEYS.stock) {
        setStock(readStored(STORAGE_KEYS.stock, INITIAL_STOCK));
      } else if (event.key === STORAGE_KEYS.cash) {
        setCashEntries(readStored(STORAGE_KEYS.cash, []));
      } else if (event.key === STORAGE_KEYS.accounts) {
        setAccounts(readStored(STORAGE_KEYS.accounts, []));
      }
    };
    window.addEventListener('storage', syncFromOtherTab);
    return () => window.removeEventListener('storage', syncFromOtherTab);
  }, []);

  const todayKey = new Date().toLocaleDateString('fr-CA');
  const todayOrders = orders.filter((order) => {
    const timestamp = orderTimestamp(order);
    return timestamp > 0 && new Date(timestamp).toLocaleDateString('fr-CA') === todayKey;
  });
  const activeOrders = orders.filter((order) => order.status !== 'delivered');
  const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const todayDeliveryFees = todayOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
  const todayCashEntries = cashEntries.filter((entry) => new Date(entry.createdAt).toLocaleDateString('fr-CA') === todayKey);
  const cashBalance = todayCashEntries.reduce(
    (sum, entry) => sum + (entry.type === 'income' ? entry.amount : -entry.amount),
    0
  );
  const lowStockCount = stock.filter((item) => item.quantity <= item.minimum).length;
  const availableCourierCount = couriers.filter((courier) => courier.status === 'available').length;

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return orders.filter((order) => {
      if (orderFilter !== 'all' && order.status !== orderFilter) return false;
      if (!normalizedSearch) return true;
      return [
        order.id,
        order.customer.fullName,
        order.customer.phone,
        order.customer.neighborhood
      ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    }).sort((left, right) => orderTimestamp(right) - orderTimestamp(left));
  }, [orders, orderFilter, search]);

  const updateOrder = (orderId: string, patch: Partial<Order>) => {
    const updatedOrders = orders.map((order) => order.id === orderId ? { ...order, ...patch } : order);
    const updatedOrder = updatedOrders.find((order) => order.id === orderId);
    setOrders(updatedOrders);
    try {
      saveOrders(updatedOrders);
      if (updatedOrder && readStored<Order | null>(STORAGE_KEYS.activeOrder, null)?.id === orderId) {
        localStorage.setItem(STORAGE_KEYS.activeOrder, JSON.stringify(updatedOrder));
      }
      setNotice('Commande mise à jour.');
      window.setTimeout(() => setNotice(''), 3000);
    } catch (error) {
      console.error('Unable to update order locally:', error);
      setNotice('La commande n’a pas pu être enregistrée dans ce navigateur.');
    }
  };

  const assignCourier = (order: Order, courierId: string) => {
    const courier = couriers.find((item) => item.id === courierId);
    const driver = courier ? {
      name: courier.name,
      phone: courier.phone,
      vehicle: courier.vehicle,
      plateNumber: courier.plateNumber,
      avatar: '🛵'
    } : undefined;
    updateOrder(order.id, { driver });
  };

  const addCourier = (event: React.FormEvent) => {
    event.preventDefault();
    if (!courierDraft.name.trim() || !courierDraft.phone.trim()) return;
    const newCourier: Courier = {
      id: `courier-${Date.now()}`,
      name: courierDraft.name.trim(),
      phone: courierDraft.phone.trim(),
      vehicle: courierDraft.vehicle.trim() || 'Moto',
      plateNumber: courierDraft.plateNumber.trim() || 'Non renseignée',
      status: 'available'
    };
    const next = [...couriers, newCourier];
    setCouriers(next);
    persist(STORAGE_KEYS.couriers, next, 'Livreur');
    setCourierDraft({ name: '', phone: '', vehicle: '', plateNumber: '' });
    setCourierFormOpen(false);
  };

  const updateCourier = (courierId: string, patch: Partial<Courier>) => {
    const next = couriers.map((courier) => courier.id === courierId ? { ...courier, ...patch } : courier);
    setCouriers(next);
    persist(STORAGE_KEYS.couriers, next, 'Livreurs');
  };

  const removeCourier = (courierId: string) => {
    const next = couriers.filter((courier) => courier.id !== courierId);
    setCouriers(next);
    persist(STORAGE_KEYS.couriers, next, 'Livreurs');
  };

  const addStaffAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedUsername = accountDraft.username.trim().toLocaleLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedUsername);
    if (!accountDraft.name.trim() || !isEmail) {
      setNotice('Renseigne le nom complet et une adresse e-mail valide.');
      return;
    }
    if (accountDraft.password.length < 8) {
      setNotice('Le mot de passe provisoire doit contenir au moins 8 caractères.');
      return;
    }
    if (accountDraft.role === 'courier' && !accountDraft.phone.trim()) {
      setNotice('Ajoute le téléphone du livreur pour créer son profil de course.');
      return;
    }
    if (accounts.some((account) => account.username.toLocaleLowerCase() === normalizedUsername)) {
      setNotice('Cette adresse e-mail est déjà utilisée.');
      return;
    }
    if (normalizedUsername === DEMO_ADMIN_ACCOUNT.email || DEMO_STAFF_ACCOUNTS.some((account) => account.username === normalizedUsername)) {
      setNotice('Cette adresse e-mail est réservée à un compte de test intégré au code.');
      return;
    }
    if (!globalThis.crypto?.subtle) {
      setNotice('Le chiffrement sécurisé n’est pas disponible dans ce navigateur.');
      return;
    }

    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accountDraft.password));
      const passwordHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
      const id = `staff-${Date.now()}`;
      const courierId = accountDraft.role === 'courier' ? `courier-${id}` : undefined;
      const account: StaffAccount = {
        id,
        username: normalizedUsername,
        name: accountDraft.name.trim(),
        role: accountDraft.role,
        passwordHash,
        enabled: true,
        courierId
      };
      const nextAccounts = [...accounts, account];
      setAccounts(nextAccounts);
      persist(STORAGE_KEYS.accounts, nextAccounts, 'Compte équipe');
      if (account.role === 'courier' && courierId) {
        const nextCouriers = [...couriers, {
          id: courierId,
          name: account.name,
          phone: accountDraft.phone.trim(),
          vehicle: accountDraft.vehicle.trim() || 'Moto',
          plateNumber: accountDraft.plateNumber.trim() || 'Non renseignée',
          status: 'available' as CourierStatus
        }];
        setCouriers(nextCouriers);
        localStorage.setItem(STORAGE_KEYS.couriers, JSON.stringify(nextCouriers));
      }
      setAccountDraft({ name: '', username: '', role: 'server', password: '', phone: '', vehicle: '', plateNumber: '' });
      setAccountFormOpen(false);
    } catch (error) {
      console.error('Unable to create staff account:', error);
      setNotice('Impossible de créer le compte équipe.');
    }
  };

  const updateStaffAccount = (accountId: string, patch: Partial<StaffAccount>) => {
    const next = accounts.map((account) => account.id === accountId ? { ...account, ...patch } : account);
    setAccounts(next);
    persist(STORAGE_KEYS.accounts, next, 'Compte équipe');
  };

  const removeStaffAccount = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId);
    const nextAccounts = accounts.filter((item) => item.id !== accountId);
    setAccounts(nextAccounts);
    persist(STORAGE_KEYS.accounts, nextAccounts, 'Compte équipe');
    if (account?.courierId) {
      const nextCouriers = couriers.filter((courier) => courier.id !== account.courierId);
      setCouriers(nextCouriers);
      persist(STORAGE_KEYS.couriers, nextCouriers, 'Livreur');
    }
  };

  const updateStock = (stockId: string, patch: Partial<StockItem>) => {
    const next = stock.map((item) => item.id === stockId ? { ...item, ...patch } : item);
    setStock(next);
    persist(STORAGE_KEYS.stock, next, 'Stock');
  };

  const addStockItem = (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(stockDraft.quantity);
    const minimum = Number(stockDraft.minimum);
    if (!stockDraft.name.trim() || !stockDraft.unit.trim() || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(minimum) || minimum < 0) return;
    const next = [...stock, {
      id: `stock-${Date.now()}`,
      name: stockDraft.name.trim(),
      unit: stockDraft.unit.trim(),
      quantity,
      minimum
    }];
    setStock(next);
    persist(STORAGE_KEYS.stock, next, 'Stock');
    setStockDraft({ name: '', unit: '', quantity: '', minimum: '' });
    setStockFormOpen(false);
  };

  const addCashEntry = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(cashDraft.amount);
    if (!cashDraft.label.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const nextEntry: CashEntry = {
      id: `cash-${Date.now()}`,
      type: cashDraft.type,
      label: cashDraft.label.trim(),
      amount,
      createdAt: new Date().toISOString()
    };
    const next = [nextEntry, ...cashEntries];
    setCashEntries(next);
    persist(STORAGE_KEYS.cash, next, cashDraft.type === 'income' ? 'Recette' : 'Dépense');
    setCashDraft({ type: 'expense', label: '', amount: '' });
    setCashFormOpen(false);
  };

  const removeCashEntry = (entryId: string) => {
    const next = cashEntries.filter((entry) => entry.id !== entryId);
    setCashEntries(next);
    persist(STORAGE_KEYS.cash, next, 'Caisse');
  };

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#171411] px-4 py-10 text-stone-900">
        <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE9E4] text-[#A83218]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div className="mt-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C83818]">Chez OSI</p>
            <h1 className="mt-2 text-2xl font-extrabold">Connexion admin</h1>
            <p className="mt-2 text-sm text-stone-500">Connecte-toi avec le compte administrateur de test.</p>
          </div>
          <form onSubmit={(event) => void authenticate(event)} className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-stone-700">
              Adresse e-mail
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-stone-200 px-4 text-base outline-none focus:border-[#C83818] focus:ring-2 focus:ring-[#C83818]/15"
              />
            </label>
            <label className="block text-sm font-bold text-stone-700">
              Mot de passe
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-stone-200 px-4 pr-12 text-base outline-none focus:border-[#C83818] focus:ring-2 focus:ring-[#C83818]/15"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-500 hover:text-stone-800">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>
            {authError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{authError}</p>}
            <button type="submit" disabled={isAuthenticating} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C83818] font-bold text-white transition-colors hover:bg-[#A92E13] disabled:cursor-wait disabled:opacity-60">
              <LockKeyhole className="h-4 w-4" />
              {isAuthenticating ? 'Vérification…' : 'Accéder à l’administration'}
            </button>
            <p className="text-center text-xs text-stone-500">Compte de démonstration temporaire. Les identifiants sont intégrés au frontend.</p>
          </form>
        </section>
      </main>
    );
  }

  const renderOrderCard = (order: Order) => (
    <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-stone-900">{order.id}</h3>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
            }`}>{STATUS_LABELS[order.status]}</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {order.createdAtIso ? new Date(order.createdAtIso).toLocaleString('fr-FR') : order.createdAt}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-lg font-extrabold text-[#C83818]">{formatFCFA(order.total)}</div>
          <div className="text-xs text-stone-500">{order.customer.paymentMethod === 'fedapay' ? 'FedaPay · payé en ligne' : 'Paiement à confirmer'}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <div className="font-bold text-stone-900">{order.customer.fullName}</div>
          <a className="text-[#A83218] underline-offset-2 hover:underline" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
          <div className="text-stone-600">{order.customer.deliveryType === 'delivery' ? order.customer.address : 'Retrait physique'}</div>
        </div>
        <div className="space-y-1 text-sm text-stone-600">
          {order.items.map((item) => (
            <div key={item.cartId} className="flex justify-between gap-3">
              <span>{item.quantity} × {item.menuItem.name}{item.variant ? ` · ${item.variant}` : ''}{item.spice ? ` · ${item.spice.label}` : ''}</span>
              <span className="shrink-0 font-semibold">{formatFCFA(item.totalPrice)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-stone-100 pt-1">
            <span>Livraison</span><span>{formatFCFA(order.deliveryFee)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-stone-100 pt-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-[11px] font-semibold text-stone-500">
          État de la commande
          <select
            value={order.status}
            onChange={(event) => updateOrder(order.id, { status: event.target.value as OrderStatus })}
            className="mt-1 block h-10 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm text-stone-800"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {order.customer.deliveryType === 'delivery' && (
          <label className="text-[11px] font-semibold text-stone-500">
            Livreur
            <select
              value={couriers.find((courier) => courier.name === order.driver?.name)?.id || ''}
              onChange={(event) => assignCourier(order, event.target.value)}
              className="mt-1 block h-10 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm text-stone-800"
            >
              <option value="">Non assigné</option>
              {couriers.map((courier) => <option key={courier.id} value={courier.id}>{courier.name} · {courier.phone}</option>)}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => setReceiptOrder(order)}
          className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-lg border border-stone-200 px-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
        >
          <Printer className="h-4 w-4" /> Reçu
        </button>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-stone-900">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #admin-receipt, #admin-receipt * { visibility: visible !important; }
          #admin-receipt { position: absolute; inset: 0 auto auto 0; width: 76mm; padding: 5mm; color: #000; background: #fff; font-family: monospace; }
        }
      `}</style>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-[#171411] px-4 py-6 text-white lg:flex">
          <div className="mb-8 flex items-center gap-3 px-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C83818] font-black tracking-widest">OSI</span>
            <span><span className="block font-bold">Chez OSI</span><span className="text-xs text-stone-400">Gestion</span></span>
          </div>
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setSection(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${section === id ? 'bg-[#C83818] text-white' : 'text-stone-300 hover:bg-white/10'}`}>
                <Icon className="h-4 w-4" />{label}
                {id === 'orders' && activeOrders.length > 0 && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{activeOrders.length}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-4">
            <button type="button" onClick={lockAdmin} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-stone-300 hover:bg-white/10 hover:text-white">
              <LogOut className="h-4 w-4" /> Verrouiller
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-7">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C83818]">Back-office</p>
                  <h1 className="text-xl font-extrabold sm:text-2xl">{SECTIONS.find((item) => item.id === section)?.label}</h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Ouvrir le menu de navigation" aria-expanded={mobileMenuOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
                <span className="text-xs text-stone-500">{new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FCE9E4] text-sm font-extrabold text-[#A83218]">A</span>
              </div>
            </div>
          </header>

          {mobileMenuOpen && <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation admin">
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu" className="absolute inset-0 bg-black/50" />
            <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,20rem)] flex-col bg-[#171411] px-4 py-5 text-white shadow-2xl">
              <div className="mb-7 flex items-center justify-between gap-3 px-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C83818] font-black tracking-widest">OSI</span>
                  <span><span className="block font-bold">Chez OSI</span><span className="text-xs text-stone-400">Gestion</span></span>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu" className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-300 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => { setSection(id); setMobileMenuOpen(false); }}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${section === id ? 'bg-[#C83818] text-white' : 'text-stone-300 hover:bg-white/10'}`}>
                    <Icon className="h-4 w-4 shrink-0" />{label}
                    {id === 'orders' && activeOrders.length > 0 && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{activeOrders.length}</span>}
                  </button>
                ))}
              </nav>
              <div className="mt-auto border-t border-white/10 pt-4">
                <button type="button" onClick={() => { setMobileMenuOpen(false); lockAdmin(); }} className="inline-flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-stone-300 hover:bg-white/10 hover:text-white">
                  <LogOut className="h-4 w-4" /> Verrouiller
                </button>
              </div>
            </aside>
          </div>}

          <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-7 sm:py-7">
            {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}

            {section === 'overview' && (
              <section className="space-y-6">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div><h2 className="text-2xl font-extrabold">Bonjour, admin 👋</h2><p className="mt-1 text-sm text-stone-500">Voici l’activité enregistrée sur cet appareil.</p></div>
                  <button type="button" onClick={() => setSection('orders')} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C83818] px-4 text-sm font-bold text-white hover:bg-[#A92E13]">Ouvrir les commandes <ArrowUpRight className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Commandes du jour', value: String(todayOrders.length), hint: `${activeOrders.length} en cours`, icon: ClipboardList, color: 'text-blue-700 bg-blue-50' },
                    { label: 'Ventes enregistrées', value: formatFCFA(todaySales), hint: 'Commandes confirmées aujourd’hui', icon: Wallet, color: 'text-emerald-700 bg-emerald-50' },
                    { label: 'Livreurs disponibles', value: String(availableCourierCount), hint: `${couriers.length} livreurs au total`, icon: Bike, color: 'text-violet-700 bg-violet-50' },
                    { label: 'Alertes de stock', value: String(lowStockCount), hint: lowStockCount ? 'Articles sous le seuil' : 'Tout est au-dessus du seuil', icon: Boxes, color: lowStockCount ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50' }
                  ].map(({ label, value, hint, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between"><span className="text-xs font-semibold text-stone-500">{label}</span><span className={`rounded-xl p-2 ${color}`}><Icon className="h-4 w-4" /></span></div>
                      <div className="mt-4 text-2xl font-extrabold">{value}</div><div className="mt-1 text-[11px] text-stone-500">{hint}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between"><div><h3 className="font-extrabold">Commandes récentes</h3><p className="text-xs text-stone-500">Dernières commandes locales</p></div><button onClick={() => setSection('orders')} className="text-xs font-bold text-[#A83218]">Tout voir</button></div>
                    {orders.length ? <div className="space-y-2">{[...orders].sort((a, b) => orderTimestamp(b) - orderTimestamp(a)).slice(0, 5).map((order) => (
                      <button key={order.id} onClick={() => setSection('orders')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-stone-50 p-3 text-left hover:bg-stone-100">
                        <span className="min-w-0"><span className="block truncate text-sm font-bold">{order.customer.fullName}</span><span className="text-xs text-stone-500">{order.id} · {STATUS_LABELS[order.status]}</span></span><span className="shrink-0 text-sm font-extrabold">{formatFCFA(order.total)}</span>
                      </button>
                    ))}</div> : <EmptyState title="Aucune commande enregistrée" text="Les commandes créées dans ce navigateur apparaîtront ici." />}
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between"><div><h3 className="font-extrabold">Stocks à surveiller</h3><p className="text-xs text-stone-500">Seuils minimums</p></div><button onClick={() => setSection('stock')} className="text-xs font-bold text-[#A83218]">Gérer</button></div>
                    <div className="space-y-3">{stock.slice(0, 6).map((item) => {
                      const low = item.quantity <= item.minimum;
                      return <div key={item.id} className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{item.name}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${low ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.quantity} {item.unit}{low ? ' · Faible' : ''}</span></div>;
                    })}</div>
                  </div>
                </div>
              </section>
            )}

            {section === 'orders' && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="text-xl font-extrabold">Suivi des commandes</h2><p className="text-sm text-stone-500">{orders.length} commande(s) enregistrée(s)</p></div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, téléphone, numéro..." className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm sm:w-64" /></div>
                    <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value as 'all' | OrderStatus)} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm">
                      <option value="all">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                </div>
                {filteredOrders.length ? <div className="space-y-3">{filteredOrders.map(renderOrderCard)}</div> : <EmptyState title="Aucune commande trouvée" text="Essaie un autre filtre ou enregistre une commande de test sur ce navigateur." />}
              </section>
            )}

            {section === 'couriers' && (
              <section className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-extrabold">Équipe de livraison</h2><p className="text-sm text-stone-500">Coordonnées, véhicules et disponibilités</p></div><button onClick={() => setCourierFormOpen(!courierFormOpen)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C83818] px-4 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Ajouter un livreur</button></div>
                {courierFormOpen && <form onSubmit={addCourier} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
                  <input required value={courierDraft.name} onChange={(event) => setCourierDraft({ ...courierDraft, name: event.target.value })} placeholder="Nom complet" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input required inputMode="tel" value={courierDraft.phone} onChange={(event) => setCourierDraft({ ...courierDraft, phone: event.target.value })} placeholder="Téléphone" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input value={courierDraft.vehicle} onChange={(event) => setCourierDraft({ ...courierDraft, vehicle: event.target.value })} placeholder="Véhicule" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input value={courierDraft.plateNumber} onChange={(event) => setCourierDraft({ ...courierDraft, plateNumber: event.target.value })} placeholder="Immatriculation" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <button className="h-10 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white">Enregistrer</button>
                </form>}
                {couriers.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{couriers.map((courier) => (
                  <article key={courier.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Bike className="h-5 w-5" /></span><button onClick={() => removeCourier(courier.id)} aria-label={`Supprimer ${courier.name}`} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></div>
                    <h3 className="mt-4 font-extrabold">{courier.name}</h3><a href={`tel:${courier.phone}`} className="text-sm text-[#A83218]">{courier.phone}</a><p className="mt-2 text-xs text-stone-500">{courier.vehicle} · {courier.plateNumber}</p>
                    <select value={courier.status} onChange={(event) => updateCourier(courier.id, { status: event.target.value as CourierStatus })} className="mt-4 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm">
                      <option value="available">Disponible</option><option value="busy">En livraison</option><option value="offline">Indisponible</option>
                    </select>
                  </article>
                ))}</div> : <EmptyState title="Aucun livreur ajouté" text="Ajoute ton équipe pour pouvoir l’assigner aux commandes." />}
              </section>
            )}

            {section === 'stock' && (
              <section className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-extrabold">Gestion des stocks</h2><p className="text-sm text-stone-500">Surveille les quantités et tes seuils de réapprovisionnement</p></div><button onClick={() => setStockFormOpen(!stockFormOpen)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C83818] px-4 text-sm font-bold text-white"><PackagePlus className="h-4 w-4" /> Ajouter un article</button></div>
                {stockFormOpen && <form onSubmit={addStockItem} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
                  <input required value={stockDraft.name} onChange={(event) => setStockDraft({ ...stockDraft, name: event.target.value })} placeholder="Article (ex. tomates)" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input required value={stockDraft.unit} onChange={(event) => setStockDraft({ ...stockDraft, unit: event.target.value })} placeholder="Unité (kg, pièces...)" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input required min="0" type="number" value={stockDraft.quantity} onChange={(event) => setStockDraft({ ...stockDraft, quantity: event.target.value })} placeholder="Quantité actuelle" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input required min="0" type="number" value={stockDraft.minimum} onChange={(event) => setStockDraft({ ...stockDraft, minimum: event.target.value })} placeholder="Seuil d’alerte" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <button className="h-10 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white">Enregistrer</button>
                </form>}
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-stone-500 sm:grid-cols-[1.5fr_1fr_1fr_1fr]"><span>Article</span><span>En stock</span><span className="hidden sm:block">Seuil d’alerte</span><span className="hidden text-right sm:block">État</span></div>
                  {stock.map((item) => {
                    const low = item.quantity <= item.minimum;
                    return <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-stone-100 px-4 py-3 last:border-0 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
                      <span className="font-semibold">{item.name}</span>
                      <label className="flex items-center gap-2"><input aria-label={`Quantité ${item.name}`} min="0" type="number" value={item.quantity} onChange={(event) => updateStock(item.id, { quantity: Math.max(0, Number(event.target.value)) })} className="h-9 w-20 rounded-lg border border-stone-200 px-2 text-sm" /><span className="text-xs text-stone-500">{item.unit}</span></label>
                      <label className="hidden items-center gap-2 sm:flex"><input aria-label={`Seuil ${item.name}`} min="0" type="number" value={item.minimum} onChange={(event) => updateStock(item.id, { minimum: Math.max(0, Number(event.target.value)) })} className="h-9 w-20 rounded-lg border border-stone-200 px-2 text-sm" /><span className="text-xs text-stone-500">{item.unit}</span></label>
                      <span className={`hidden justify-self-end rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${low ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{low ? 'À réapprovisionner' : 'Disponible'}</span>
                      <span className={`text-right text-[11px] font-bold sm:hidden ${low ? 'text-rose-700' : 'text-emerald-700'}`}>{low ? 'Stock faible' : 'OK'}</span>
                    </div>;
                  })}
                </div>
              </section>
            )}

            {section === 'cash' && (
              <section className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-extrabold">Caisse & reçus</h2><p className="text-sm text-stone-500">Recettes, dépenses et impressions de reçus</p></div><button onClick={() => setCashFormOpen(!cashFormOpen)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C83818] px-4 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Nouvelle opération</button></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <CashSummary title="Ventes du jour" value={formatFCFA(todaySales)} icon={<ArrowUpRight className="h-4 w-4" />} />
                  <CashSummary title="Frais de livraison" value={formatFCFA(todayDeliveryFees)} icon={<Bike className="h-4 w-4" />} />
                  <CashSummary title="Solde des opérations caisse" value={formatFCFA(cashBalance)} icon={<Wallet className="h-4 w-4" />} />
                </div>
                {cashFormOpen && <form onSubmit={addCashEntry} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_2fr_1fr_auto]">
                  <select value={cashDraft.type} onChange={(event) => setCashDraft({ ...cashDraft, type: event.target.value as CashEntryType })} className="h-10 rounded-lg border border-stone-200 px-3 text-sm"><option value="expense">Dépense</option><option value="income">Recette</option></select>
                  <input required value={cashDraft.label} onChange={(event) => setCashDraft({ ...cashDraft, label: event.target.value })} placeholder="Libellé de l’opération" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input required min="1" type="number" value={cashDraft.amount} onChange={(event) => setCashDraft({ ...cashDraft, amount: event.target.value })} placeholder="Montant FCFA" className="h-10 rounded-lg border border-stone-200 px-3 text-sm" />
                  <button className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white">Enregistrer</button>
                </form>}
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 font-extrabold">Historique de caisse</h3>
                  {cashEntries.length ? <div className="divide-y divide-stone-100">{cashEntries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-2 ${entry.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{entry.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{entry.label}</span><span className="text-xs text-stone-500">{new Date(entry.createdAt).toLocaleString('fr-FR')}</span></span></div>
                    <div className="flex shrink-0 items-center gap-2"><span className={`text-sm font-extrabold ${entry.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{entry.type === 'income' ? '+' : '−'}{formatFCFA(entry.amount)}</span><button onClick={() => removeCashEntry(entry.id)} aria-label="Supprimer l’opération" className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></div>
                  </div>)}</div> : <EmptyState title="Aucune opération saisie" text="Ajoute une recette ou une dépense pour suivre la caisse." />}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-extrabold">Reçus de commande</h3><p className="text-xs text-stone-500">Imprime un reçu client au format ticket</p></div><Download className="h-5 w-5 text-stone-400" /></div>
                  {orders.length ? <div className="space-y-2">{orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 p-3"><span><span className="block text-sm font-bold">{order.id} · {order.customer.fullName}</span><span className="text-xs text-stone-500">{order.customer.phone} · {formatFCFA(order.total)}</span></span><button onClick={() => setReceiptOrder(order)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-bold"><Printer className="h-4 w-4" /> Imprimer le reçu</button></div>)}</div> : <EmptyState title="Aucun reçu disponible" text="Les reçus apparaîtront avec les commandes locales." />}
                </div>
              </section>
            )}

            {section === 'accounts' && (
              <section className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div><h2 className="text-xl font-extrabold">Comptes individuels de l’équipe</h2><p className="text-sm text-stone-500">Un identifiant et un mot de passe provisoire par personne.</p></div>
                </div>
                <button onClick={() => setAccountFormOpen(!accountFormOpen)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C83818] px-4 text-sm font-bold text-white"><UserPlus className="h-4 w-4" /> Créer un compte</button>
                {accountFormOpen && <form onSubmit={(event) => void addStaffAccount(event)} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3">
                  <input required value={accountDraft.name} onChange={(event) => setAccountDraft({ ...accountDraft, name: event.target.value })} placeholder="Nom complet" className="h-11 rounded-lg border border-stone-200 px-3 text-sm" />
                  <input required type="email" autoComplete="email" maxLength={254} value={accountDraft.username} onChange={(event) => setAccountDraft({ ...accountDraft, username: event.target.value.toLocaleLowerCase() })} placeholder="Adresse e-mail" className="h-11 rounded-lg border border-stone-200 px-3 text-sm" />
                  <select value={accountDraft.role} onChange={(event) => setAccountDraft({ ...accountDraft, role: event.target.value as StaffRole })} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm"><option value="server">Serveur</option><option value="courier">Livreur</option><option value="cashier">Caisse</option></select>
                  <span className="relative block">
                    <input required minLength={8} type={showAccountPassword ? 'text' : 'password'} autoComplete="new-password" value={accountDraft.password} onChange={(event) => setAccountDraft({ ...accountDraft, password: event.target.value })} placeholder="Mot de passe provisoire (8 caractères min.)" className="h-11 w-full rounded-lg border border-stone-200 px-3 pr-11 text-sm" />
                    <button type="button" onClick={() => setShowAccountPassword((visible) => !visible)} aria-label={showAccountPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showAccountPassword} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500 hover:text-stone-800">
                      {showAccountPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                  {accountDraft.role === 'courier' && <>
                    <input required inputMode="tel" value={accountDraft.phone} onChange={(event) => setAccountDraft({ ...accountDraft, phone: event.target.value })} placeholder="Téléphone du livreur" className="h-11 rounded-lg border border-stone-200 px-3 text-sm" />
                    <div className="grid grid-cols-2 gap-2"><input value={accountDraft.vehicle} onChange={(event) => setAccountDraft({ ...accountDraft, vehicle: event.target.value })} placeholder="Véhicule" className="h-11 min-w-0 rounded-lg border border-stone-200 px-3 text-sm" /><input value={accountDraft.plateNumber} onChange={(event) => setAccountDraft({ ...accountDraft, plateNumber: event.target.value })} placeholder="Immatriculation" className="h-11 min-w-0 rounded-lg border border-stone-200 px-3 text-sm" /></div>
                  </>}
                  <button className="h-11 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white">Créer le compte</button>
                </form>}
                <div className="space-y-3">
                  {DEMO_STAFF_ACCOUNTS.map((account) => {
                    const roleLabel = account.role === 'server' ? 'Serveur' : account.role === 'courier' ? 'Livreur' : 'Caisse';
                    return <article key={account.id} className="flex flex-col gap-3 rounded-2xl border border-[#F2C5B8] bg-[#FFF8F5] p-4 shadow-sm sm:flex-row sm:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E4] text-[#A83218]"><Users className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><h3 className="truncate font-extrabold">{account.name}</h3><p className="text-xs text-stone-500">{account.username} · {roleLabel}</p></div>
                      <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">Compte de test · intégré au code</span>
                    </article>;
                  })}
                  {accounts.map((account) => {
                  const roleLabel = account.role === 'server' ? 'Serveur' : account.role === 'courier' ? 'Livreur' : 'Caisse';
                  return <article key={account.id} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E4] text-[#A83218]"><Users className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1"><h3 className="truncate font-extrabold">{account.name}</h3><p className="text-xs text-stone-500">{account.username} · {roleLabel}</p></div>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${account.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{account.enabled ? 'Actif' : 'Désactivé'}</span>
                    <div className="flex gap-2">
                      <button onClick={() => updateStaffAccount(account.id, { enabled: !account.enabled })} className="h-10 rounded-lg border border-stone-200 px-3 text-xs font-bold">{account.enabled ? 'Désactiver' : 'Réactiver'}</button>
                      <button onClick={() => removeStaffAccount(account.id)} aria-label={`Supprimer le compte ${account.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </article>;
                  })}
                </div>
                <p className="rounded-xl bg-stone-100 p-3 text-xs leading-relaxed text-stone-600">Les comptes de test sont inclus dans le frontend et accessibles depuis tout appareil. Les comptes supplémentaires créés ici restent enregistrés uniquement sur cet appareil jusqu’à l’ajout d’une base de données.</p>
              </section>
            )}
          </div>
        </main>
      </div>

      {receiptOrder && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl print:max-w-none print:rounded-none print:p-0 print:shadow-none">
          <div className="mb-4 flex items-center justify-between print:hidden"><h2 className="font-extrabold">Aperçu du reçu</h2><button onClick={() => setReceiptOrder(null)} aria-label="Fermer"><X className="h-5 w-5" /></button></div>
          <div id="admin-receipt" className="mx-auto max-w-[76mm] text-sm text-black">
            <div className="text-center"><div className="text-xl font-black tracking-widest">CHEZ OSI</div><div className="mt-1 text-xs">Reçu de commande</div><div className="my-3 border-t border-dashed border-black" /></div>
            <div className="space-y-1 text-xs"><div>Commande : {receiptOrder.id}</div><div>Date : {receiptOrder.createdAtIso ? new Date(receiptOrder.createdAtIso).toLocaleString('fr-FR') : receiptOrder.createdAt}</div><div>Client : {receiptOrder.customer.fullName}</div><div>Tél. : {receiptOrder.customer.phone}</div><div>Réception : {receiptOrder.customer.deliveryType === 'delivery' ? receiptOrder.customer.address : 'Retrait physique'}</div></div>
            <div className="my-3 border-t border-dashed border-black" />
            <div className="space-y-2 text-xs">{receiptOrder.items.map((item) => <div key={item.cartId} className="flex justify-between gap-2"><span>{item.quantity} × {item.menuItem.name}{item.variant ? ` (${item.variant})` : ''}</span><span>{formatFCFA(item.totalPrice)}</span></div>)}</div>
            <div className="my-3 border-t border-dashed border-black" />
            <div className="space-y-1 text-xs"><div className="flex justify-between"><span>Sous-total</span><span>{formatFCFA(receiptOrder.subtotal)}</span></div><div className="flex justify-between"><span>Livraison</span><span>{formatFCFA(receiptOrder.deliveryFee)}</span></div><div className="flex justify-between pt-1 text-sm font-black"><span>TOTAL</span><span>{formatFCFA(receiptOrder.total)}</span></div></div>
            <div className="mt-4 border-t border-dashed border-black pt-3 text-center text-[10px]">Merci pour votre commande !<br />Chez OSI · Gbegnigan</div>
          </div>
          <button onClick={() => window.print()} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C83818] font-bold text-white print:hidden"><Printer className="h-4 w-4" /> Imprimer le reçu</button>
        </div>
      </div>}
    </div>
  );
};

const EmptyState: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <span className="mb-3 rounded-2xl bg-stone-100 p-3 text-stone-500"><Store className="h-6 w-6" /></span>
    <h3 className="font-bold">{title}</h3><p className="mt-1 max-w-sm text-xs text-stone-500">{text}</p>
  </div>
);

const CashSummary: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-stone-500"><span>{title}</span><span className="rounded-lg bg-stone-100 p-2 text-stone-700">{icon}</span></div><div className="mt-3 text-xl font-extrabold">{value}</div></div>
);
