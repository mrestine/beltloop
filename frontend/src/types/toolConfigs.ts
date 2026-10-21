export interface ToolSchema {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, JsonSchemaProperty>;
    };
  };
}

export interface ToolConfigSchema {
  type: string;
  properties: Record<string, JsonSchemaProperty>;
}

export interface ToolConfigValues {
  id: number;
  enabled: boolean;
  name: string;
  config: Record<string, unknown>;
  created_at: Date;
}

export type ToolConfigFormValues = Omit<ToolConfigValues, 'id' | 'name' | 'created_at'>;

export interface ToolConfig {
  schema: ToolSchema;
  config: ToolConfigSchema;
  values: ToolConfigValues;
}

interface JsonSchemaProperty {
  type: string;
  enum?: string[];
  default?: unknown;
}
