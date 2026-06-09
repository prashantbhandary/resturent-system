import { createContext, useContext, useEffect, useState } from 'react';
import { configApi } from '../services/api';
import { setCurrencySymbol } from '../lib/utils';

const ConfigContext = createContext(null);

const FALLBACK = {
  restaurant_name: 'DineQR',
  currency_code: 'NPR',
  currency_symbol: 'Rs',
  locale: 'en-NP',
  tax_rate: '0.13',
  tax_label: 'VAT',
  service_charge: '0',
  brand_color: '#f97316',
};

/**
 * Loads tenant-configurable branding/currency/tax from /api/config once at
 * startup so the whole UI (currency symbol, restaurant name, tax label) is
 * driven by per-restaurant settings instead of hardcoded values.
 */
export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    configApi
      .get()
      .then(({ data }) => {
        const cfg = { ...FALLBACK, ...(data.config || {}) };
        setConfig(cfg);
        setCurrencySymbol(cfg.currency_symbol);
        if (cfg.restaurant_name) document.title = cfg.restaurant_name;
      })
      .catch(() => {
        setCurrencySymbol(FALLBACK.currency_symbol);
      })
      .finally(() => setLoaded(true));
  }, []);

  const refresh = async () => {
    const { data } = await configApi.get();
    const cfg = { ...FALLBACK, ...(data.config || {}) };
    setConfig(cfg);
    setCurrencySymbol(cfg.currency_symbol);
    return cfg;
  };

  return (
    <ConfigContext.Provider value={{ config, loaded, refresh }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
