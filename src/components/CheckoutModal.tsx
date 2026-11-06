import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { formatFCFA, NEIGHBORHOODS } from '../data/menu';
import { X, CheckCircle2, ShieldCheck, Phone, MapPin, User } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  items: CartItem[];
  deliveryType: 'delivery' | 'pickup';
  selectedNeighborhood: string;
  onOrderCreated: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  items,
  deliveryType,
  selectedNeighborhood,
  onOrderCreated
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentNeighborhood = NEIGHBORHOODS.find(n => n.name === selectedNeighborhood) || NEIGHBORHOODS[0];
  const deliveryFee = deliveryType === 'delivery' ? currentNeighborhood.fee : 0;
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!/^\d{8}$/.test(phone)) {
      setError('Veuillez saisir un numéro de téléphone valide de 8 chiffres.');
      return;
    }
    if (deliveryType === 'delivery' && !addressDetails.trim()) {
      setError('Veuillez préciser votre repère ou adresse exacte de livraison.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/payments/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName: fullName.trim(), phone },
          deliveryType,
          neighborhood: selectedNeighborhood,
          address: addressDetails.trim(),
          items: items.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            variant: item.variant,
            spice: item.spice?.id,
            selectedPrice: item.unitPrice
          }))
        })
      });
      const result = await response.json() as {
        error?: string;
        transactionId?: string;
        amount?: number;
        paymentUrl?: string;
        verificationToken?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || 'Impossible de démarrer le paiement FedaPay.');
      }
      if (
        !result.transactionId ||
        !result.verificationToken ||
        typeof result.amount !== 'number' ||
        !result.paymentUrl?.startsWith('https://')
      ) {
        throw new Error('La réponse de paiement est incomplète. Réessaie dans un instant.');
      }

      const draft = {
        transactionId: result.transactionId,
        verificationToken: result.verificationToken,
        customer: {
          fullName: fullName.trim(),
          phone,
          address: deliveryType === 'delivery'
            ? `${selectedNeighborhood} - ${addressDetails.trim()}`
            : 'Retrait physique',
          neighborhood: selectedNeighborhood,
          deliveryType
        },
        items,
        subtotal,
        deliveryFee,
        total: result.amount
      };
      sessionStorage.setItem('chez_osi_pending_payment', JSON.stringify(draft));
      window.location.assign(result.paymentUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Le paiement n’a pas pu être démarré.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl border border-[#E8DFD1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E8DFD1] bg-[#FCF9F5] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C83818] block">
              <button
                type="button"
                onClick={onBackToCart}
                className="mb-1 inline-flex cursor-pointer items-center gap-1 font-extrabold uppercase tracking-wider text-[#C83818] hover:text-[#A92E13]"
              >
                ← Retour au panier
              </button>
            </span>
            <h2 className="font-syne text-xl font-bold text-[#1E1B19]">
              Validation de la Commande
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#1E1B19] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body: conforming to Form & Input Fields spec */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FDE8E4] border border-[#C83818]/30 text-[#C83818] text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C83818]" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Recap Banner */}
          <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#5A413B]">Total à régler :</span>
              <span className="font-syne text-base font-bold text-[#C83818] ml-2 tnum">
                {formatFCFA(total)}
              </span>
            </div>
            <span className="font-bold text-[#15803D] bg-[#EAF6ED] px-2.5 py-1 rounded-full border border-[#15803D]/20">
              {deliveryType === 'delivery' ? `Livraison ${selectedNeighborhood}` : 'Retrait physique'}
            </span>
          </div>

          {/* Input: Nom complet */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold uppercase tracking-[0.02em] text-[#1E1B19] flex items-center gap-2">
              <User className="w-4 h-4 text-[#8E7069]" />
              <span>Nom et Prénoms *</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Jean-Eudes Houndété"
              className="w-full h-[52px] px-4 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] text-[#1E1B19] text-sm placeholder-[#78716C] focus:outline-none focus:border-[#C83818] focus:ring-3 focus:ring-[#C83818]/15 transition-all"
            />
          </div>

          {/* Input: Téléphone Bénin */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold uppercase tracking-[0.02em] text-[#1E1B19] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#8E7069]" />
              <span>Numéro de Téléphone *</span>
            </label>
            <div className="flex gap-2">
              <div className="h-[52px] px-3.5 rounded-xl bg-[#E9E1DD] border border-[#E8DFD1] flex items-center justify-center text-xs font-bold text-[#1E1B19] shrink-0">
                🇧🇯 +229
              </div>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Ex. : 97001234"
                className="flex-1 h-[52px] px-4 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] text-[#1E1B19] text-sm placeholder-[#78716C] focus:outline-none focus:border-[#C83818] focus:ring-3 focus:ring-[#C83818]/15 transition-all"
              />
            </div>
            <p className="text-[11px] text-[#5A413B]">
              Nécessaire pour le livreur et la confirmation SMS/WhatsApp.
            </p>
          </div>

          {/* Input: Adresse / Repère précis (si livraison) */}
          {deliveryType === 'delivery' && (
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold uppercase tracking-[0.02em] text-[#1E1B19] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8E7069]" />
                <span>Repère & Rue de Livraison *</span>
              </label>
              <input
                type="text"
                required
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="Ex: Rue Pavée face pharmacie, Maison portail bleu"
                className="w-full h-[52px] px-4 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] text-[#1E1B19] text-sm placeholder-[#78716C] focus:outline-none focus:border-[#C83818] focus:ring-3 focus:ring-[#C83818]/15 transition-all"
              />
            </div>
          )}

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-xs text-[#15803D] pt-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Paiement sécurisé et garantie fraîcheur Chez Osi Godomey.</span>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[52px] rounded-full bg-[#C83818] hover:bg-[#A92E13] active:scale-[0.98] text-white font-bold text-base transition-all shadow-lg shadow-[#C83818]/25 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span>Transmission en cuisine...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmer la commande • {formatFCFA(total)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
