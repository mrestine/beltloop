import { createContext, useContext, useEffect, useState } from 'react';

type ModelsContextValue = {
  models: string[];
  loading: boolean;
};

const ModelsContext = createContext<ModelsContextValue | undefined>(undefined);

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/platform/models')
      .then((res) => res.json())
      .then((data) => setModels(data.models.map((m: any) => m.model)))
      .finally(() => setLoading(false));
  }, []);

  return <ModelsContext.Provider value={{ models, loading }}>{children}</ModelsContext.Provider>;
}

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (!ctx) throw new Error('useModels must be used within ModelsProvider');
  return ctx;
}
