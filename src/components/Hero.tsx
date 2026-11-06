import React from 'react';
import { Flame, Sparkles, ShieldCheck, ArrowRight, Clock } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
  onExploreDegue: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onExploreDegue }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 lg:py-16 bg-[#FCF9F5]">
      {/* Subtle organic warm background radial glow */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 bg-[#C83818]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 left-10 w-80 h-80 bg-[#E07A1F]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial & Brand copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Terroir & Origin Kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6] border border-[#E8DFD1] text-xs font-bold text-[#944A00]">
              <span className="w-2 h-2 rounded-full bg-[#C83818]" />
              <span>Gastronomie Urbaine Béninoise · Godomey PK 10</span>
            </div>

            {/* Main Headline in Playfair Display luxury serif */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold text-[#1E1B19] leading-[1.14] tracking-tight text-balance">
              Le feu des braises ardentes. <span className="italic font-medium text-[#C83818]">La douceur</span> du dèguè.
            </h1>

            {/* Appetizing French narrative */}
            <p className="text-lg text-[#5A413B] leading-relaxed max-w-2xl font-normal">
              Chez Osi réinvente la street-food béninoise avec l'exigence d'une grande table. 
              Des chawarmas généreux cuits au feu de braise, marinés aux épices de notre terroir, 
              et le traditionnel dèguè au mil perlé préparé chaque matin dans le respect des gestes d'antan.
            </p>

            {/* CTAs matching Component Spec: Primary pill & Secondary pill */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreMenu}
                className="h-[52px] px-8 rounded-full bg-[#C83818] hover:bg-[#A92E13] active:scale-[0.98] text-white font-bold text-base transition-all shadow-lg shadow-[#C83818]/25 flex items-center gap-3 cursor-pointer"
              >
                <span>Commander nos Chawarmas</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreDegue}
                className="h-[52px] px-7 rounded-full bg-white border-[1.5px] border-[#E07A1F] text-[#E07A1F] hover:bg-[#FEF7EE] active:scale-[0.98] font-bold text-base transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#E07A1F]" />
                <span>Découvrir le Dèguè Fait Maison</span>
              </button>
            </div>

            {/* Adjacency Proof Strip (4 pillars) */}
            <div className="pt-6 border-t border-[#E8DFD1] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-[#1E1B19]">
                <div className="w-8 h-8 rounded-full bg-[#C83818]/10 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-[#C83818]" />
                </div>
                <div>
                  <div className="font-bold">Braise au Charbon</div>
                  <div className="text-[#5A413B]">Goût fumé unique</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#1E1B19]">
                <div className="w-8 h-8 rounded-full bg-[#E07A1F]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#E07A1F]" />
                </div>
                <div>
                  <div className="font-bold">Mil & Lait Frais</div>
                  <div className="text-[#5A413B]">Dèguè sans compromis</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#1E1B19] col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-full bg-[#15803D]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#15803D]" />
                </div>
                <div>
                  <div className="font-bold">Livraison Rapide</div>
                  <div className="text-[#5A413B]">Cotonou & Calavi &lt; 35 min</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Card with subtle border and warm ambient shadow */}
              <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E8DFD1] shadow-2xl shadow-stone-900/10 transition-transform duration-300 hover:scale-[1.01]">
                <img
                  src="/src/assets/images/hero_chawarma_braise_1793866673376.jpg"
                  alt="Chawarma Braisé Authentique Chez Osi à Godomey"
                  className="w-full h-[360px] sm:h-[420px] object-cover"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />

                {/* Scrim Overlay for bottom caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/85 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C83818] text-white text-xs font-bold w-fit mb-2 shadow-sm">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Signature Braisée Godomey</span>
                  </div>
                  <h3 className="font-syne text-2xl font-bold leading-snug">
                    Chawarma Bœuf Mariné & Épices Locales
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-xs">
                    <span className="text-stone-200">Pain artisanal croustillant & galette dorée</span>
                    <span className="font-extrabold text-[#FF9238] text-base tnum">2 500 FCFA</span>
                  </div>
                </div>

                {/* Floating trust badge on top right */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E8DFD1] shadow-sm flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                  <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                  <span>Hygiène & Fraîcheur 100%</span>
                </div>
              </div>

              {/* Decorative floating mini card for Dèguè */}
              <div className="hidden sm:flex items-center gap-3 absolute -bottom-6 -left-6 bg-white p-3 rounded-xl border border-[#E8DFD1] shadow-xl max-w-xs animate-bounce-subtle">
                <img
                  src="/src/assets/images/product_degue_artisanal_1793866674623.jpg"
                  alt="Dèguè Artisanal Osi"
                  className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[#E8DFD1]"
                />
                <div>
                  <div className="text-[11px] font-bold text-[#E07A1F] uppercase tracking-wider">
                    Douceur Glacée
                  </div>
                  <div className="text-xs font-bold text-[#1E1B19]">
                    Dèguè Mil & Yaourt Fermier
                  </div>
                  <div className="text-xs font-extrabold text-[#C83818] tnum">
                    Dès 1 200 FCFA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
