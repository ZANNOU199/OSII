import React from 'react';
import { Flame, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';

export const StorySection: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-white border-y border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6] text-xs font-bold text-[#C83818] uppercase tracking-wider">
            <Flame className="w-4 h-4 text-[#C83818]" />
            <span>L'Âme de Chez Osi</span>
          </div>
          <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-[#1E1B19] tracking-tight">
            La noblesse du feu de braise et le secret du mil authentique
          </h2>
          <p className="text-base text-[#5A413B] leading-relaxed">
            Né sur les grands axes de Godomey, Chez Osi est le fruit d'une passion inconditionnelle pour la cuisine de rue béninoise élevée au rang d'art gastronomique.
          </p>
        </div>

        {/* Story Grid 1: The Charcoal Braise */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-[#E8DFD1] shadow-xl">
            <img
              src="/src/assets/images/craft_godomey_embers_1793866675169.jpg"
              alt="Braises incandescentes et grillades Chez Osi à Godomey"
              className="w-full h-80 sm:h-96 object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-bold text-white bg-[#C83818] px-3 py-1 rounded-full">
                Charbon d'acacia & marinades artisanales
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5 text-left">
            <h3 className="font-syne text-2xl font-bold text-[#1E1B19]">
              1. Le Feu des Braises Vivantes
            </h3>
            <p className="text-sm text-[#5A413B] leading-relaxed">
              Chez nous, aucun chawarma n'est réchauffé sur une simple plaque électrique. Nos broches tournent devant de véritables braises de bois incandescentes. Cette cuisson lente et fumante saisit les viandes à l'extérieur tout en préservant leur jus savoureux.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C83818]/10 text-[#C83818] flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E1B19]">Épices de Grand-Popo & Pobè</div>
                  <div className="text-xs text-[#5A413B]">Piments doux torréfiés, gingembre sauvage et graines d'aframomum pilées au mortier.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E07A1F]/10 text-[#E07A1F] flex items-center justify-center shrink-0 mt-0.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E1B19]">Pain artisanal toasté à la commande</div>
                  <div className="text-xs text-[#5A413B]">Galette fine et croustillante, roulée selon la tradition pour un croquant parfait.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Grid 2: The Art of Dèguè */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5 text-left order-2 lg:order-1">
            <h3 className="font-syne text-2xl font-bold text-[#1E1B19]">
              2. Le Dèguè Pur Terroir : La Douceur Légendaire
            </h3>
            <p className="text-sm text-[#5A413B] leading-relaxed">
              Le Dèguè est le cœur réconfortant du Bénin. Chaque matin avant l'aube, notre équipe prépare les perles de couscous de mil de l'Atacora cuites à la vapeur dans de grands couscoussiers traditionnels, avant de les mêler à un yaourt entier soyeux et du lait crémeux parfumé à la vanille bourbon.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E07A1F]/10 text-[#E07A1F] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E1B19]">Mil 100% béninois sans conservateurs</div>
                  <div className="text-xs text-[#5A413B]">Grains fermes et fondants en bouche, riches en fer et fibres naturelles.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E1B19]">Hygiène & Chaîne du Froid Strictes</div>
                  <div className="text-xs text-[#5A413B]">Conditionné sous scellé alimentaire immédiatement après fabrication.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-[#E8DFD1] shadow-xl order-1 lg:order-2">
            <img
              src="/src/assets/images/product_degue_artisanal_1793866674623.jpg"
              alt="Dèguè Artisanal au yaourt et mil Chez Osi"
              className="w-full h-80 sm:h-96 object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-bold text-white bg-[#E07A1F] px-3 py-1 rounded-full">
                Servi glacé · Fraîcheur quotidienne
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
