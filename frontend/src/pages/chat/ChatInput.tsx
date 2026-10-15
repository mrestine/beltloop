import './Chat.css';
import { useState } from 'react';

interface ChatInputProps {
  sessionId: number;
  model: string;
  loading: boolean;
  sendMessageAndHandleReply: (args: { content: string; model: string; sessionId: number }) => void;
}

function ChatInput({ sessionId, model, loading, sendMessageAndHandleReply }: ChatInputProps) {
  const [content, setContent] = useState<string>('');

  function handleInputChange(ev: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = ev.target.value;
    setContent(newValue);
  }

  function sendMessage() {
    setContent('');
    sendMessageAndHandleReply({ content, model, sessionId });
  }

  const sendDisabled = !content || loading;

  function handleKeyDown(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ev.key === 'Enter' && !sendDisabled) {
      sendMessage();
    }
  }

  return (
    <div className="chat-input-wrap">
      <textarea
        className="chat-input"
        value={content}
        placeholder="type something..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <button className="send-button" onClick={sendMessage} disabled={sendDisabled}>
        {'>'}
      </button>
    </div>
  );
}

export default ChatInput;
