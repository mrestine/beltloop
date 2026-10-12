import './Chat.css';
import { useProperties } from '@reinstorm/context/PropertiesContext';

interface TokenUsageProps {
  used?: number | null;
}

function TokenUsage({ used }: TokenUsageProps) {
  const { maxContext } = useProperties();

  const usageWidth = used && maxContext ? used / maxContext : 0;

  return (
    <div className="usage-wrap">
      <div className="usage-bar" style={{ width: `${usageWidth * 100}%` }}></div>
      <div className="usage-text">
        <span>{used}</span>
        <span>usage</span>
        <span>{maxContext} tk</span>
      </div>
    </div>
  );
}

export default TokenUsage;
