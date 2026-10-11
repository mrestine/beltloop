import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { ModelsContext } from './ModelsContext';

type OllamaModelInfo = {
  model: string;
};

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffectOnce(() => {
    fetch('http://localhost:8000/platform/models')
      .then((res) => res.json())
      .then((data) => setModels(data.models.map((m: OllamaModelInfo) => m.model)))
      .finally(() => setLoading(false));
  });

  return <ModelsContext.Provider value={{ models, loading }}>{children}</ModelsContext.Provider>;
}
