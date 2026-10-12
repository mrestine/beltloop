export type PropertiesContextValue = {
  models?: string[];
  maxContext?: number;
  temperature?: number;
  loading: boolean;
};

export type Properties = Omit<PropertiesContextValue, 'loading'>;
