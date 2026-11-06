import { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'chawarma-braise-osi',
    name: 'Chawarma',
    category: 'chawarma',
    price: 1000,
    description: 'Émincé de viande mariné aux épices béninoises, braisé au charbon de bois, sauce blanche à l\'ail et galette croustillante.',
    image: '/images/hero_chawarma_braise_1793866673376.jpg',
    specialtyTag: 'signature',
    spiceLevel: 'releve',
    prepTime: '10-15 min',
    tags: ['Chawarma', 'Braisé', 'Feu de bois'],
    customizable: true,
    options: {
      spices: [
        { id: 'non_pimente', label: 'Non pimenté', desc: 'Sans piment' },
        { id: 'pimente', label: 'Pimenté', desc: 'Avec piment' }
      ]
    }
  },
  {
    id: 'degue-couscous-mil-osi',
    name: 'Dèguè Mil/Couscous',
    category: 'degue',
    price: 500,
    description: 'Couscous de mil précuit à la vapeur selon la tradition, yaourt onctueux vanillé fait maison, lait concentré et fleur d\'oranger.',
    image: '/images/product_degue_artisanal_1793866674623.jpg',
    specialtyTag: 'artisanal',
    spiceLevel: 'none',
    prepTime: 'Prêt immédiatement',
    tags: ['Dèguè', 'Mil Artisanal', 'Fait Maison'],
    customizable: true
  }
];

export const CATEGORIES = [
  { id: 'chawarma', label: 'Chawarma' },
  { id: 'degue', label: 'Dèguè' }
] as const;

export const NEIGHBORHOODS = [
  { name: 'Godomey Magasin / PK 10', fee: 500, time: '20-30 min' },
  { name: 'Godomey Togoudo / N\'Vènamèdji', fee: 600, time: '25-35 min' },
  { name: 'Calavi Arconville / Kpota', fee: 1000, time: '30-40 min' },
  { name: 'Calavi UAC / Bidossessi', fee: 1200, time: '35-45 min' },
  { name: 'Cotonou Fidjrossè / Plage', fee: 1000, time: '30-40 min' },
  { name: 'Cotonou Haie Vive / Cadjehoun', fee: 1200, time: '35-45 min' },
  { name: 'Cotonou Ganhi / Zongo', fee: 1500, time: '40-50 min' },
  { name: 'Cotonou Akpakpa / PK 3', fee: 2000, time: '45-55 min' }
];

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
}
