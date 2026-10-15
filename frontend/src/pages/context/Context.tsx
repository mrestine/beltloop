import './Context.css';
import { ContextFilenames } from '@beltloop/types';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Card from '@beltloop/components/Card/Card';
import { Edit, Eye, Save } from 'lucide-react';
import IconButton from '@beltloop/components/IconButton';

type ContextFilename = (typeof ContextFilenames)[keyof typeof ContextFilenames];
interface FileContents {
  'persona.md': string;
  'user.md': string;
}

const ContextFilenamesArray = Object.values(ContextFilenames);

function Context() {
  const [tab, setTab] = useState<ContextFilename>('persona.md');
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [fileContents, setFileContents] = useState<FileContents>({
    'persona.md': '',
    'user.md': '',
  });

  useEffectOnce(() => {
    fetch('http://localhost:8000/context/all')
      .then((res) => res.json())
      .then((data: FileContents) => {
        setFileContents(data);
        setInputValue(data[tab]);
        setLoading(false);
      });
  });

  function saveFile() {
    setSaving(true);
    fetch(`http://localhost:8000/context/${tab}`, {
      method: 'PUT',
      body: JSON.stringify({ content: inputValue }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then(() => {
        setFileContents((prev) => ({ ...prev, [tab]: inputValue }));
        setSaving(false);
      });
  }

  function handleInputChange(ev: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(ev.target.value);
  }

  function handleTabChange(nextTab: ContextFilename) {
    setTab(nextTab);
    setInputValue(fileContents[nextTab]);
  }

  return (
    <Card className="context-container">
      <div className="tab-header-wrap">
        {ContextFilenamesArray.map((file) => (
          <h4
            className={`tab-header ${tab === file ? 'active' : ''}`}
            key={file}
            onClick={() => handleTabChange(file)}
          >
            {file}
          </h4>
        ))}
      </div>
      {loading ? (
        <div className="loading">loading ...</div>
      ) : (
        <>
          {isPreview ? (
            <div className="context-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{inputValue}</ReactMarkdown>
            </div>
          ) : (
            <textarea value={inputValue} onChange={handleInputChange} />
          )}
          <div className="context-actions">
            <IconButton
              type="secondary"
              size={24}
              icon={isPreview ? Edit : Eye}
              onClick={() => setIsPreview(!isPreview)}
              label={isPreview ? 'edit' : 'preview'}
            />
            <IconButton
              type="secondary"
              size={24}
              icon={Save}
              onClick={saveFile}
              disabled={loading || saving}
              label="save"
            />
          </div>
        </>
      )}
    </Card>
  );
}

export default Context;
