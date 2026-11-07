import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MapPin,
  Phone,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X
} from 'lucide-react';
import { formatFCFA, MENU_ITEMS } from '../data/menu';
import { DEMO_COURIER, DEMO_STAFF_ACCOUNTS } from '../data/demoAccounts';
import { CartItem, MenuItem, Order, OrderStatus } from '../types';

type StaffRole = 'server' | 'courier' | 'cashier';
type StaffSection = 'overview' | 'new-order' | 'history' | 'available' | 'my-deliveries' | 'payments' | 'cash-history';
type CourierStatus = 'available' | 'busy' | 'offline';
type PaymentMethod = 'cash' | 'momo_mtn' | 'momo_moov' | 'celtiis' | 'fedapay';
type StaffPortalProps = { requiredRole?: StaffRole };

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  server: 'Serveur',
  courier: 'Livreur',
  cashier: 'Caisse'
};

const STAFF_ROLE_PATHS: Record<StaffRole, string> = {
  server: '/serveur',
  courier: '/livreur',
  cashier: '/caisse'
};

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

interface CashEntry {
  id: string;
  type: 'income' | 'expense';
  label: string;
  amount: number;
  createdAt: string;
}

interface DraftLine {
  menuItemId: string;
  quantity: number;
  variant: string;
  spice: string;
  selectedPrice: number;
}

const ORDER_KEY = 'chez_osi_orders';
const ACTIVE_ORDER_KEY = 'chez_osi_active_order';
const ACCOUNTS_KEY = 'chez_osi_staff_accounts';
const COURIERS_KEY = 'chez_osi_admin_couriers';
const CASH_KEY = 'chez_osi_admin_cash';
const SESSION_KEY = 'chez_osi_staff_session';
const WALK_IN_COUNTER_KEY = 'chez_osi_walk_in_customer_counter';

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Reçue',
  preparing: 'En préparation',
  braising: 'Prête au comptoir',
  delivering: 'En livraison',
  delivered: 'Terminée'
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  momo_mtn: 'MTN Mobile Money',
  momo_moov: 'Moov Money',
  celtiis: 'Celtiis Cash',
  fedapay: 'FedaPay'
};

const inputClass = 'h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none focus:border-[#C83818] focus:ring-2 focus:ring-[#C83818]/15';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C83818] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#A92E13] disabled:cursor-not-allowed disabled:opacity-50';

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return fallback;
  }
}

function getOrders(): Order[] {
  const orders = readStored<Order[]>(ORDER_KEY, []).map((order) => ({
    ...order,
    paymentStatus: order.paymentStatus || (order.customer.paymentMethod === 'fedapay' ? 'paid' as const : 'pending' as const)
  }));
  const active = readStored<Order | null>(ACTIVE_ORDER_KEY, null);
  const normalizedActive = active ? {
    ...active,
    paymentStatus: active.paymentStatus || (active.customer.paymentMethod === 'fedapay' ? 'paid' as const : 'pending' as const)
  } : null;
  return normalizedActive && !orders.some((order) => order.id === normalizedActive.id)
    ? [normalizedActive, ...orders]
    : orders;
}

function getCouriers(): Courier[] {
  const savedCouriers = readStored<Courier[]>(COURIERS_KEY, []);
  return savedCouriers.some((courier) => courier.id === DEMO_COURIER.id)
    ? savedCouriers
    : [...savedCouriers, DEMO_COURIER];
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
}

