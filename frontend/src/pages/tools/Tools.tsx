import './Tools.css';
import Card from '@beltloop/components/Card/Card';
import type { ToolConfig, ToolSchema } from '@beltloop/types';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import ConfigForm from './ConfigForm';

function Tools() {
  const [currentTool, setCurrentTool] = useState<string>('');
  const [toolConfig, setToolConfig] = useState<ToolConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [tools, setTools] = useState<ToolSchema[]>([]);

  function handleToolClick(name: string) {
    setCurrentTool(name);
    setLoading(true);
    fetch(`http://localhost:8000/tools/${name}`)
      .then((res) => res.json())
      .then((data: ToolConfig) => {
        setLoading(false);
        setToolConfig(data);
      });
  }

  useEffectOnce(() => {
    fetch('http://localhost:8000/tools/list')
      .then((res) => res.json())
      .then((data) => {
        setTools(data);
      });
  });

  return (
    <Card>
      <h2>Tools</h2>
      <div className="tools-list">
        {tools.map((t) => (
          <div
            className="tools-item"
            key={t.function.name}
            onClick={() => handleToolClick(t.function.name)}
          >
            <span className="tool-name">{t.function.name}</span>
            <span className="tool-description">{t.function.description}</span>
          </div>
        ))}
      </div>
      {currentTool && (
        <>
          <h3>{currentTool}</h3>
          {loading ? (
            <p>loading...</p>
          ) : toolConfig ? (
            <ConfigForm toolConfig={toolConfig} />
          ) : (
            <p>no config</p>
          )}
        </>
      )}
    </Card>
  );
}

export default Tools;
