import './Chat.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import Sessions from './Sessions';
import ChatInput from './ChatInput';
import ChatItem from './ChatItem';
import { type Message, type MessageUpdate } from '@beltloop/types';
import TokenUsage from './TokenUsage';

function Chat() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const wasAtBottomRef = useRef(true);
  const messagesPaneRef = useRef<HTMLDivElement>(null);

  function handleSessionSelect(sessionId: number) {
    setSelectedSession(sessionId);
  }

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  function updateMessage(uuid: string, { id, content, replaceContent, tokens }: MessageUpdate) {
    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.localId === uuid);
      if (idx === -1) return prev;
      const next = [...prev];
      if (id) {
        next[idx] = { ...next[idx], id };
      }
      if (content) {
        next[idx] = { ...next[idx], content: next[idx].content + content };
      }
      if (replaceContent) {
        next[idx] = { ...next[idx], content: replaceContent };
      }
      if (tokens) {
        next[idx] = { ...next[idx], tokens };
      }
      return next;
    });
  }

  useEffect(() => {
    const loadMessages = selectedSession
      ? fetch(`http://localhost:8000/messages-for-session/${selectedSession}`).then((res) =>
          res.json(),
        )
      : Promise.resolve([]);
    loadMessages.then((data) => setMessages(data));
  }, [selectedSession]);

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
      <div className="chat-item-wrap" ref={messagesPaneRef} onScroll={handleScroll}>
        {messages.map((m) => (
          <ChatItem key={m.localId || m.id} message={m} />
        ))}
      </div>
      {selectedSession ? (
        <ChatInput
          sessionId={selectedSession}
          appendMessage={appendMessage}
          updateMessage={updateMessage}
        />
      ) : (
        <div>select a session</div>
      )}
      <TokenUsage used={tokenUsage} />
    </div>
  );
}

export default Chat;
