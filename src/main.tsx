import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { StaffPortal } from './components/StaffPortal.tsx';
import './index.css';

const route = window.location.pathname.replace(/\/+$/, '');
const staffRouteRoles = {
  '/serveur': 'server',
  '/livreur': 'courier',
  '/caisse': 'cashier'
} as const;
const staffRole = staffRouteRoles[route as keyof typeof staffRouteRoles];
const page = route === '/admin'
  ? <AdminDashboard />
  : staffRole
    ? <StaffPortal requiredRole={staffRole} />
    : <App />;

createRoot(document.getElementById('root')!).render(page);
