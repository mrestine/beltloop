import { createContext, useContext } from 'react';
import type { PropertiesContextValue } from '@beltloop/types';

export const PropertiesContext = createContext<PropertiesContextValue | undefined>(undefined);

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('useProperties must be used within PropertiesProvider');
  return ctx;
}
