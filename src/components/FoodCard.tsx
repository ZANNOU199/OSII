import React from 'react';
import { MenuItem } from '../types';
import { formatFCFA } from '../data/menu';
import { ArrowRight, Plus } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
  onQuickAdd: (item: MenuItem) => void;
  onCustomize: (item: MenuItem) => void;
  isInCart: boolean;
  index?: number;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onQuickAdd,
  onCustomize,
  isInCart,
  index = 0
}) => {
  const isChawarma = item.category === 'chawarma';
  const floatClass = index % 2 === 0 ? 'animate-float-a' : 'animate-float-b';
  const glowColor = isChawarma ? 'bg-[#C83818]/30' : 'bg-[#E07A1F]/25';

  return (
    <div
      className={`food-card-scene relative group cursor-pointer [perspective:1000px] ${floatClass}`}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        event.currentTarget.style.setProperty('--pointer-x', `${x * 100}%`);
        event.currentTarget.style.setProperty('--pointer-y', `${y * 100}%`);
        event.currentTarget.style.setProperty('--rotate-x', `${(0.5 - y) * 12}deg`);
        event.currentTarget.style.setProperty('--rotate-y', `${(x - 0.5) * 14}deg`);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty('--pointer-x', '50%');
        event.currentTarget.style.setProperty('--pointer-y', '50%');
        event.currentTarget.style.setProperty('--rotate-x', '0deg');
        event.currentTarget.style.setProperty('--rotate-y', '0deg');
      }}
    >
      {/* Dynamic warm aura glow that pulses behind the floating photo */}
      <div 
        className={`food-card-aura absolute -inset-5 ${glowColor} rounded-[3rem] blur-2xl animate-pulse-glow -z-10 transition-opacity group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-x-5 top-3 bottom-[-12px] rounded-[2rem] sm:rounded-[2.5rem] ${isChawarma ? 'bg-[#C83818]/25' : 'bg-[#E07A1F]/25'} rotate-[4deg] shadow-[0_25px_55px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:rotate-[7deg] group-hover:translate-y-2`}
        aria-hidden="true"
      />

      {/* Main Floating Photo Showcase: No traditional card box, just the living photo */}
      <div 
        onClick={() => {
          if (item.customizable) {
            onCustomize(item);
          } else {
            onQuickAdd(item);
          }
        }}
        className="food-card-surface relative transform-gpu rounded-[2rem] sm:rounded-[2.5rem] border border-[#F3C8A2]/30 bg-[#1A100C] shadow-[0_28px_65px_rgba(0,0,0,0.55)] transition-[transform,box-shadow,border-color] duration-300 group-hover:border-[#F3C8A2]/60 group-hover:shadow-[0_38px_85px_rgba(200,56,24,0.38)]"
      >
        {/* High-Definition Culinary Photography */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(2rem-1px)] sm:aspect-[16/11] sm:rounded-[calc(2.5rem-1px)]">
          <img
            src={item.image}
            alt={item.name}
            className="food-card-image h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            loading="eager"
            referrerPolicy="no-referrer"
          />

          {/* Measured cinematic gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/90 via-[#1C1917]/25 to-transparent pointer-events-none" />

          <div className="food-card-glare pointer-events-none absolute inset-0 z-10 rounded-[inherit]" aria-hidden="true" />

          {/* Top-Right Price Tag */}
          <div className="food-card-price absolute top-4 right-4 px-4 py-1.5 rounded-full bg-[#0A0605]/90 backdrop-blur-md text-white text-xs sm:text-sm font-extrabold tnum shadow-lg border border-[#F3C8A2]/30">
            {formatFCFA(item.price)}
          </div>

          {/* Overlay Dish Content and Direct Call-to-Action */}
          <div className="food-card-content absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white space-y-3">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm group-hover:text-[#FF9238] transition-colors">
                {item.name}
              </h2>
            </div>

            {/* Order action */}
            <div className="pt-1">
              {item.customizable ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomize(item);
                  }}
                  aria-label={`${isInCart ? 'Ajouter au panier' : 'Commander'} ${item.name} — ${formatFCFA(item.price)}`}
                  className="group/order flex h-[52px] w-full cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-[#FFB276]/50 bg-gradient-to-r from-[#F16A3C] via-[#D64624] to-[#A92E13] px-3 text-xs font-extrabold text-white shadow-[0_8px_24px_rgba(200,56,24,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] transition-[filter,box-shadow] duration-150 ease-out hover:brightness-110 hover:shadow-[0_12px_30px_rgba(240,106,60,0.55),0_0_0_2px_rgba(255,178,118,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD0A8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A100C] active:brightness-95 sm:gap-3 sm:px-6 sm:text-sm"
                >
                  <span className="flex shrink-0 items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition-transform duration-200 group-hover/order:rotate-[-8deg] group-hover/order:scale-105 sm:h-8 sm:w-8">
                      <Plus className="h-4 w-4" />
                    </span>
                  </span>
                  <span className="order-label min-w-0 flex-1 text-center text-xs tracking-normal sm:text-base sm:tracking-wide lg:text-lg">
                    {isInCart ? 'Ajouter au panier' : 'Commander'}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] sm:gap-2 sm:text-sm">
                    <span className="whitespace-nowrap font-extrabold tnum">{formatFCFA(item.price)}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/order:translate-x-1 sm:h-4 sm:w-4" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAdd(item);
                  }}
                  className="w-full h-[50px] px-3 sm:px-6 rounded-full bg-[#C83818] hover:bg-[#A92E13] active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-[#C83818]/40 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="truncate">Ajouter au panier</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[10px] font-extrabold tnum sm:text-sm">{formatFCFA(item.price)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
