import { useProperties } from '../context/PropertiesContext';

type ModelSelectProps = {
  onChange?: (newModel: string) => void;
};

function ModelSelect(props: ModelSelectProps) {
  const { models, loading } = useProperties();
  const { onChange = () => {} } = props;
  const options = [...(models ?? [])];

  function handleChange(ev: React.ChangeEvent<HTMLSelectElement>) {
    onChange(ev.target.value);
  }

  return (
    <select disabled={loading} onChange={handleChange}>
      <option value="">Default model</option>
      {options.map((m) => (
        <option value={m} key={m}>
          {m}
        </option>
      ))}
    </select>
  );
}

export default ModelSelect;