function getOrderTime(order: Order): number {
  const timestamp = Date.parse(order.createdAtIso || order.createdAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isToday(order: Order): boolean {
  const timestamp = getOrderTime(order);
  return timestamp > 0 && new Date(timestamp).toDateString() === new Date().toDateString();
}

async function hashPassword(password: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Le chiffrement sécurisé n’est pas disponible dans ce navigateur.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function makeCartItem(item: MenuItem, line: DraftLine): CartItem {
  const variant = item.category === 'degue' ? line.variant : undefined;
  const spiceOption = item.options?.spices?.find((option) => option.id === line.spice);
  const unitPrice = item.category === 'degue' ? line.selectedPrice : item.price;
  return {
    cartId: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    menuItem: item,
    quantity: line.quantity,
    variant,
    spice: spiceOption ? { id: spiceOption.id, label: spiceOption.label } : undefined,
    sauces: [],
    extras: [],
    unitPrice,
    totalPrice: unitPrice * line.quantity
  };
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ requiredRole }) => {
  const [accounts] = useState<StaffAccount[]>(() => readStored(ACCOUNTS_KEY, []));
  const [session, setSession] = useState<Omit<StaffAccount, 'passwordHash' | 'enabled'> | null>(() => {
    const storedSession = readStored<Omit<StaffAccount, 'passwordHash' | 'enabled'> | null>(SESSION_KEY, null);
    return requiredRole && storedSession?.role !== requiredRole ? null : storedSession;
  });
  const [orders, setOrders] = useState<Order[]>(getOrders);
  const [couriers, setCouriers] = useState<Courier[]>(getCouriers);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => readStored(CASH_KEY, []));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<StaffSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [walkInNumber, setWalkInNumber] = useState(() => Math.max(1, readStored<number>(WALK_IN_COUNTER_KEY, 0) + 1));
  const [customer, setCustomer] = useState({
    name: `Client sur place #${String(Math.max(1, readStored<number>(WALK_IN_COUNTER_KEY, 0) + 1)).padStart(3, '0')}`,
    phone: ''
  });
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');

  const role = session?.role;
  const assignedCourier = role === 'courier' && session?.courierId
    ? couriers.find((courier) => courier.id === session.courierId) || (session.courierId === DEMO_COURIER.id ? DEMO_COURIER : undefined)
    : undefined;

  const refreshLocalData = () => {
    setOrders(getOrders());
    setCouriers(getCouriers());
    setCashEntries(readStored(CASH_KEY, []));
  };

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if ([ORDER_KEY, ACTIVE_ORDER_KEY, COURIERS_KEY, CASH_KEY].includes(event.key || '')) refreshLocalData();
    };
    window.addEventListener('storage', sync);
    const intervalId = window.setInterval(refreshLocalData, 2000);
    return () => {
      window.removeEventListener('storage', sync);
      window.clearInterval(intervalId);
    };
  }, []);

  const commitOrders = (nextOrders: Order[]) => {
    try {
      saveOrders(nextOrders);
      setOrders(nextOrders);
      const active = readStored<Order | null>(ACTIVE_ORDER_KEY, null);
      const updatedActive = active && nextOrders.find((order) => order.id === active.id);
      if (updatedActive) localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(updatedActive));
      setNotice('Commande enregistrée.');
      window.setTimeout(() => setNotice(''), 3000);
    } catch (error) {
      console.error('Unable to save orders:', error);
      setNotice('Échec de l’enregistrement de la commande.');
    }
  };

  const commitCouriers = (nextCouriers: Courier[]) => {
    try {
      localStorage.setItem(COURIERS_KEY, JSON.stringify(nextCouriers));
      setCouriers(nextCouriers);
    } catch (error) {
      console.error('Unable to save courier status:', error);
      setNotice('Échec de la mise à jour du profil livreur.');
    }
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      const normalizedUsername = username.trim().toLocaleLowerCase();
      const demoAccount = DEMO_STAFF_ACCOUNTS.find((item) => item.username === normalizedUsername);
      let safeAccount: Omit<StaffAccount, 'passwordHash' | 'enabled'>;
      if (demoAccount) {
        if (demoAccount.password !== password) {
          setAuthError('Adresse e-mail ou mot de passe incorrect.');
          return;
        }
        if (requiredRole && demoAccount.role !== requiredRole) {
          setAuthError(`Ce compte n’est pas un compte ${STAFF_ROLE_LABELS[requiredRole].toLocaleLowerCase()}. Utilise l’espace ${STAFF_ROLE_PATHS[demoAccount.role]}.`);
          return;
        }
        safeAccount = {
          id: demoAccount.id,
          username: demoAccount.username,
          name: demoAccount.name,
          role: demoAccount.role,
          courierId: 'courierId' in demoAccount ? demoAccount.courierId : undefined
        };
      } else {
        const account = accounts.find((item) => item.username.toLocaleLowerCase() === normalizedUsername && item.enabled);
        const enteredHash = await hashPassword(password);
        if (!account || account.passwordHash !== enteredHash) {
          setAuthError('Adresse e-mail ou mot de passe incorrect, ou compte désactivé.');
          return;
        }
        if (requiredRole && account.role !== requiredRole) {
          setAuthError(`Ce compte n’est pas un compte ${STAFF_ROLE_LABELS[requiredRole].toLocaleLowerCase()}. Utilise l’espace ${STAFF_ROLE_PATHS[account.role]}.`);
          return;
        }
        safeAccount = {
          id: account.id,
          username: account.username,
          name: account.name,
          role: account.role,
          courierId: account.courierId
        };
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeAccount));
      setSession(safeAccount);
      setPassword('');
      refreshLocalData();
    } catch (error) {
      console.error('Unable to sign in staff account:', error);
      setAuthError(error instanceof Error ? error.message : 'La connexion a échoué.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setMobileMenuOpen(false);
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPassword('');
  };

  const updateOrder = (orderId: string, patch: Partial<Order>) => {
    commitOrders(orders.map((order) => order.id === orderId ? { ...order, ...patch } : order));
  };

  const availableOrders = useMemo(() => [...orders]
    .filter((order) => order.customer.deliveryType === 'delivery' && !order.courierId && !order.driver && order.status !== 'delivered')
    .sort((left, right) => getOrderTime(left) - getOrderTime(right)), [orders]);
  const myDeliveries = useMemo(() => orders
    .filter((order) => order.courierId === session?.courierId && order.status !== 'delivered')
    .sort((left, right) => getOrderTime(left) - getOrderTime(right)), [orders, session?.courierId]);
  const pendingPayments = useMemo(() => [...orders]
    .filter((order) => order.paymentStatus !== 'paid')
    .sort((left, right) => getOrderTime(left) - getOrderTime(right)), [orders]);
  const completedDeliveries = useMemo(() => orders.filter((order) =>
    order.courierId === session?.courierId && order.status === 'delivered'
  ).sort((left, right) => getOrderTime(right) - getOrderTime(left)), [orders, session?.courierId]);
  const todayOrders = orders.filter(isToday);
  const myOrders = orders.filter((order) =>
    order.createdById === session?.id || (!order.createdById && order.createdBy === session?.name)
  );
  const myTodayOrders = myOrders.filter(isToday);
  const myTodaySales = myTodayOrders.reduce((sum, order) => sum + order.total, 0);
  const myTodayItems = myTodayOrders.reduce((sum, order) =>
    sum + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
  );
  const myTodayPaid = myTodayOrders.filter((order) => order.paymentStatus === 'paid');
  const myTodayPaidTotal = myTodayPaid.reduce((sum, order) => sum + order.total, 0);
  const todayPaidOrders = todayOrders.filter((order) => order.paymentStatus === 'paid');
  const todayPaidTotal = todayPaidOrders.reduce((sum, order) => sum + order.total, 0);
  const todayCashEntries = cashEntries.filter((entry) => new Date(entry.createdAt).toDateString() === new Date().toDateString());
  const todayCashNet = todayCashEntries.reduce((sum, entry) =>
    sum + (entry.type === 'income' ? entry.amount : -entry.amount), 0
  );
  const todayCashCollections = todayCashEntries
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const todayCourierDeliveries = completedDeliveries.filter(isToday);
  const todayCourierFees = todayCourierDeliveries.reduce((sum, order) => sum + order.deliveryFee, 0);

  const navigation: { id: StaffSection; label: string; icon: React.ElementType; count?: number }[] = role === 'server'
    ? [
      { id: 'overview', label: 'Vue générale', icon: LayoutDashboard },
      { id: 'new-order', label: 'Nouvelle commande', icon: Plus },
      { id: 'history', label: 'Historique', icon: History }
    ]
    : role === 'courier'
      ? [
        { id: 'overview', label: 'Vue générale', icon: LayoutDashboard },
        { id: 'available', label: 'Courses disponibles', icon: ShoppingBag, count: availableOrders.length },
        { id: 'my-deliveries', label: 'Mes livraisons', icon: Bike, count: myDeliveries.length },
        { id: 'history', label: 'Historique', icon: History }
      ]
      : [
        { id: 'overview', label: 'Vue générale', icon: LayoutDashboard },
        { id: 'payments', label: 'À encaisser', icon: Receipt, count: pendingPayments.length },
        { id: 'history', label: 'Historique', icon: History },
        { id: 'cash-history', label: 'Journal de caisse', icon: Wallet }
      ];

  const addOrderLine = (menuItemId: string) => {
    const menuItem = MENU_ITEMS.find((item) => item.id === menuItemId);
    if (!menuItem) return;
    setDraftLines((current) => [...current, {
      menuItemId,
      quantity: 1,
      variant: 'Mil',
      spice: 'pimente',
      selectedPrice: menuItem.price
    }]);
  };

  const updateDraftLine = (index: number, patch: Partial<DraftLine>) => {
    setDraftLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const draftItems = draftLines.flatMap((line) => {
    const item = MENU_ITEMS.find((entry) => entry.id === line.menuItemId);
    return item && line.quantity > 0 ? [makeCartItem(item, line)] : [];
  });
  const deliveryFee = 0;
  const subtotal = draftItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const createOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if ((customer.phone && !/^\d{8}$/.test(customer.phone)) || !draftItems.length) {
      setNotice('Vérifie le numéro (8 chiffres maximum) et ajoute au moins un article.');
      return;
    }
    const now = new Date();
    const customerName = customer.name.trim() || `Client sur place #${String(walkInNumber).padStart(3, '0')}`;
    const order: Order = {
      id: `#OSI-${Date.now().toString().slice(-8)}`,
      status: 'received',
      createdAt: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      createdAtIso: now.toISOString(),
      createdBy: session?.name,
      createdById: session?.id,
      estimatedDeliveryTime: 'À retirer au comptoir',
      customer: {
        fullName: customerName,
        phone: customer.phone,
        address: 'Commande sur place',
        neighborhood: 'Gbegnigan',
        deliveryType: 'pickup',
        paymentMethod
      },
      items: draftItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      paymentStatus: paymentMethod === 'fedapay' ? 'paid' : 'pending',
      paymentReceivedAt: paymentMethod === 'fedapay' ? new Date().toISOString() : undefined
    };
    const nextWalkInNumber = walkInNumber + 1;
    try {
      localStorage.setItem(WALK_IN_COUNTER_KEY, String(walkInNumber));
    } catch (error) {
      console.error('Unable to save walk-in customer counter:', error);
    }
    setWalkInNumber(nextWalkInNumber);
    setCustomer({
      name: `Client sur place #${String(nextWalkInNumber).padStart(3, '0')}`,
      phone: ''
    });
    commitOrders([order, ...orders]);
    setDraftLines([]);
    setReceiptOrder(order);
  };

  const claimOrder = (order: Order) => {
    if (!session?.courierId || !assignedCourier || assignedCourier.status === 'offline') {
      setNotice('Ton profil livreur est indisponible. Contacte la caisse.');
      return;
    }
    const currentOrders = getOrders();
    const currentOrder = currentOrders.find((item) => item.id === order.id);
    if (!currentOrder || currentOrder.courierId || currentOrder.driver) {
      refreshLocalData();
      setNotice('Cette commande vient d’être attribuée à un autre livreur.');
      return;
    }
    const claimedOrder: Order = {
      ...currentOrder,
      courierId: session.courierId,
      driver: {
        name: assignedCourier.name,
        phone: assignedCourier.phone,
        vehicle: assignedCourier.vehicle,
        plateNumber: assignedCourier.plateNumber,
        avatar: '🛵'
      }
    };
    commitOrders(currentOrders.map((item) => item.id === order.id ? claimedOrder : item));
    commitCouriers(couriers.map((courier) => courier.id === session.courierId ? { ...courier, status: 'busy' } : courier));
  };

  const advanceDelivery = (order: Order) => {
    const nextStatus: OrderStatus = order.status === 'delivering' ? 'delivered' : 'delivering';
    updateOrder(order.id, { status: nextStatus });
    if (nextStatus === 'delivered' && session?.courierId) {
      commitCouriers(couriers.map((courier) => courier.id === session.courierId ? { ...courier, status: 'available' } : courier));
    }
  };

  const recordPayment = (order: Order) => {
    const updatedOrder: Order = {
      ...order,
      paymentStatus: 'paid',
      paymentReceivedAt: new Date().toISOString(),
      customer: { ...order.customer, paymentMethod }
    };
    updateOrder(order.id, { paymentStatus: 'paid', paymentReceivedAt: updatedOrder.paymentReceivedAt, customer: updatedOrder.customer });
    if (paymentMethod !== 'fedapay') {
      const entries = readStored<CashEntry[]>(CASH_KEY, []);
      const nextEntries: CashEntry[] = [{
        id: `receipt-${order.id}-${Date.now()}`,
        type: 'income',
        label: `Commande ${order.id} · ${PAYMENT_LABELS[paymentMethod]}`,
        amount: order.total,
        createdAt: updatedOrder.paymentReceivedAt!
      }, ...entries];
      try {
        localStorage.setItem(CASH_KEY, JSON.stringify(nextEntries));
        setCashEntries(nextEntries);
      } catch (error) {
        console.error('Unable to record payment in cash ledger:', error);
        setNotice('Paiement marqué, mais la caisse n’a pas pu être enregistrée.');
      }
    }
    setReceiptOrder(updatedOrder);
  };

  const searchableOrders = orders.filter((order) => {
    const value = search.trim().toLocaleLowerCase();
    return !value || [order.id, order.customer.fullName, order.customer.phone, order.customer.address]
      .some((field) => field.toLocaleLowerCase().includes(value));
  });

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#171411] px-4 py-10 text-stone-900">
        <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE9E4] text-[#A83218]"><ShoppingBag className="h-7 w-7" /></div>
          <div className="mt-5 text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C83818]">Chez OSI</p><h1 className="mt-2 text-2xl font-extrabold">{requiredRole ? `Espace ${STAFF_ROLE_LABELS[requiredRole].toLocaleLowerCase()}` : 'Espace équipe'}</h1><p className="mt-2 text-sm text-stone-500">Connecte-toi avec le compte fourni par l’administration.</p></div>
          <form onSubmit={(event) => void signIn(event)} className="mt-6 space-y-4">
            <label className="block text-sm font-bold">Adresse e-mail<input required type="email" autoComplete="email" value={username} onChange={(event) => setUsername(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
            <label className="block text-sm font-bold">Mot de passe<span className="relative mt-1.5 block"><input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-12`} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-500 hover:text-stone-800">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
            {authError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{authError}</p>}
            <button type="submit" disabled={isLoading} className={`${buttonClass} w-full`}>{isLoading ? 'Connexion…' : 'Se connecter'}</button>
            <p className="text-center text-xs text-stone-500">Compte de démonstration temporaire. Les identifiants sont intégrés au frontend ; les commandes restent locales à cet appareil.</p>
          </form>
        </section>
      </main>
    );
  }

  const sectionTitles: Record<StaffSection, string> = {
    overview: 'Vue générale',
    'new-order': 'Nouvelle commande',
    history: 'Historique',
    available: 'Courses disponibles',
    'my-deliveries': 'Mes livraisons',
    payments: 'À encaisser',
    'cash-history': 'Journal de caisse'
  };
  const roleTitle = role === 'server' ? 'Serveur' : role === 'courier' ? 'Livreur' : 'Caisse';
  const title = sectionTitles[activeSection];
  const orderCard = (order: Order, mode: 'server' | 'courier' | 'cashier' | 'preview') => (
    <article key={order.id} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{order.id}</h3><span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700">{STATUS_LABELS[order.status]}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{order.paymentStatus === 'paid' ? 'Payée' : 'À encaisser'}</span></div><p className="mt-1 text-xs text-stone-500">{order.createdAtIso ? new Date(order.createdAtIso).toLocaleString('fr-FR') : order.createdAt} · {order.createdBy || 'Commande du site'}</p></div>
        <div className="text-lg font-extrabold text-[#C83818]">{formatFCFA(order.total)}</div>
      </div>
      <div className="grid gap-3 border-t border-stone-100 pt-3 sm:grid-cols-2">
        <div className="space-y-1 text-sm"><div className="font-bold">{order.customer.fullName}</div>{order.customer.phone && <a href={`tel:${order.customer.phone}`} className="inline-flex items-center gap-1 text-[#A83218]"><Phone className="h-3.5 w-3.5" />{order.customer.phone}</a>}<div className="flex items-start gap-1 text-stone-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{order.customer.address}</div></div>
        <div className="space-y-1 text-sm text-stone-700">{order.items.map((item) => <div key={item.cartId} className="flex justify-between gap-2"><span>{item.quantity} × {item.menuItem.name}{item.variant ? ` · ${item.variant}` : ''}{item.spice ? ` · ${item.spice.label}` : ''}</span><span className="shrink-0">{formatFCFA(item.totalPrice)}</span></div>)}<div className="flex justify-between border-t border-stone-100 pt-1"><span>Livraison</span><span>{formatFCFA(order.deliveryFee)}</span></div></div>
      </div>
      {mode === 'courier' && <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        {order.status !== 'delivering' && <button onClick={() => advanceDelivery(order)} className={buttonClass}>Prendre en charge</button>}
        {order.status === 'delivering' && <button onClick={() => advanceDelivery(order)} className={`${buttonClass} bg-emerald-700 hover:bg-emerald-800`}><CheckCircle2 className="h-4 w-4" /> Confirmer la livraison</button>}
        <a href={`tel:${order.customer.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-bold"><Phone className="h-4 w-4" /> Appeler le client</a>
      </div>}
      {mode === 'cashier' && order.paymentStatus !== 'paid' && <div className="grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-[1fr_auto]">
        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className={inputClass}><option value="cash">Espèces</option><option value="momo_mtn">MTN Mobile Money</option><option value="momo_moov">Moov Money</option><option value="celtiis">Celtiis Cash</option></select>
        <button onClick={() => recordPayment(order)} className={buttonClass}><Wallet className="h-4 w-4" /> Confirmer le paiement</button>
      </div>}
      {(mode === 'server' || mode === 'cashier') && <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        {mode === 'server' && <select value={order.status} onChange={(event) => updateOrder(order.id, { status: event.target.value as OrderStatus })} className="h-11 min-w-40 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold"><option value="received">Reçue</option><option value="preparing">En préparation</option><option value="braising">Prête au comptoir</option><option value="delivering">En livraison</option><option value="delivered">Terminée</option></select>}
        <button onClick={() => setReceiptOrder(order)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-bold"><Printer className="h-4 w-4" /> {mode === 'server' ? 'Imprimer le reçu' : 'Voir le reçu'}</button>
      </div>}
    </article>
  );

  return (
    <main className="min-h-screen bg-[#F6F5F2] text-stone-900 lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col bg-[#171411] px-4 py-6 text-white lg:flex">
        <div className="mb-9 flex items-center gap-3 px-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C83818] font-black tracking-widest">OSI</span>
          <span><span className="block font-bold">Chez OSI</span><span className="text-xs text-stone-400">Espace {roleTitle.toLocaleLowerCase()}</span></span>
        </div>
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-bold">{session.name}</p><p className="truncate text-xs text-stone-400">{roleTitle} · {session.username}</p>
        </div>
        <nav className="space-y-1">
          {navigation.map(({ id, label, icon: Icon, count }) => (
            <button key={id} type="button" onClick={() => setActiveSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${activeSection === id ? 'bg-[#C83818] text-white' : 'text-stone-300 hover:bg-white/10'}`}>
              <Icon className="h-4 w-4" /><span className="flex-1">{label}</span>{count !== undefined && count > 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <button onClick={signOut} className="inline-flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-300 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-widest text-[#C83818]">Chez OSI · {roleTitle}</p><h1 className="truncate text-lg font-extrabold sm:text-xl">{title}</h1><p className="truncate text-xs text-stone-500 lg:hidden">{session.name} · {session.username}</p></div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-medium text-stone-500 sm:inline">{new Date().toLocaleDateString('fr-FR', { dateStyle: 'medium' })}</span>
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Ouvrir le menu de navigation" aria-expanded={mobileMenuOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 lg:hidden"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de l’espace équipe">
        <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu" className="absolute inset-0 bg-black/50" />
        <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,20rem)] flex-col bg-[#171411] px-4 py-5 text-white shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-3 px-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C83818] font-black tracking-widest">OSI</span>
              <span className="min-w-0"><span className="block font-bold">Chez OSI · {roleTitle}</span><span className="block truncate text-xs text-stone-400">{session.name} · {session.username}</span></span>
            </div>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-300 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
          <nav className="space-y-1">
            {navigation.map(({ id, label, icon: Icon, count }) => (
              <button key={id} type="button" onClick={() => { setActiveSection(id); setMobileMenuOpen(false); }} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${activeSection === id ? 'bg-[#C83818] text-white' : 'text-stone-300 hover:bg-white/10'}`}>
                <Icon className="h-4 w-4 shrink-0" /><span className="flex-1">{label}</span>{count !== undefined && count > 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{count}</span>}
              </button>
            ))}
          </nav>
          <button onClick={signOut} className="mt-auto inline-flex min-h-12 w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 pt-4 text-left text-sm font-semibold text-stone-300 hover:text-white"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </aside>
      </div>}

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

        {role === 'server' && activeSection === 'overview' && <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-[#C83818]">Votre activité aujourd’hui</p><h2 className="mt-1 text-2xl font-extrabold">Bonsoir, {session.name.split(' ')[0]}</h2><p className="mt-1 text-sm text-stone-500">Suivez vos commandes et vos ventes de la journée.</p></div><button onClick={() => setActiveSection('new-order')} className={buttonClass}><Plus className="h-4 w-4" /> Nouvelle commande</button></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Commandes aujourd’hui" value={String(myTodayOrders.length)} icon={<ClipboardList className="h-4 w-4" />} />
            <MetricCard title="Articles vendus" value={String(myTodayItems)} icon={<ShoppingBag className="h-4 w-4" />} />
            <MetricCard title="Montant des ventes" value={formatFCFA(myTodaySales)} icon={<TrendingUp className="h-4 w-4" />} />
            <MetricCard title="Payé aujourd’hui" value={formatFCFA(myTodayPaidTotal)} icon={<Wallet className="h-4 w-4" />} />
          </div>
          <section className="space-y-3"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Dernières commandes</h2><p className="text-xs text-stone-500">Tes 5 commandes les plus récentes</p></div><button onClick={() => setActiveSection('history')} className="text-sm font-bold text-[#A83218]">Voir l’historique</button></div>{myOrders.length ? [...myOrders].sort((a, b) => getOrderTime(b) - getOrderTime(a)).slice(0, 5).map((order) => orderCard(order, 'server')) : <EmptyState title="Aucune commande enregistrée" text="Crée une commande pour commencer à suivre ton activité." />}</section>
        </section>}

        {role === 'server' && activeSection === 'history' && <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-extrabold">Historique de mes commandes</h2><p className="text-sm text-stone-500">{myOrders.length} commande(s) · ventes totales : {formatFCFA(myOrders.reduce((sum, order) => sum + order.total, 0))}</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, téléphone, numéro..." className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm sm:w-72" /></div></div>
          <div className="grid gap-3 sm:grid-cols-3"><MetricCard title="Commandes aujourd’hui" value={String(myTodayOrders.length)} icon={<ClipboardList className="h-4 w-4" />} /><MetricCard title="Articles vendus aujourd’hui" value={String(myTodayItems)} icon={<ShoppingBag className="h-4 w-4" />} /><MetricCard title="Ventes aujourd’hui" value={formatFCFA(myTodaySales)} icon={<Wallet className="h-4 w-4" />} /></div>
          <div className="space-y-3">{myOrders.filter((order) => searchableOrders.some((match) => match.id === order.id)).sort((a, b) => getOrderTime(b) - getOrderTime(a)).map((order) => orderCard(order, 'server'))}</div>
        </section>}

        {role === 'server' && activeSection === 'new-order' && <section className="space-y-4">
          <div><h2 className="text-xl font-extrabold">Nouvelle commande sur place</h2><p className="text-sm text-stone-500">Commande prise au restaurant · aucun frais ni renseignement de livraison.</p></div>
          <form onSubmit={createOrder} className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-stone-600">Nom ou numéro du client<input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder={`Client sur place #${String(walkInNumber).padStart(3, '0')}`} className={`${inputClass} mt-1.5`} /></label>
              <label className="text-xs font-bold text-stone-600">Téléphone (facultatif)<input inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="8 chiffres, si nécessaire" className={`${inputClass} mt-1.5`} /></label>
            </div>

            <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="font-extrabold">Articles</h3>
              {draftLines.map((line, index) => {
                const item = MENU_ITEMS.find((menuItem) => menuItem.id === line.menuItemId);
                if (!item) return null;
                return <div key={`${line.menuItemId}-${index}`} className="grid gap-2 rounded-xl bg-stone-50 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="font-bold">{item.name}</div>
                  {item.category === 'degue' && <div className="grid grid-cols-2 gap-2 sm:col-span-2"><select value={line.variant} onChange={(event) => updateDraftLine(index, { variant: event.target.value })} className="h-10 rounded-lg border border-stone-200 bg-white px-2 text-xs"><option>Mil</option><option>Couscous</option><option>Mélangé</option></select><select value={line.selectedPrice} onChange={(event) => updateDraftLine(index, { selectedPrice: Number(event.target.value) })} className="h-10 rounded-lg border border-stone-200 bg-white px-2 text-xs"><option value={300}>300 FCFA</option><option value={500}>500 FCFA</option></select></div>}
                  {item.category === 'chawarma' && <select value={line.spice} onChange={(event) => updateDraftLine(index, { spice: event.target.value })} className="h-10 rounded-lg border border-stone-200 bg-white px-2 text-xs"><option value="pimente">Pimenté</option><option value="non_pimente">Non pimenté</option></select>}
                  <div className="flex items-center gap-2"><label className="text-xs text-stone-500">Qté <input type="number" min="1" max="50" value={line.quantity} onChange={(event) => updateDraftLine(index, { quantity: Math.max(1, Number(event.target.value)) })} className="h-10 w-16 rounded-lg border border-stone-200 px-2 text-sm" /></label><button type="button" onClick={() => setDraftLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-xs font-bold text-rose-700">Retirer</button></div>
                </div>;
              })}
              <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row">
                <select value={selectedMenuItemId} onChange={(event) => setSelectedMenuItemId(event.target.value)} className="h-10 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm">
                  <option value="">Choisir un article</option>
                  {MENU_ITEMS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button type="button" disabled={!selectedMenuItemId} onClick={() => addOrderLine(selectedMenuItemId)} className={`${buttonClass} justify-center disabled:cursor-not-allowed disabled:opacity-50`}><Plus className="h-4 w-4" /> Ajouter</button>
              </div>
              {draftItems.length > 0 && <div className="space-y-1 border-t border-stone-100 pt-3 text-sm"><div className="flex justify-between text-base font-extrabold"><span>Total sur place</span><span className="text-[#C83818]">{formatFCFA(subtotal)}</span></div></div>}
            </div>
            <button disabled={!draftItems.length} className={`${buttonClass} w-full`}><Plus className="h-4 w-4" /> Enregistrer la commande</button>
          </form>
        </section>}

        {role === 'courier' && activeSection === 'overview' && <section className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${assignedCourier?.status === 'offline' ? 'bg-stone-100 text-stone-500' : 'bg-emerald-50 text-emerald-700'}`}><Bike className="h-5 w-5" /></span><div className="flex-1"><h2 className="font-extrabold">{assignedCourier?.name || session.name}</h2><p className="text-xs text-stone-500">{assignedCourier ? `${assignedCourier.vehicle} · ${assignedCourier.plateNumber}` : 'Profil livreur non configuré par l’administration'}</p></div>{assignedCourier && <select value={assignedCourier.status} onChange={(event) => commitCouriers(couriers.map((courier) => courier.id === assignedCourier.id ? { ...courier, status: event.target.value as CourierStatus } : courier))} className="h-10 rounded-lg border border-stone-200 bg-white px-2 text-xs font-bold"><option value="available">Disponible</option><option value="busy">En livraison</option><option value="offline">Indisponible</option></select>}</div></div>
          <div className="grid gap-3 sm:grid-cols-3"><MetricCard title="Courses aujourd’hui" value={String(todayCourierDeliveries.length)} icon={<Bike className="h-4 w-4" />} /><MetricCard title="Courses en cours" value={String(myDeliveries.length)} icon={<Clock3 className="h-4 w-4" />} /><MetricCard title="Livraisons du jour" value={formatFCFA(todayCourierFees)} icon={<Wallet className="h-4 w-4" />} /></div>
          <div className="flex flex-col gap-3 sm:flex-row"><button onClick={() => setActiveSection('available')} className={buttonClass}><ShoppingBag className="h-4 w-4" /> Voir les courses disponibles ({availableOrders.length})</button><button onClick={() => setActiveSection('my-deliveries')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold"><Bike className="h-4 w-4" /> Mes livraisons ({myDeliveries.length})</button></div>
          <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Mes courses récentes</h2><button onClick={() => setActiveSection('history')} className="text-sm font-bold text-[#A83218]">Historique complet</button></div>{completedDeliveries.length ? completedDeliveries.slice(0, 4).map((order) => orderCard(order, 'preview')) : <EmptyState title="Aucune livraison terminée" text="Tes livraisons terminées apparaîtront ici." />}</section>
        </section>}

        {role === 'courier' && activeSection === 'available' && <section className="space-y-3"><div><h2 className="text-xl font-extrabold">Courses disponibles</h2><p className="text-sm text-stone-500">Choisis une livraison à prendre en charge.</p></div>{availableOrders.length ? availableOrders.map((order) => <div key={order.id}>{orderCard(order, 'preview')}<button disabled={!assignedCourier || assignedCourier.status === 'offline'} onClick={() => claimOrder(order)} className={`${buttonClass} mt-2 w-full`}><Bike className="h-4 w-4" /> M’attribuer cette course</button></div>) : <EmptyState title="Aucune course disponible" text="Les nouvelles livraisons apparaîtront ici." />}</section>}

        {role === 'courier' && activeSection === 'my-deliveries' && <section className="space-y-3"><div><h2 className="text-xl font-extrabold">Mes livraisons en cours</h2><p className="text-sm text-stone-500">Les coordonnées client et le suivi de tes courses.</p></div>{myDeliveries.length ? myDeliveries.map((order) => orderCard(order, 'courier')) : <EmptyState title="Aucune livraison attribuée" text="Prends une course disponible pour la voir ici." />}</section>}

        {role === 'courier' && activeSection === 'history' && <section className="space-y-4"><div><h2 className="text-xl font-extrabold">Historique des livraisons</h2><p className="text-sm text-stone-500">{completedDeliveries.length} livraison(s) terminée(s) · aujourd’hui : {todayCourierDeliveries.length} · frais : {formatFCFA(todayCourierFees)}</p></div><div className="grid gap-3 sm:grid-cols-3"><MetricCard title="Total livraisons" value={String(completedDeliveries.length)} icon={<CheckCircle2 className="h-4 w-4" />} /><MetricCard title="Livraisons aujourd’hui" value={String(todayCourierDeliveries.length)} icon={<Bike className="h-4 w-4" />} /><MetricCard title="Frais de livraison aujourd’hui" value={formatFCFA(todayCourierFees)} icon={<Wallet className="h-4 w-4" />} /></div>{completedDeliveries.length ? completedDeliveries.map((order) => orderCard(order, 'preview')) : <EmptyState title="Historique vide" text="Tes livraisons terminées apparaîtront ici." />}</section>}

        {role === 'cashier' && activeSection === 'overview' && <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard title="À encaisser" value={String(pendingPayments.length)} icon={<Receipt className="h-4 w-4" />} />
            <MetricCard title="Montant en attente" value={formatFCFA(pendingPayments.reduce((sum, order) => sum + order.total, 0))} icon={<Wallet className="h-4 w-4" />} />
            <MetricCard title="Encaissé aujourd’hui" value={formatFCFA(todayCashCollections)} icon={<ArrowUpRight className="h-4 w-4" />} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><MetricCard title="Recettes encaissées aujourd’hui" value={formatFCFA(todayCashCollections)} icon={<Wallet className="h-4 w-4" />} /><MetricCard title="Solde net de caisse aujourd’hui" value={formatFCFA(todayCashNet)} icon={<TrendingUp className="h-4 w-4" />} /></div>
          <div className="flex flex-wrap gap-2"><button onClick={() => setActiveSection('payments')} className={buttonClass}><Receipt className="h-4 w-4" /> Encaisser les commandes ({pendingPayments.length})</button><button onClick={() => setActiveSection('history')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold">Voir l’historique</button></div>
          <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Dernières commandes en attente</h2><button onClick={() => setActiveSection('payments')} className="text-sm font-bold text-[#A83218]">Tout voir</button></div>{pendingPayments.length ? pendingPayments.slice(0, 4).map((order) => orderCard(order, 'cashier')) : <EmptyState title="Tout est encaissé" text="Aucun paiement en attente pour le moment." />}</section>
        </section>}

        {role === 'cashier' && activeSection === 'payments' && <section className="space-y-3"><div><h2 className="text-xl font-extrabold">Commandes à encaisser</h2><p className="text-sm text-stone-500">Confirme le règlement reçu, puis imprime le reçu client.</p></div>{pendingPayments.length ? pendingPayments.map((order) => orderCard(order, 'cashier')) : <EmptyState title="Tout est encaissé" text="Aucun paiement en attente pour le moment." />}</section>}

        {role === 'cashier' && activeSection === 'history' && <section className="space-y-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-extrabold">Historique des paiements</h2><p className="text-sm text-stone-500">{todayPaidOrders.length} paiement(s) aujourd’hui · {formatFCFA(todayPaidTotal)} encaissés sur commandes</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, téléphone, numéro..." className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm sm:w-72" /></div></div><div className="grid gap-3 sm:grid-cols-3"><MetricCard title="Commandes payées aujourd’hui" value={String(todayPaidOrders.length)} icon={<Receipt className="h-4 w-4" />} /><MetricCard title="Montant encaissé aujourd’hui" value={formatFCFA(todayPaidTotal)} icon={<Wallet className="h-4 w-4" />} /><MetricCard title="Solde net de caisse" value={formatFCFA(todayCashNet)} icon={<TrendingUp className="h-4 w-4" />} /></div><div className="space-y-3">{searchableOrders.filter((order) => order.paymentStatus === 'paid').sort((a, b) => getOrderTime(b) - getOrderTime(a)).map((order) => orderCard(order, 'cashier'))}</div></section>}

        {role === 'cashier' && activeSection === 'cash-history' && <section className="space-y-4"><div><h2 className="text-xl font-extrabold">Journal de caisse</h2><p className="text-sm text-stone-500">{todayCashEntries.length} opération(s) aujourd’hui · solde net {formatFCFA(todayCashNet)}</p></div><div className="grid gap-3 sm:grid-cols-3"><MetricCard title="Recettes du jour" value={formatFCFA(todayCashCollections)} icon={<ArrowUpRight className="h-4 w-4" />} /><MetricCard title="Dépenses du jour" value={formatFCFA(todayCashEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0))} icon={<ArrowDownRight className="h-4 w-4" />} /><MetricCard title="Solde net" value={formatFCFA(todayCashNet)} icon={<Wallet className="h-4 w-4" />} /></div><div className="space-y-2">{cashEntries.length ? cashEntries.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((entry) => <article key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"><div><div className="font-bold">{entry.label}</div><div className="text-xs text-stone-500">{new Date(entry.createdAt).toLocaleString('fr-FR')}</div></div><div className={`font-extrabold ${entry.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{entry.type === 'income' ? '+' : '−'}{formatFCFA(entry.amount)}</div></article>) : <EmptyState title="Aucune opération enregistrée" text="Les encaissements apparaîtront ici." />}</div></section>}
      </div>
      </div>

      {receiptOrder && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
        <style>{`@media print { body * { visibility: hidden !important; } #team-receipt, #team-receipt * { visibility: visible !important; } #team-receipt { position: absolute; inset: 0 auto auto 0; width: 76mm; padding: 5mm; color: #000; background: #fff; font-family: monospace; } }`}</style>
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl print:max-w-none print:p-0 print:shadow-none"><div className="mb-4 flex items-center justify-between print:hidden"><h2 className="font-extrabold">Reçu</h2><button onClick={() => setReceiptOrder(null)} aria-label="Fermer"><span className="text-xl">×</span></button></div>
          <div id="team-receipt" className="mx-auto max-w-[76mm] text-sm text-black"><div className="text-center"><div className="text-xl font-black tracking-widest">CHEZ OSI</div><div className="text-xs">Reçu de commande</div></div><div className="my-3 border-t border-dashed border-black" /><div className="space-y-1 text-xs"><div>Commande : {receiptOrder.id}</div><div>Date : {receiptOrder.createdAtIso ? new Date(receiptOrder.createdAtIso).toLocaleString('fr-FR') : receiptOrder.createdAt}</div><div>Serveur : {receiptOrder.createdBy || 'Commande web'}</div><div>Client : {receiptOrder.customer.fullName}</div>{receiptOrder.customer.phone && <div>Tél. : {receiptOrder.customer.phone}</div>}<div>{receiptOrder.customer.address}</div></div><div className="my-3 border-t border-dashed border-black" /><div className="space-y-1 text-xs">{receiptOrder.items.map((item) => <div key={item.cartId} className="flex justify-between gap-2"><span>{item.quantity} × {item.menuItem.name}{item.variant ? ` (${item.variant})` : ''}{item.spice ? ` (${item.spice.label})` : ''}</span><span>{formatFCFA(item.totalPrice)}</span></div>)}</div><div className="my-3 border-t border-dashed border-black" /><div className="space-y-1 text-xs">{receiptOrder.deliveryFee > 0 && <div className="flex justify-between"><span>Livraison</span><span>{formatFCFA(receiptOrder.deliveryFee)}</span></div>}<div className="flex justify-between text-sm font-black"><span>TOTAL</span><span>{formatFCFA(receiptOrder.total)}</span></div><div>Règlement : {receiptOrder.paymentStatus === 'paid' ? PAYMENT_LABELS[receiptOrder.customer.paymentMethod] : 'En attente'}</div></div><div className="mt-4 border-t border-dashed border-black pt-3 text-center text-[10px]">Merci pour votre commande !<br />Chez OSI · Gbegnigan</div></div>
          <button onClick={() => window.print()} className={`${buttonClass} mt-5 w-full print:hidden`}><Printer className="h-4 w-4" /> Imprimer le reçu</button>
        </div>
      </div>}
    </main>
  );
};

const EmptyState: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-9 text-center"><span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-500"><ClipboardList className="h-5 w-5" /></span><h3 className="font-bold">{title}</h3><p className="mt-1 text-xs text-stone-500">{text}</p></div>
);

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex items-center justify-between text-xs font-semibold text-stone-500"><span>{title}</span><span className="rounded-lg bg-stone-100 p-2 text-stone-700">{icon}</span></div><div className="mt-3 text-xl font-extrabold">{value}</div></div>
);
