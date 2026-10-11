import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ModelSelect from '../../components/ModelSelect';
import { type Message, type MessageUpdate } from './Chat';

interface ChatWindowProps {
  sessionId: number,
  appendMessage: (message: Message) => void,
  updateMessage: (uuid: string, payload: MessageUpdate) => void
}

function ChatWindow({
  sessionId,
  appendMessage,
  updateMessage,
}: ChatWindowProps) {
  const [content, setContent] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function handleInputChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const newValue = ev.target.value;
    setContent(newValue);
  }

  function sendMessage() {
    setLoading(true);
    const userMessageUuid = crypto.randomUUID();
    appendMessage({
      content,
      role: 'user',
      localId: userMessageUuid,
    });
    setContent('');
    fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'Application/JSON' },
      body: JSON.stringify({ content, model, session_id: sessionId }),
    }).then(async (res) => {
      const assistantMessageUuid = crypto.randomUUID();
      const reader = res.body!.getReader();
      if (!res.ok || !reader) {
        alert('error');
        console.log(res);
      }
      const decoder = new TextDecoder();
      let buffer = '';

      appendMessage({
        content: '',
        localId: assistantMessageUuid,
        role: 'assistant',
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.user_message_id) {
            updateMessage(userMessageUuid, { id: event.user_message_id });
          } else if (event.assistant_message_id) {
            updateMessage(assistantMessageUuid, { id: event.assistant_message_id });
          } if (event.data) {
            // TODO: scroll to bottom
            updateMessage(assistantMessageUuid, { content: event.data });
          } else if (event.done) {
            setLoading(false);
          } else if (event.error) {
            updateMessage(assistantMessageUuid, { content: event.error });
            setLoading(false);
          }
        }
      }
    });
  }

  function handleModelChange(newModel: string) {
    setModel(newModel);
  }

  return (
    <>
      <div className="chatWindow">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>

        </ReactMarkdown>
      </div>
      <input type="text" value={content} onChange={handleInputChange} disabled={loading} />
      <button onClick={sendMessage} disabled={!content || loading}>
        send
      </button>
      <ModelSelect onChange={handleModelChange} />
    </>
  );
}

export default ChatWindow;
