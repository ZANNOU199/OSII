// Frontend-only demo credentials; replace with server-side authentication before production use.
export const DEMO_ADMIN_ACCOUNT = {
  email: 'osi@admin.com',
  password: 'Osi12345'
} as const;

export const DEMO_STAFF_ACCOUNTS = [
  {
    id: 'demo-server',
    username: 'serveur@osi.com',
    password: 'Serveur12',
    name: 'Serveur de test',
    role: 'server'
  },
  {
    id: 'demo-courier',
    username: 'livreur@osi.com',
    password: 'Livreur12',
    name: 'Livreur de test',
    role: 'courier',
    courierId: 'demo-courier'
  },
  {
    id: 'demo-cashier',
    username: 'caisse@osi.com',
    password: 'Caisse12',
    name: 'Caissier de test',
    role: 'cashier'
  }
] as const;

export const DEMO_COURIER = {
  id: 'demo-courier',
  name: 'Livreur de test',
  phone: '',
  vehicle: 'Moto',
  plateNumber: 'Non renseignée',
  status: 'available' as const
};
