import Card from '@beltloop/components/Card/Card';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: object;
    };
  };
}

function Tools() {
  const [response, setResponse] = useState<object | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [tools, setTools] = useState<Tool[]>([]);

  function handleTestClick() {
    setLoading(true);
    fetch('http://localhost:8000/tools/test')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setResponse(data);
        setLoading(false);
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
      {tools.map((t) => (
        <div>
          {t.function.name}: {t.function.description}
        </div>
      ))}
      <button onClick={handleTestClick}>test</button>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {loading ? 'loading...' : JSON.stringify(response)}
      </pre>
    </Card>
  );
}

export default Tools;
