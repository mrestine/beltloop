import { useEffect, useState } from "react";
import Sessions from "./Sessions";
import ChatWindow from "./ChatWindow";

export interface Message {
  id?: number,
  localId?: string, // this is used for greedy loading
  role: string,
  content: string,
}

export interface MessageUpdate {
  id?: number,
  content?: string,
}

function Chat() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  function handleSessionSelect(sessionId: number) {
    setSelectedSession(sessionId);
  }

  function appendMessage(message: Message) {
    setMessages(prev => [...prev, message]);
  }

  function updateMessage(uuid: string, { id, content }: MessageUpdate) {
    setMessages(prev => {
      const idx = prev.findLastIndex(m => m.localId === uuid);
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
      ? fetch(`http://localhost:8000/messages-for-session/${selectedSession}`).then(res => res.json())
      : Promise.resolve([]);

    loadMessages.then(data => setMessages(data));
  }, [selectedSession]);

  return (
    <>
      <Sessions
        selectedSession={selectedSession}
        handleSessionSelect={handleSessionSelect}
      />
      <div>
        {messages.map(m => <div key={m.localId || m.id}>{m.role}: {m.content}</div>)}
      </div>
      {selectedSession
        ? <ChatWindow
          sessionId={selectedSession}
          appendMessage={appendMessage}
          updateMessage={updateMessage}
        />
        : <div>select a session</div>
      }
    </>
  );
}

export default Chat;