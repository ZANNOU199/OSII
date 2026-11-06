import React from 'react';
import { Flame, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1C1917] text-[#FCF9F5] border-t border-[#33302D] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-2xl font-extrabold tracking-[0.16em] text-[#C83818]">
                OSI
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              L'institution de la street-food raffinée à Godomey. Chawarmas généreusement braisés au charbon de bois d'acacia et dèguè artisanal de mil au lait frais.
            </p>
            <div className="text-xs text-[#FF9238] font-semibold">
              Godomey PK 10, République du Bénin · Ouvert 7j/7 de 11h à 01h
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2.5 text-xs">
            <div className="font-bold uppercase tracking-wider text-stone-200">
              Navigation
            </div>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onNavigate('chawarma')}
                  className="hover:text-[#FF9238] transition-colors cursor-pointer"
                >
                  Chawarma
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('degue')}
                  className="hover:text-[#FF9238] transition-colors cursor-pointer"
                >
                  Dèguè Mil/Couscous
                </button>
              </li>
            </ul>
          </div>

          {/* Payment & Trust */}
          <div className="md:col-span-4 space-y-3 text-xs">
            <div className="font-bold uppercase tracking-wider text-stone-200">
              Moyens de Règlement Acceptés
            </div>
            <p className="text-stone-400 leading-relaxed">
              Réglez en toute sérénité à la commande ou à la livraison :
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-medium">
                MTN Mobile Money
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-medium">
                Moov Money
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-medium">
                Celtiis Cash
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-medium">
                Espèces à la livraison
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} Chez Osi Gourmet Béninois. Tous droits réservés.
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <span>Préparé avec fierté et passion à Godomey, Bénin</span>
            <Heart className="w-3.5 h-3.5 text-[#C83818] fill-[#C83818]" />
          </div>
        </div>
      </div>
    </footer>
  );
};
