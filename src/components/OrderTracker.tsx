import React from 'react';
import { Order, OrderStatus } from '../types';
import { formatFCFA } from '../data/menu';
import { 
  Check, 
  Flame, 
  Clock, 
  Phone, 
  MapPin, 
  Bike, 
  Store, 
  ArrowLeft, 
  RotateCw, 
  Sparkles,
  Receipt
} from 'lucide-react';

interface OrderTrackerProps {
  order: Order | null;
  onAdvanceStatus: () => void;
  onBackToMenu: () => void;
}

const STEPS = [
  { id: 'received', title: 'Commande reçue', subtitle: 'Ticket imprimé au comptoir de Godomey' },
  { id: 'preparing', title: 'En préparation à Godomey', subtitle: 'Pain garni & épices fraîches dosées' },
  { id: 'braising', title: 'Chawarma au feu / Dèguè frais prêt', subtitle: 'Braisage sur charbon de bois ardent' },
  { id: 'delivering', title: 'En route / Prêt pour retrait', subtitle: 'Livreur en route vers votre adresse' },
  { id: 'delivered', title: 'Commande Livrée / Servie', subtitle: 'Bon appétit et merci de votre confiance !' }
];

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  order,
  onAdvanceStatus,
  onBackToMenu
}) => {
  if (!order) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-[#F4EFE6] text-[#8E7069] flex items-center justify-center mx-auto">
          <Receipt className="w-8 h-8 opacity-60" />
        </div>
        <h2 className="font-syne text-2xl font-bold text-[#1E1B19]">
          Aucune commande active
        </h2>
        <p className="text-sm text-[#5A413B]">
          Passez une commande pour suivre en direct la cuisson sur les braises et le départ de votre livreur.
        </p>
        <button
          onClick={onBackToMenu}
          className="h-[52px] px-8 rounded-full bg-[#C83818] text-white font-bold text-sm hover:bg-[#A92E13] transition-colors"
        >
          Voir la carte
        </button>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#5A413B] hover:text-[#C83818] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la carte</span>
        </button>

        {/* Live Simulation Trigger */}
        <button
          onClick={onAdvanceStatus}
          className="px-4 py-2 rounded-full bg-[#F4EFE6] hover:bg-[#E8DFD1] text-xs font-bold text-[#1E1B19] border border-[#E8DFD1] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          title="Faire avancer l'étape de cuisson / livraison"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#C83818]" />
          <span>Simuler étape suivante</span>
        </button>
      </div>

      {/* Main Status Hero Banner */}
      <div className="bg-white rounded-2xl border border-[#E8DFD1] p-6 sm:p-8 shadow-xl shadow-stone-900/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8DFD1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#C83818] tracking-wider uppercase">
                Commande {order.id}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-[#5A413B]">Passée à {order.createdAt}</span>
            </div>
            <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-[#1E1B19] mt-1">
              {STEPS[currentStepIndex]?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-[#FCF9F5] p-3 rounded-xl border border-[#E8DFD1]">
            <div className="w-10 h-10 rounded-full bg-[#E07A1F]/15 flex items-center justify-center text-[#E07A1F]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#5A413B] uppercase tracking-wider">
                Délai estimé
              </div>
              <div className="font-syne text-lg font-extrabold text-[#1E1B19] tnum">
                {order.status === 'delivered' ? 'Livré !' : order.estimatedDeliveryTime}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Visual multi-step progress bar styled with warm terracotta milestones */}
        <div className="py-4">
          <div className="relative">
            {/* Background connecting track */}
            <div className="absolute top-5 left-6 right-6 h-1 bg-[#E8DFD1] -z-0" />
            
            {/* Active filled connecting track */}
            <div 
              className="absolute top-5 left-6 h-1 bg-[#15803D] transition-all duration-500 -z-0"
              style={{
                width: `${Math.min(100, (currentStepIndex / (STEPS.length - 2)) * 100)}%`
              }}
            />

            {/* 4 Milestones */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              {STEPS.slice(0, 4).map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
                    {/* Circle Indicator */}
                    <div className="flex items-center justify-center">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-full bg-[#15803D] text-white flex items-center justify-center shadow-md transition-all">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      ) : isActive ? (
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[#E07A1F] text-white flex items-center justify-center shadow-lg shadow-[#E07A1F]/30 ring-4 ring-[#FF9238]/30 animate-pulse transition-all">
                            <Flame className="w-5 h-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-[#E8DFD1] text-[#8E7069] flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className={`text-xs font-bold leading-tight ${
                        isActive ? 'text-[#C83818]' : isCompleted ? 'text-[#15803D]' : 'text-[#8E7069]'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-[11px] text-[#5A413B] hidden sm:block mt-0.5 leading-snug">
                        {step.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Delivery or Pickup Information Box */}
        {order.customer.deliveryType === 'delivery' && order.driver && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white border border-[#E8DFD1] flex items-center justify-center text-2xl shadow-sm shrink-0">
                {order.driver.avatar}
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#944A00] uppercase tracking-wider">
                  Votre Livreur Osi Express
                </div>
                <div className="font-bold text-sm text-[#1E1B19]">
                  {order.driver.name} · <span className="text-xs font-normal text-[#5A413B]">{order.driver.vehicle}</span>
                </div>
                <div className="text-xs text-[#5A413B]">
                  Plaque : <span className="font-semibold text-[#1E1B19]">{order.driver.plateNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.driver.phone}`}
                className="h-10 px-4 rounded-full bg-white border border-[#E8DFD1] hover:border-[#C83818] text-[#1E1B19] text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Appeler {order.driver.name.split(' ')[0]}</span>
              </a>
            </div>
          </div>
        )}

        {order.customer.deliveryType === 'pickup' && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-white text-[#C83818] border border-[#E8DFD1] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E1B19]">
                Retrait au comptoir Godomey PK 10
              </div>
              <div className="text-xs text-[#5A413B]">
                Présentez votre numéro de commande <strong className="text-[#C83818]">{order.id}</strong> à l'accueil dès l'alerte prête.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket & Summary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Delivery destination details */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-[#E8DFD1] p-5 sm:p-6 space-y-4">
          <h3 className="font-syne text-base font-bold text-[#1E1B19] pb-3 border-b border-[#E8DFD1]">
            Détails du Destinataire
          </h3>
          <div className="space-y-3 text-xs text-[#5A413B]">
            <div>
              <span className="font-bold text-[#1E1B19] block">Nom du client :</span>
              <span>{order.customer.fullName}</span>
            </div>
            <div>
              <span className="font-bold text-[#1E1B19] block">Téléphone de contact :</span>
              <span>+229 {order.customer.phone}</span>
            </div>
            <div>
              <span className="font-bold text-[#1E1B19] block">Adresse de réception :</span>
              <span className="text-[#1E1B19] font-medium">{order.customer.address}</span>
            </div>
            <div>
              <span className="font-bold text-[#1E1B19] block">Moyen de règlement :</span>
              <span className="capitalize">
                {order.customer.paymentMethod === 'fedapay' ? 'FedaPay (Mobile Money)' :
                 order.customer.paymentMethod === 'momo_mtn' ? 'MTN Mobile Money' :
                 order.customer.paymentMethod === 'momo_moov' ? 'Moov Money' :
                 order.customer.paymentMethod === 'celtiis' ? 'Celtiis Cash' : 'Espèces à la livraison'}
              </span>
            </div>
            {order.customer.notes && (
              <div>
                <span className="font-bold text-[#1E1B19] block">Instructions :</span>
                <span className="italic">« {order.customer.notes} »</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ordered Items Receipt */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-[#E8DFD1] p-5 sm:p-6 space-y-4">
          <h3 className="font-syne text-base font-bold text-[#1E1B19] pb-3 border-b border-[#E8DFD1]">
            Ticket de Caisse Récapitulatif
          </h3>

          <div className="space-y-3 divide-y divide-[#E8DFD1]/60">
            {order.items.map((item) => (
              <div key={item.cartId} className="pt-3 first:pt-0 flex justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-[#1E1B19]">
                    {item.quantity}x {item.menuItem.name}
                  </div>
                  <div className="text-[11px] text-[#5A413B] mt-0.5 space-x-1">
                    {item.variant && <span>[{item.variant}]</span>}
                    {item.size && item.size.label !== 'Standard' && <span>[{item.size.label}]</span>}
                    {item.spice && <span>[{item.spice.label}]</span>}
                    {item.extras.length > 0 && <span>[+{item.extras.map(e => e.label).join(', ')}]</span>}
                  </div>
                </div>
                <div className="font-extrabold text-[#1E1B19] tnum shrink-0">
                  {formatFCFA(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E8DFD1] space-y-1.5 text-xs text-[#5A413B]">
            <div className="flex justify-between">
              <span>Sous-total articles</span>
              <span className="font-bold text-[#1E1B19] tnum">{formatFCFA(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frais de livraison</span>
              <span className="font-bold text-[#1E1B19] tnum">
                {order.deliveryFee === 0 ? 'Gratuit' : formatFCFA(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E8DFD1] text-base font-bold text-[#1E1B19]">
              <span>Total Réglé</span>
              <span className="font-syne text-lg text-[#C83818] font-extrabold tnum">
                {formatFCFA(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
