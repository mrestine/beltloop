import { useState } from 'react';
import ModelSelect from '@beltloop/components/ModelSelect';
import { type Message, type MessageUpdate } from '@beltloop/types';

interface ChatWindowProps {
  sessionId: number;
  appendMessage: (message: Message) => void;
  updateMessage: (uuid: string, payload: MessageUpdate) => void;
}

function ChatInput({ sessionId, appendMessage, updateMessage }: ChatWindowProps) {
  const [content, setContent] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function handleInputChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const newValue = ev.target.value;
    setContent(newValue);
  }

  // TODO: pull out the incoming message stuff; it doesn't belong here
  function sendMessage() {
    setLoading(true);
    const userMessageUuid = crypto.randomUUID();
    const compactingUuid = crypto.randomUUID();
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
            appendMessage({
              content: '',
              localId: assistantMessageUuid,
              role: 'assistant',
            });
          } else if (event.assistant_message_id) {
            updateMessage(assistantMessageUuid, { id: event.assistant_message_id });
          }
          if (event.data) {
            updateMessage(assistantMessageUuid, { content: event.data });
          } else if (event.done) {
            updateMessage(assistantMessageUuid, {
              tokens: event.prompt_eval_count + event.eval_count,
            });
            setLoading(false);
          } else if (event.error) {
            updateMessage(assistantMessageUuid, { content: event.error });
            setLoading(false);
          } else if (event.compacting) {
            if (event.compacting.in_progress) {
              appendMessage({
                content: 'Compacting session ... ',
                role: 'system',
                localId: compactingUuid,
              });
            } else {
              updateMessage(compactingUuid, {
                replaceContent: event.compacting.message.display_content,
                tokens: event.compacting.message.tokens,
              });
            }
          }
        }
      }
    });
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
