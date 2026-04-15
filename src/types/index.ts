export interface User {
  id: string;
  email: string;
  name: string;
  trialEndsAt: string;
  createdAt: string;
  subscription?: Subscription | null;
  devices?: DeviceSession[];
}

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  maxDevices: number;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  lastActive: string;
  isActive: boolean;
  createdAt: string;
}

export interface Calculation {
  id: string;
  userId: string;
  unit: string;
  cartonStyle: string;
  length: number;
  width: number;
  height: number;
  pastingFlap: number;
  tuckInFlap: number;
  lockBottomMargin: number;
  results: SheetLayout[];
  createdAt: string;
}

export interface SheetLayout {
  label: string;
  grid: string;
  length: number;
  width: number;
}

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  durationDays: number;
  price: number;
  maxDevices: number;
  features: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SubscriptionStatus {
  hasAccess: boolean;
  isTrialing: boolean;
  isSubscribed: boolean;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  daysRemaining?: number;
  reason: string;
}
