import React from 'react';
import { CartItem } from '../types';
import { formatFCFA, NEIGHBORHOODS } from '../data/menu';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Bike, Store } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  deliveryType: 'delivery' | 'pickup';
  onSetDeliveryType: (type: 'delivery' | 'pickup') => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (name: string) => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  deliveryType,
  onSetDeliveryType,
  selectedNeighborhood,
  onSelectNeighborhood,
  onContinueShopping,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const currentNeighborhood = NEIGHBORHOODS.find(n => n.name === selectedNeighborhood) || NEIGHBORHOODS[0];
  const deliveryFee = deliveryType === 'delivery' ? currentNeighborhood.fee : 0;
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#E8DFD1] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E8DFD1] bg-[#FCF9F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C83818]/10 text-[#C83818] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-syne text-lg font-bold text-[#1E1B19]">
                Votre Commande
              </h2>
              <span className="text-xs text-[#5A413B]">
                {items.length} {items.length > 1 ? 'articles sélectionnés' : 'article sélectionné'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer le panier"
            className="w-9 h-9 rounded-full bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#1E1B19] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {items.length === 0 ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#F4EFE6] text-[#8E7069] flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 opacity-60" />
            </div>
            <div className="font-syne text-xl font-bold text-[#1E1B19]">
              Votre panier est encore vide
            </div>
            <p className="text-sm text-[#5A413B] max-w-xs">
              Laissez-vous tenter par nos chawarmas dorés à la flamme ou un dèguè traditionnel onctueux !
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 rounded-full bg-[#C83818] text-white font-bold text-sm hover:bg-[#A92E13] transition-colors"
            >
              Parcourir la carte
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Delivery Mode Selector */}
            <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#1E1B19]">
                Mode de réception
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSetDeliveryType('delivery')}
                  className={`h-[48px] px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    deliveryType === 'delivery'
                      ? 'bg-[#C83818] text-white border-[#C83818] shadow-sm'
                      : 'bg-white text-[#1E1B19] border-[#E8DFD1] hover:border-[#8E7069]'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Livraison Moto</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetDeliveryType('pickup')}
                  className={`h-[48px] px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    deliveryType === 'pickup'
                      ? 'bg-[#C83818] text-white border-[#C83818] shadow-sm'
                      : 'bg-white text-[#1E1B19] border-[#E8DFD1] hover:border-[#8E7069]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Retrait physique</span>
                </button>
              </div>

              {deliveryType === 'delivery' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-[#5A413B] block mb-1.5">
                    Sélectionnez votre quartier :
                  </label>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => onSelectNeighborhood(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-white border border-[#E8DFD1] text-xs font-semibold text-[#1E1B19] focus:outline-none focus:border-[#C83818]"
                  >
                    {NEIGHBORHOODS.map(n => (
                      <option key={n.name} value={n.name}>
                        {n.name} (+{formatFCFA(n.fee)} · {n.time})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List of Ordered Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className="p-3.5 rounded-xl border border-[#E8DFD1] bg-[#FCF9F5] flex gap-3.5 relative group"
                >
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#E8DFD1]"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-syne text-sm font-bold text-[#1E1B19] truncate">
                        {item.menuItem.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="text-[#8E7069] hover:text-[#C83818] transition-colors p-1"
                        title="Supprimer l'article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Modifiers line */}
                    <div className="text-[11px] text-[#5A413B] space-y-0.5 mt-1">
                      {item.variant && (
                        <div>• Préparation : <span className="font-semibold">{item.variant}</span></div>
                      )}
                      {item.size && item.size.label !== 'Standard' && (
                        <div>• Format : <span className="font-semibold">{item.size.label}</span></div>
                      )}
                      {item.spice && (
                        <div>• Piment : <span className="font-semibold">{item.spice.label}</span></div>
                      )}
                      {item.sauces.length > 0 && (
                        <div>• Sauces : <span className="font-semibold">{item.sauces.join(', ')}</span></div>
                      )}
                      {item.extras.length > 0 && (
                        <div>• Extras : <span className="font-semibold">{item.extras.map(e => e.label).join(', ')}</span></div>
                      )}
                      {item.instructions && (
                        <div className="italic text-stone-500">• « {item.instructions} »</div>
                      )}
                    </div>

                    {/* Stepper + Subtotal line */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E8DFD1]/60">
                      {/* Quantity Stepper: 44px circular pills */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.cartId, -1)}
                          className="w-8 h-8 rounded-full bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs tnum text-[#1E1B19]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.cartId, 1)}
                          className="w-8 h-8 rounded-full bg-[#F4EFE6] hover:bg-[#C83818] hover:text-white text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="font-extrabold text-sm text-[#C83818] tnum">
                        {formatFCFA(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drawer Sticky Footer with Order Summary & CTA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#FCF9F5] border-t border-[#E8DFD1] space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-[#5A413B]">
              <div className="flex justify-between">
                <span>Sous-total articles</span>
                <span className="font-bold text-[#1E1B19] tnum">{formatFCFA(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {deliveryType === 'delivery' 
                    ? `Frais de livraison (${currentNeighborhood.name})` 
                    : 'Retrait physique'}
                </span>
                <span className="font-bold text-[#1E1B19] tnum">
                  {deliveryFee === 0 ? 'Gratuit' : formatFCFA(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8DFD1] text-sm text-[#1E1B19] font-bold">
                <span>Total à régler</span>
                <span className="font-syne text-base text-[#C83818] font-extrabold tnum">
                  {formatFCFA(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueShopping}
              className="w-full h-10 rounded-full border border-[#E8DFD1] bg-white hover:bg-[#F4EFE6] text-[#5A413B] font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter d’autres articles</span>
            </button>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full h-[52px] rounded-full bg-[#C83818] hover:bg-[#A92E13] active:scale-[0.98] text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#C83818]/25 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Valider le Panier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
