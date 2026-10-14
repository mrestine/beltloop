import type { Message, MessageUpdate } from '@beltloop/types';
import { useState } from 'react';

interface SendMessageAndHandleReplyProps {
  content: string;
  model: string;
  sessionId: number;
}

function useChatMessages() {
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  function fetchMessagesForSession(sessionId: number) {
    setLoading(true);
    if (!sessionId) {
      setMessages([]);
      setLoading(false);
    }

    fetch(`http://localhost:8000/messages-for-session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      });
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

  function sendMessageAndHandleReply({
    content,
    model,
    sessionId,
  }: SendMessageAndHandleReplyProps) {
    setLoading(true);
    const userMessageUuid = crypto.randomUUID();
    const compactingUuid = crypto.randomUUID();
    appendMessage({
      content,
      role: 'user',
      localId: userMessageUuid,
    });
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

  return {
    loading,
    fetchMessagesForSession,
    messages,
    sendMessageAndHandleReply,
  };
}

export default useChatMessages;
