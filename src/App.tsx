import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, CartItem, Order, OrderStatus } from './types';
import { MENU_ITEMS, formatFCFA, NEIGHBORHOODS } from './data/menu';
import { Header } from './components/Header';
import { FoodCard } from './components/FoodCard';
import { CustomizerModal } from './components/CustomizerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracker } from './components/OrderTracker';
import { Footer } from './components/Footer';
import { ShoppingBag, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface PendingPaymentDraft {
  transactionId: string;
  verificationToken: string;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    neighborhood: string;
    deliveryType: 'delivery' | 'pickup';
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('chez_osi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [spiceFilterOnly, setSpiceFilterOnly] = useState<boolean>(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Delivery options
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(NEIGHBORHOODS[0].name);

  // Order state (persisted)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('chez_osi_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const paymentReturnHandled = useRef(false);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('chez_osi_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Save active order to local storage
  useEffect(() => {
    try {
      if (currentOrder) {
        localStorage.setItem('chez_osi_active_order', JSON.stringify(currentOrder));
      } else {
        localStorage.removeItem('chez_osi_active_order');
      }
    } catch {
      // ignore
    }
  }, [currentOrder]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleQuickAdd = (item: MenuItem) => {
    const existingIndex = cart.findIndex(
      c => c.menuItem.id === item.id && (!c.extras || c.extras.length === 0) && (!c.instructions)
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].unitPrice * updated[existingIndex].quantity;
      setCart(updated);
    } else {
      const newCartItem: CartItem = {
        cartId: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        sauces: item.options?.sauces?.filter(s => s.default).map(s => s.label) || [],
        extras: [],
        unitPrice: item.price,
        totalPrice: item.price
      };
      setCart([...cart, newCartItem]);
    }

    setIsCartOpen(true);
    showToast(`${item.name} ajouté au panier !`);
  };

  const handleCustomizedAdd = (cartItem: CartItem) => {
    setCart([...cart, cartItem]);
    setIsCartOpen(true);
    showToast(`${cartItem.menuItem.name} personnalisé ajouté !`);
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart(prev => 
      prev
        .map(item => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const handleOrderCreated = (order: Order) => {
    setCurrentOrder(order);
    setCart([]);
    setIsCartOpen(false);
    setIsTrackerOpen(true);
    showToast(`Commande ${order.id} validée ! Cuisson lancée.`);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('fedapay_return') !== '1' || paymentReturnHandled.current) return;
    paymentReturnHandled.current = true;

    const clearPaymentReturn = () => {
      url.searchParams.delete('fedapay_return');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const storedDraft = sessionStorage.getItem('chez_osi_pending_payment');
    if (!storedDraft) {
      clearPaymentReturn();
      setToastMessage('Aucune commande en attente de vérification. Ton panier est conservé.');
      setIsCartOpen(true);
      return;
    }

    let draft: PendingPaymentDraft;
    try {
      draft = JSON.parse(storedDraft) as PendingPaymentDraft;
      if (!draft.transactionId || !draft.verificationToken || !Array.isArray(draft.items)) {
        throw new Error('Données de commande invalides.');
      }
    } catch (error) {
      sessionStorage.removeItem('chez_osi_pending_payment');
      clearPaymentReturn();
      setToastMessage(error instanceof Error ? error.message : 'La commande à vérifier est invalide.');
      setIsCartOpen(true);
      return;
    }

    const verifyPayment = async () => {
      try {
        const query = new URLSearchParams({
          amount: String(draft.total),
          token: draft.verificationToken
        });
        const response = await fetch(`/api/payments/${encodeURIComponent(draft.transactionId)}?${query}`);
        const result = await response.json() as { status?: string; amount?: number; error?: string };
        if (!response.ok) throw new Error(result.error || 'Impossible de vérifier le paiement.');

        sessionStorage.removeItem('chez_osi_pending_payment');
        clearPaymentReturn();
        if (result.status?.toLowerCase() !== 'approved' || result.amount !== draft.total) {
          setToastMessage('Paiement non confirmé. Ton panier est conservé, tu peux réessayer.');
          setIsCartOpen(true);
          return;
        }

        handleOrderCreated({
          id: `#OSI-${draft.transactionId}`,
          status: 'received',
          createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          estimatedDeliveryTime: '30-40 min',
          customer: {
            ...draft.customer,
            paymentMethod: 'fedapay'
          },
          items: draft.items,
          subtotal: draft.subtotal,
          deliveryFee: draft.deliveryFee,
          total: draft.total,
          driver: draft.customer.deliveryType === 'delivery' ? {
            name: 'Koffi Dossou',
            phone: '+229 97 45 12 88',
            vehicle: 'Moto Express Haojue Rouge',
            plateNumber: 'BC 4821 RB (Godomey)',
            avatar: '🛵'
          } : undefined
        });
      } catch (error) {
        setToastMessage(error instanceof Error
          ? `${error.message} Recharge la page pour réessayer la vérification.`
          : 'Impossible de vérifier le paiement. Recharge la page pour réessayer.');
      }
    };

    void verifyPayment();
  }, []);

  const handleAdvanceOrderStatus = () => {
    if (!currentOrder) return;
    const stages: OrderStatus[] = ['received', 'preparing', 'braising', 'delivering', 'delivered'];
    const currentIndex = stages.indexOf(currentOrder.status);
    const nextIndex = (currentIndex + 1) % stages.length;
    const nextStatus = stages[nextIndex];

    const updated: Order = {
      ...currentOrder,
      status: nextStatus
    };
    setCurrentOrder(updated);

    const labels: Record<OrderStatus, string> = {
      received: 'Commande reçue',
      preparing: 'En préparation à Godomey',
      braising: 'Chawarma au feu / Dèguè frais prêt',
      delivering: 'En route / Prêt pour retrait',
      delivered: 'Commande terminée !'
    };
    showToast(`Statut mis à jour : ${labels[nextStatus]}`);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Filter items
  const filteredItems = MENU_ITEMS.filter(item => {
    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Spicy filter
    if (spiceFilterOnly && item.spiceLevel !== 'piquant') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }

    return true;
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0605] text-[#F8F1E7] flex flex-col font-sans selection:bg-[#C83818] selection:text-white pb-20 sm:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 sm:bottom-6 right-6 z-50 bg-[#1C1917] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-slideUp text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-[#FF9238] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header: Pure Single-Page Contract with just Logo OSI and Mon Panier */}
      <Header
        cartCount={totalCartCount}
        cartTotal={totalCartAmount}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab="menu"
        onSelectTab={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeOrderCount={currentOrder ? 1 : 0}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      <main className="relative flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_50%_-10%,rgba(200,73,28,0.2),transparent_44%),radial-gradient(ellipse_at_100%_40%,rgba(224,122,31,0.08),transparent_36%),linear-gradient(180deg,#0A0605_0%,#120B08_55%,#0A0605_100%)]">
        <div className="pointer-events-none absolute -left-24 top-72 h-64 w-64 rounded-full bg-[#C83818]/[0.12] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-[#E07A1F]/[0.14] blur-3xl" aria-hidden="true" />

        <section id="menu-section" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
            {MENU_ITEMS.map((item, idx) => (
              <FoodCard
                key={item.id}
                item={item}
                index={idx}
                isInCart={cart.some((cartItem) => cartItem.menuItem.id === item.id)}
                onQuickAdd={handleQuickAdd}
                onCustomize={(targetItem) => setCustomizingItem(targetItem)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Order Bar on Mobile & Tablet (Level 3 Elevation) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-[#120B08]/95 backdrop-blur-md border-t border-[#70402B]/50 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#C83818] text-white flex items-center justify-center font-bold text-sm shadow-md">
                {totalCartCount}
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#D4BBA8] uppercase tracking-wider">
                  Votre Commande OSI
                </div>
                <div className="font-serif text-base font-extrabold text-[#FCF5EA] tnum">
                  {formatFCFA(totalCartAmount)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="h-[48px] px-6 rounded-full bg-[#C83818] hover:bg-[#A92E13] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#C83818]/25 cursor-pointer active:scale-98 transition-all"
            >
              <span>Voir le Panier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onNavigate={(category) => {
        setSelectedCategory(category);
        scrollToSection('menu-section');
      }} />

      {/* Customizer Modal (Level 2 Sheet) */}
      <CustomizerModal
        item={customizingItem}
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleCustomizedAdd}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        deliveryType={deliveryType}
        onSetDeliveryType={setDeliveryType}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={setSelectedNeighborhood}
        onContinueShopping={() => {
          setIsCartOpen(false);
          scrollToSection('menu-section');
        }}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onBackToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartOpen(true);
        }}
        items={cart}
        deliveryType={deliveryType}
        selectedNeighborhood={selectedNeighborhood}
        onOrderCreated={handleOrderCreated}
      />

      {/* Order Tracker Modal (accessible without leaving the single page) */}
      {isTrackerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#FCF9F5] rounded-3xl border border-[#E8DFD1] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-white border-b border-[#E8DFD1] flex items-center justify-between shrink-0">
              <span className="font-serif text-2xl font-extrabold tracking-widest text-[#C83818]">
                OSI
              </span>
              <button
                onClick={() => setIsTrackerOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#1E1B19] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Fermer le suivi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 sm:p-6">
              <OrderTracker
                order={currentOrder}
                onAdvanceStatus={handleAdvanceOrderStatus}
                onBackToMenu={() => setIsTrackerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
