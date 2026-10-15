import './Chat.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import Sessions from './Sessions';
import ChatInput from './ChatInput';
import ChatItem from './ChatItem';
import TokenUsage from './TokenUsage';
import useChatMessages from './useChatMessages';
import Card from '@beltloop/components/Card/Card';
import ModelSelect from '@beltloop/components/ModelSelect';

function Chat() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [model, setModel] = useState<string>('');

  const wasAtBottomRef = useRef(true);
  const messagesPaneRef = useRef<HTMLDivElement>(null);
  const { loading, messages, fetchMessagesForSession, sendMessageAndHandleReply } =
    useChatMessages();

  function handleSessionSelect(sessionId: number) {
    setSelectedSession(sessionId);
    fetchMessagesForSession(sessionId);
  }

  function handleModelChange(newModel: string) {
    setModel(newModel);
  }

  function handleScroll(ev: React.UIEvent<HTMLDivElement>) {
    const pane = ev.currentTarget;
    const distanceFromBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight;
    wasAtBottomRef.current = distanceFromBottom < 24;
  }
  useEffect(() => {
    const pane = messagesPaneRef.current;
    if (!pane) return;
    if (wasAtBottomRef.current) {
      pane.scrollTop = pane.scrollHeight;
    }
  }, [messages]);

  const tokenUsage = useMemo(() => {
    if (!messages.length) return null;
    const tokenIdx = messages.findLastIndex((m) => m.role !== 'user' && m.tokens);
    return tokenIdx === -1 ? null : messages[tokenIdx].tokens;
  }, [messages]);

  return (
    <div className="chat-container">
      <Sessions selectedSession={selectedSession} handleSessionSelect={handleSessionSelect} />
      <Card className="chat-card">
        <div className="chat-item-wrap" ref={messagesPaneRef} onScroll={handleScroll}>
          {messages.map((m) => (
            <ChatItem key={m.localId || m.id} message={m} />
          ))}
        </div>
      </Card>
      {selectedSession ? (
        <ChatInput
          sessionId={selectedSession}
          model={model}
          loading={loading}
          sendMessageAndHandleReply={sendMessageAndHandleReply}
        />
      ) : (
        <div>select a session</div>
      )}
      <div className="models-usage-row">
        <ModelSelect onChange={handleModelChange} />
        <TokenUsage used={tokenUsage} loading={loading} />
      </div>
    </div>
  );
}

export default Chat;
