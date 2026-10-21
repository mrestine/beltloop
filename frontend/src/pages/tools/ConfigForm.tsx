import './Tools.css';
import IconButton from '@beltloop/components/IconButton';
import type { ToolConfig, ToolConfigFormValues } from '@beltloop/types';
import { Save } from 'lucide-react';
import { useState } from 'react';

interface ConfigFormProps {
  toolConfig: ToolConfig;
}

function ConfigForm({ toolConfig }: ConfigFormProps) {
  const [formValues, setFormValues] = useState<ToolConfigFormValues>(
    toolConfig.values || {
      enabled: true,
      config: {},
    },
  );
  const [saving, setSaving] = useState<boolean>(false);

  function handleFieldChange(fieldName: string, value: unknown) {
    setFormValues((prev) => ({ ...prev, config: { ...prev.config, [fieldName]: value } }));
  }

  function handleEnabledChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setFormValues((prev) => ({ config: prev.config, enabled: ev.target.checked }));
  }

  function handleSave() {
    setSaving(true);
    const { enabled, config } = formValues;
    fetch(`http://localhost:8000/tools/${toolConfig.schema.function.name}`, {
      method: 'PUT',
      body: JSON.stringify({
        enabled,
        config,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('saved data', data);
        setSaving(false);
      });
  }

  const fieldConfigs = toolConfig.config.properties;
  const fieldNames = Object.keys(fieldConfigs);
  const fields = fieldNames.map((name) => {
    const fieldProperties = fieldConfigs[name];
    if (fieldProperties.enum?.length) {
      return (
        <div key="name" className="field-wrap">
          <select
            name={name}
            value={formValues.config[name] as string}
            onChange={(ev) => handleFieldChange(name, ev.target.value)}
          >
            {fieldProperties.enum.map((e: string) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      );
    }
  });

  return (
    <div className="tool-form-wrap">
      <div>
        <label>Enabled:</label>
        <input
          name="enabled"
          type="checkbox"
          checked={formValues.enabled}
          onChange={handleEnabledChange}
        />
      </div>
      {fields}
      <IconButton
        className="save-btn"
        label="save"
        icon={Save}
        disabled={saving}
        onClick={handleSave}
      />
    </div>
  );
}

export default ConfigForm;
