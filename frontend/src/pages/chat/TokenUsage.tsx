import { GaugeCircle } from 'lucide-react';
import './Chat.css';
import { useProperties } from '@beltloop/context/PropertiesContext';

interface TokenUsageProps {
  used?: number | null;
  loading: boolean;
}

function TokenUsage({ used, loading }: TokenUsageProps) {
  const { maxContext } = useProperties();

  const usageWidth = used && maxContext ? used / maxContext : 0;

  return (
    <div className="usage-wrap">
      <div className="usage-bar" style={{ width: `${usageWidth * 100}%` }}></div>
      <div className="usage-text">
        <span>{used}</span>
        <GaugeCircle size={16} className={`spinning ${loading ? '' : 'paused'}`} />
        <span>{maxContext} tk</span>
      </div>
    </div>
  );
}

export default TokenUsage;
