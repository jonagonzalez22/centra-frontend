import type { User } from '@/entities/User';
import { hasFeature } from './features';

export const canUsePosCheckout = (user: User | null): boolean =>
    hasFeature(user, 'pos') && Boolean(user?.permissions.includes('pos.view'));

export const canCreateOrderCheckout = (user: User | null): boolean =>
    hasFeature(user, 'orders') && Boolean(user?.permissions.includes('orders.create'));

export const canAccessOperationalCheckout = (user: User | null): boolean =>
    canUsePosCheckout(user) || canCreateOrderCheckout(user);
