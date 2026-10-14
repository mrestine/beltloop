import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { PropertiesContext } from './PropertiesContext';
import { type OllamaModelInfo, type Properties } from '@beltloop/types';

export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Properties | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffectOnce(() => {
    fetch('http://localhost:8000/platform/properties')
      .then((res) => res.json())
      .then((data) =>
        setProperties({
          models: data.models.map((m: OllamaModelInfo) => m.model),
          maxContext: data.max_context,
          temperature: data.temperature,
        }),
      )
      .finally(() => setLoading(false));
  });

  return (
    <PropertiesContext.Provider value={{ ...properties, loading }}>
      {children}
    </PropertiesContext.Provider>
  );
}
