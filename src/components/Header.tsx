import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatFCFA } from '../data/menu';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeOrderCount?: number;
  onOpenTracker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  activeTab,
  onSelectTab,
  activeOrderCount = 0,
  onOpenTracker
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#70402B]/50 bg-[#0A0605]/90 backdrop-blur-xl transition-all">
      {/* Main Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Retour en haut — Chez OSI"
          className="group shrink-0 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F07838] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0A0605]"
        >
          <span className="flex flex-col items-start gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-[0.16em] text-[#F07838] group-hover:text-[#F3B25F] transition-colors whitespace-nowrap block leading-none">
              OSI
            </span>
            <span className="flex items-center gap-1.5 pl-0.5">
              <span className="w-4 h-px bg-[#E07A1F] transition-all group-hover:w-6" />
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400 group-hover:text-[#F3B25F] transition-colors whitespace-nowrap">
                Chez OSI
              </span>
            </span>
          </span>
        </button>

        {/* Action Zone: Mon Panier & Commande en cours */}
        <div className="flex items-center gap-3 shrink-0">
          {activeOrderCount > 0 && onOpenTracker && (
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#153020] text-[#8FDEA4] text-xs font-bold border border-[#55B978]/25 hover:bg-[#1B402A] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
              <span className="hidden sm:inline">Suivi de commande</span>
              <span className="sm:hidden">Suivi</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            aria-label="Voir mon panier"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-br from-[#E85B32] to-[#BA321B] text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#C83818]/30 font-bold text-sm cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F3B25F] text-[#1C1917] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#C83818]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="whitespace-nowrap">
              {cartCount === 0 ? 'Mon Panier' : formatFCFA(cartTotal)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
