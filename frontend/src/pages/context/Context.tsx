import './Context.css';
import { ContextFilenames } from '@reinstorm/types';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    Promise.all(
      ContextFilenamesArray.map((file) =>
        fetch(`http://localhost:8000/context/${file}`)
          .then((res) => res.json())
          .then((data: string) => {
            setFileContents((prev) => ({ ...prev, [file]: data }));
            if (tab === file) setInputValue(data);
          }),
      ),
    ).then(() => setLoading(false));
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
    <div className="context-container">
      <div className="tab-header-wrap">
        {ContextFilenamesArray.map((file) => (
          <span
            className={`tab-header ${tab === file ? 'active' : ''}`}
            key={file}
            onClick={() => handleTabChange(file)}
          >
            {file}
          </span>
        ))}
      </div>
      {loading ? (
        <div className="loading">loading ...</div>
      ) : (
        <>
          {isPreview ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{inputValue}</ReactMarkdown>
          ) : (
            <textarea value={inputValue} onChange={handleInputChange} />
          )}
          <button onClick={() => setIsPreview(!isPreview)}>{isPreview ? 'edit' : 'preview'}</button>
          <button onClick={saveFile} disabled={loading || saving}>
            save
          </button>
        </>
      )}
    </div>
  );
}

export default Context;
