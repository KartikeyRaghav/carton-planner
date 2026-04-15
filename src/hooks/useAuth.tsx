"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { User, SubscriptionStatus } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    deviceName?: string,
  ) => Promise<void>;
  resetPasswordGen: (email: string) => Promise<void>;
  resetPasswordVerify: (
    email: string,
    token: string,
    password: string,
  ) => Promise<void>;
  otpGen: (email: string) => Promise<void>;
  otpVerify: (otp: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // Fetch current user from /api/auth/me using the httpOnly cookie.
  // The cookie is set by login/signup responses and is automatically
  // sent by the browser on every same-origin request.
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
        setSubscriptionStatus(data.data.subscriptionStatus);
      } else {
        setUser(null);
        setToken(null);
        setSubscriptionStatus(null);
        localStorage.removeItem("auth_token");
      }
    } catch {
      // Network error — don't clear state aggressively
      setUser(null);
      setSubscriptionStatus(null);
    }
  }, []);

  // On mount, restore token state from localStorage, then validate session
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);

    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string,
    deviceName?: string,
  ) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, deviceName }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Cookie is now set by the browser from the Set-Cookie header.
    // Store token in state + localStorage for non-cookie usage paths.
    const newToken: string = data.data.token;
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);

    // Use data returned directly from login — avoids a second round-trip
    // and the race condition where refreshUser fires before the cookie lands.
    // Then do a background refresh to get full subscription status.
    const loginUser = data.data.user;
    setUser(loginUser);

    // Fetch full profile (includes subscriptionStatus) now that cookie is set
    await refreshUser();
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    const newToken: string = data.data.token;
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);
    localStorage.removeItem("signup_form");
    setUser(data.data.user);

    // Fetch full profile now that cookie is set by the response
    await refreshUser();
  };

  const resetPasswordGen = async (email: string) => {
    try {
      const res = await fetch("/api/auth/reset-password-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Reset Password Generation Failed");

      localStorage.setItem("user_email", email);
    } catch (error) {
      console.error(error);
    }
  };

  const resetPasswordVerify = async (
    email: string,
    token: string,
    password: string,
  ) => {
    try {
      const res = await fetch("/api/auth/reset-password-verif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Reset Password Verification Failed");

      localStorage.removeItem("user_email");
    } catch (error) {
      console.error(error);
    }
  };

  const otpGen = async (email: string) => {
    try {
      const res = await fetch("/api/auth/otp-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Otp Generation Failed");
    } catch (error) {
      console.error(error);
    }
  };

  const otpVerify = async (otp: string) => {
    try {
      const res = await fetch("/api/auth/otp-verif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Otp Verification Failed");
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue clearing state even if request fails
    }
    setUser(null);
    setToken(null);
    setSubscriptionStatus(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscriptionStatus,
        isLoading,
        isAuthenticated: !!user,
        login,
        resetPasswordGen,
        resetPasswordVerify,
        otpGen,
        otpVerify,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
