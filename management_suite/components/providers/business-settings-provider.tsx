"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { settingsApi, type BusinessSettings } from "@/lib/api";

const defaults: BusinessSettings = { businessName: "Renaissance Studio", currency: "USD", timezone: "UTC", weekStartsOn: 1, emailReports: true, saleNotifications: true, salesCustomFields: [] };
const currencyLocales: Record<BusinessSettings["currency"], string> = { USD: "en-US", GBP: "en-GB", EUR: "en-IE", NGN: "en-NG", GHS: "en-GH", KES: "en-KE", ZAR: "en-ZA" };

type BusinessSettingsContextValue = {
  settings: BusinessSettings;
  loading: boolean;
  formatMoney: (value: number) => string;
  formatMoneyPrecise: (value: number) => string;
  formatCompactMoney: (value: number) => string;
  currencySymbol: string;
  refresh: () => Promise<void>;
};

const BusinessSettingsContext = createContext<BusinessSettingsContextValue | null>(null);

export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setSettings(await settingsApi.get()); } catch { /* Demo mode keeps safe defaults. */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    settingsApi.get()
      .then((next) => { if (active) setSettings(next); })
      .catch(() => { /* Demo mode keeps safe defaults. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => {
    const locale = currencyLocales[settings.currency];
    const whole = new Intl.NumberFormat(locale, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 });
    const precise = new Intl.NumberFormat(locale, { style: "currency", currency: settings.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const compact = new Intl.NumberFormat(locale, { style: "currency", currency: settings.currency, notation: "compact", maximumFractionDigits: 1 });
    return {
      settings, loading,
      formatMoney: (amount: number) => whole.format(amount),
      formatMoneyPrecise: (amount: number) => precise.format(amount),
      formatCompactMoney: (amount: number) => compact.format(amount),
      currencySymbol: whole.formatToParts(0).find((part) => part.type === "currency")?.value ?? settings.currency,
      refresh,
    };
  }, [settings, loading, refresh]);

  return <BusinessSettingsContext.Provider value={value}>{children}</BusinessSettingsContext.Provider>;
}

export function useBusinessSettings() {
  const context = useContext(BusinessSettingsContext);
  if (!context) throw new Error("useBusinessSettings must be used inside BusinessSettingsProvider");
  return context;
}
