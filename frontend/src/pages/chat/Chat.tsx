import './Chat.css';
import { useEffect, useRef, useState } from 'react';
import Sessions from './Sessions';
import ChatInput from './ChatInput';
import ChatItem from './ChatItem';
import { type Message, type MessageUpdate } from '@reinstorm/types';

function Chat() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesPaneRef = useRef<HTMLDivElement>(null);

  function handleSessionSelect(sessionId: number) {
    setSelectedSession(sessionId);
  }

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  function updateMessage(uuid: string, { id, content }: MessageUpdate) {
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

  useEffect(() => {
    const pane = messagesPaneRef.current;
    if (!pane) return;

    const distanceFromBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight;
    const isNearBottom = distanceFromBottom < 32;

    if (isNearBottom) {
      pane.scrollTop = pane.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <Sessions selectedSession={selectedSession} handleSessionSelect={handleSessionSelect} />
      <div className="chat-item-wrap" ref={messagesPaneRef}>
        {/* TODO: Chat item should have time/token usage */}
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
    </div>
  );
}

export default Chat;
