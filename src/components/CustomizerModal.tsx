import React, { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatFCFA } from '../data/menu';
import { CartItem, MenuItem, SpiceLevel } from '../types';

interface CustomizerModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [selectedSpice, setSelectedSpice] = useState<SpiceLevel>('pimente');
  const [selectedDeguType, setSelectedDeguType] = useState<'Mil' | 'Couscous' | 'Mélangé'>('Mil');
  const [selectedDeguPrice, setSelectedDeguPrice] = useState(500);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedSpice('pimente');
    setSelectedDeguType('Mil');
    setSelectedDeguPrice(item?.category === 'degue' ? 500 : item?.price ?? 0);
    setQuantity(1);
  }, [item]);

  if (!isOpen || !item) return null;

  const spiceOptions = [
    { id: 'non_pimente' as const, label: 'Non pimenté', description: 'Sans piment' },
    { id: 'pimente' as const, label: 'Pimenté', description: 'Avec piment' }
  ];
  const isDegu = item.category === 'degue';
  const unitPrice = isDegu ? selectedDeguPrice : item.price;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const spice = spiceOptions.find((option) => option.id === selectedSpice) ?? spiceOptions[0];

    onAddToCart({
      cartId: `${item.id}-${Date.now()}`,
      menuItem: item,
      quantity,
      ...(isDegu
        ? { variant: selectedDeguType }
        : { spice: { id: spice.id, label: spice.label } }),
      sauces: [],
      extras: [],
      unitPrice,
      totalPrice
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customizer-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#70402B]/60 bg-[#1A100C] text-[#FCF5EA] shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-40 overflow-hidden sm:h-48">
          <img src={item.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A100C] via-black/25 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 id="customizer-title" className="font-serif text-2xl font-bold">
              {item.name}
            </h2>
          </div>
        </div>

        <div className="space-y-5 bg-[#1A100C] p-5 sm:p-6">
          {isDegu ? (
            <>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#C7B5A7]">Choisis ta préparation</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(['Mil', 'Couscous', 'Mélangé'] as const).map((type) => {
                    const isSelected = selectedDeguType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedDeguType(type)}
                        className="min-h-12 cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200"
                        style={isSelected ? {
                          color: '#fff',
                          borderColor: '#F07838',
                          background: 'linear-gradient(100deg, #9E351D, #682719)',
                          boxShadow: '0 0 0 2px #F07838, 0 0 20px rgba(240,106,60,0.28)'
                        } : {
                          color: '#FCF5EA',
                          borderColor: 'rgba(112,64,43,0.6)',
                          backgroundColor: '#120B08'
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#C7B5A7]">Choisis ton prix</p>
                <div className="grid grid-cols-2 gap-3">
                  {[500, 300].map((price) => {
                    const isSelected = selectedDeguPrice === price;
                    return (
                      <button
                        key={price}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedDeguPrice(price)}
                        className="min-h-12 cursor-pointer rounded-xl border px-4 py-3 text-sm font-extrabold transition-all duration-200"
                        style={isSelected ? {
                          color: '#fff',
                          borderColor: '#F07838',
                          background: 'linear-gradient(100deg, #9E351D, #682719)',
                          boxShadow: '0 0 0 2px #F07838, 0 0 20px rgba(240,106,60,0.28)'
                        } : {
                          color: '#FCF5EA',
                          borderColor: 'rgba(112,64,43,0.6)',
                          backgroundColor: '#120B08'
                        }}
                      >
                        {formatFCFA(price)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#C7B5A7]">Souhaites-tu ton chawarma pimenté ?</p>
              {spiceOptions.map((option) => {
                const isSelected = selectedSpice === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedSpice(option.id)}
                    className="flex min-h-16 w-full cursor-pointer list-none items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200 ease-out before:content-none after:content-none focus-visible:outline-none"
                    style={isSelected ? {
                      borderColor: '#F07838',
                      background: 'linear-gradient(100deg, #9E351D 0%, #682719 52%, #3B1A12 100%)',
                      boxShadow: '0 0 0 2px #F07838, 0 0 28px rgba(240,106,60,0.36), inset 0 1px 0 rgba(255,214,184,0.16)',
                      transform: 'scale(1.01)'
                    } : {
                      borderColor: 'rgba(112,64,43,0.6)',
                      backgroundColor: '#1A100C'
                    }}
                  >
                    <span className="list-none before:content-none after:content-none">
                      <span className={`block text-sm font-bold ${isSelected ? 'text-white' : 'text-[#FCF5EA]'}`}>{option.label}</span>
                      <span className={`mt-0.5 block text-xs ${isSelected ? 'text-[#FFD4B7]' : 'text-[#B8A99C]'}`}>{option.description}</span>
                    </span>
                    <span
                      className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                      style={isSelected ? {
                        borderColor: '#F07838',
                        backgroundColor: '#F07838',
                        boxShadow: '0 0 14px rgba(240,120,56,0.55)'
                      } : {
                        borderColor: '#8A7060'
                      }}
                    >
                      {isSelected && (
                        <span
                          aria-hidden="true"
                          className="mb-0.5 h-2.5 w-1.5 rotate-45 border-b-[3px] border-r-[3px] border-white"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#70402B]/50 bg-[#120B08] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              aria-label="Diminuer la quantité"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#261710] text-[#FCF5EA] transition-colors hover:bg-[#402419] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => current + 1)}
              aria-label="Augmenter la quantité"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#261710] text-[#FCF5EA] transition-colors hover:bg-[#402419]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex h-12 flex-1 cursor-pointer items-center justify-between rounded-full bg-gradient-to-r from-[#F16A3C] to-[#A92E13] px-5 text-sm font-bold text-white shadow-lg shadow-[#C83818]/30 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <span>Commander</span>
            <span className="font-extrabold tabular-nums">{formatFCFA(totalPrice)}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
