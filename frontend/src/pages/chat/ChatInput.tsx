import { useState } from 'react';
import ModelSelect from '@beltloop/components/ModelSelect';

interface ChatInputProps {
  sessionId: number;
  loading: boolean;
  sendMessageAndHandleReply: (args: { content: string; model: string; sessionId: number }) => void;
}

function ChatInput({ sessionId, loading, sendMessageAndHandleReply }: ChatInputProps) {
  const [content, setContent] = useState<string>('');
  const [model, setModel] = useState<string>('');

  function handleInputChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const newValue = ev.target.value;
    setContent(newValue);
  }

  function sendMessage() {
    setContent('');
    sendMessageAndHandleReply({ content, model, sessionId });
  }

  function handleModelChange(newModel: string) {
    setModel(newModel);
  }

  const sendDisabled = !content || loading;

  function handleKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter' && !sendDisabled) {
      sendMessage();
    }
  }

  return (
    <>
      <input type="text" value={content} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      <button onClick={sendMessage} disabled={sendDisabled}>
        send
      </button>
      <div>
        Model:
        <ModelSelect onChange={handleModelChange} />
      </div>
    </>
  );
}

export default ChatInput;
