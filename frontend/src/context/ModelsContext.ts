import { createContext, useContext } from 'react';

type ModelsContextValue = {
  models: string[];
  loading: boolean;
};

export const ModelsContext = createContext<ModelsContextValue | undefined>(undefined);

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (!ctx) throw new Error('useModels must be used within ModelsProvider');
  return ctx;
}
