import React from 'react';
import { CATEGORIES } from '../data/menu';
import { Search, X } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#78716C]">
          <Search className="w-5 h-5 text-[#8E7069]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher chawarma, dèguè, bissap..."
          className="w-full h-[50px] pl-11 pr-10 rounded-xl bg-[#F4EFE6] border border-[#E8DFD1] text-[#1E1B19] placeholder-[#78716C] text-sm font-medium focus:outline-none focus:border-[#C83818] focus:ring-3 focus:ring-[#C83818]/15 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Effacer la recherche"
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#78716C] hover:text-[#1E1B19] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Exactly 3 category fields: Chawarma, Dèguè, Jus */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F4EFE6] rounded-2xl border border-[#E8DFD1]">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`h-[48px] rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center whitespace-nowrap ${
                isActive
                  ? 'bg-[#1C1917] text-white shadow-md'
                  : 'text-[#1E1B19] hover:bg-white/60'
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
