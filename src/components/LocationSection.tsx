import React from 'react';
import { MapPin, Clock, Phone, Bike, MessageCircle, Navigation, Award } from 'lucide-react';
import { NEIGHBORHOODS, formatFCFA } from '../data/menu';

export const LocationSection: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-[#FCF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6] text-xs font-bold text-[#E07A1F] uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-[#C83818]" />
            <span>Retrait & Zone de Livraison</span>
          </div>
          <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-[#1E1B19]">
            Au Cœur de Godomey, Livré Partout
          </h2>
          <p className="text-sm sm:text-base text-[#5A413B]">
            Retrouvez notre grilloir artisanal en bordure de voie principale au PK 10 ou faites-vous livrer encore fumant à domicile ou au bureau.
          </p>
        </div>

        {/* 2-Column Location & Zones Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Location Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8DFD1] p-6 sm:p-8 space-y-6 shadow-xl shadow-stone-900/5">
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#C83818] uppercase tracking-wider">
                Le Restaurant Comptoir
              </span>
              <h3 className="font-syne text-2xl font-bold text-[#1E1B19]">
                Chez Osi Godomey
              </h3>
              <p className="text-xs text-[#5A413B]">
                Godomey PK 10, face Station JNP, Axe Cotonou - Abomey-Calavi, République du Bénin.
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E8DFD1] text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C83818]/10 text-[#C83818] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#1E1B19]">Horaires de Service</div>
                  <div className="text-[#5A413B]">Lundi au Dimanche : 11h00 – 01h00 non-stop</div>
                  <div className="text-[#15803D] font-semibold mt-0.5">Service continu & braises allumées tard la nuit</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#1E1B19]">Lignes Directes Commandes</div>
                  <div className="text-[#5A413B]">+229 97 00 00 00 / +229 66 00 00 00</div>
                  <div className="text-[#8E7069] mt-0.5">Appel vocal & prise de commande prioritaire</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E07A1F]/10 text-[#E07A1F] flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#1E1B19]">Retrait Express au Comptoir</div>
                  <div className="text-[#5A413B]">Prêt en 10 minutes après commande en ligne.</div>
                </div>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/22997000000?text=Bonjour%20Chez%20Osi,%20je%20souhaite%20commander%20un%20chawarma%20brais%C3%A9"
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-[48px] rounded-full bg-[#15803D] hover:bg-[#0E602D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Express</span>
              </a>

              <a
                href="tel:+22997000000"
                className="flex-1 h-[48px] rounded-full bg-white border border-[#E8DFD1] hover:border-[#C83818] text-[#1E1B19] font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4 text-[#C83818]" />
                <span>Appeler le Grill</span>
              </a>
            </div>
          </div>

          {/* Right: Delivery Grid */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DFD1] p-6 sm:p-8 space-y-6 shadow-xl shadow-stone-900/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-[#15803D] uppercase tracking-wider">
                  Couverture Express Moto
                </span>
                <h3 className="font-syne text-xl font-bold text-[#1E1B19]">
                  Zones & Tarifs de Livraison
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#EAF6ED] text-[#15803D] flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-[#5A413B]">
              Nos livreurs dédiés transportent vos chawarmas dans des sacs thermiques isothermes pour garantir une galette croustillante et des braises encore palpables.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NEIGHBORHOODS.map((area) => (
                <div
                  key={area.name}
                  className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E8DFD1] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#1E1B19]">{area.name}</div>
                    <div className="text-[11px] text-[#5A413B] mt-0.5">Délai estimé : {area.time}</div>
                  </div>
                  <div className="font-extrabold text-[#C83818] tnum shrink-0">
                    +{formatFCFA(area.fee)}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] flex items-center gap-3 text-xs text-[#1E1B19]">
              <Navigation className="w-4 h-4 text-[#C83818] shrink-0" />
              <span>
                Votre quartier n'apparaît pas ? Commandez par WhatsApp, nos coursiers couvrent également Ouidah et Sèmè sur réservation !
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
