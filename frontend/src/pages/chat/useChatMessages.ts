import type { Message, MessageUpdate, MessageEvent } from '@beltloop/types';
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

  function updateMessage(
    uuid: string,
    { id, content, replaceContent, mergeToolContent, tokens }: MessageUpdate,
  ) {
    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.localId === uuid);
      // append a new assistant message
      if (idx === -1) {
        return [
          ...prev,
          {
            role: 'assistant',
            content: content || '',
            localId: uuid,
            id,
            tokens,
          },
        ];
      }
      const next = [...prev];
      if (id) {
        next[idx] = { ...next[idx], id };
      }
      if (content && next[idx].role !== 'tool') {
        next[idx] = { ...next[idx], content: next[idx].content + content };
      }
      if (replaceContent && next[idx].role !== 'tool') {
        next[idx] = { ...next[idx], content: replaceContent };
      }
      if (mergeToolContent && next[idx].role === 'tool') {
        next[idx] = { ...next[idx], content: { ...next[idx].content, ...mergeToolContent } };
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
    // declare uuids for different types of messages
    let compactingUuid: string;
    const toolCallUuids: Record<string, string> = {};

    // append the user message immediately, db id is later
    const userMessageUuid = crypto.randomUUID();
    appendMessage({
      content,
      role: 'user',
      localId: userMessageUuid,
    });

    // send the message
    fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'Application/JSON' },
      body: JSON.stringify({ content, model, session_id: sessionId }),
    }).then(async (res) => {
      let assistantMessageUuid = crypto.randomUUID();
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
          const event: MessageEvent = JSON.parse(line);
          // start of response - set the user's message id, append empty assistant message
          if (event.user_message_id) {
            updateMessage(userMessageUuid, { id: event.user_message_id });
            appendMessage({
              content: '',
              localId: assistantMessageUuid,
              role: 'assistant',
            });
          }
          // append a string to the pending assistant message
          // this might also be a tool call announcement which has id
          if (event.data) {
            updateMessage(assistantMessageUuid, {
              content: event.data,
              tokens: event.tokens,
              id: event.assistant_message_id,
            });
          }
          // id can only mean the assistant message is complete. a tool call might follow
          // set a new uuid so the next assistant data makes a new assistant message
          if (event.assistant_message_id && !event.done) {
            assistantMessageUuid = crypto.randomUUID();
          }
          // the start of the tool call message, no results yet
          if (event.tool_call) {
            const newToolCallUuid = crypto.randomUUID();
            toolCallUuids[event.tool_call.name] = newToolCallUuid;
            appendMessage({
              localId: newToolCallUuid,
              role: 'tool',
              content: event.tool_call,
            });
          }
          // a single tool call result. update the associated tool message
          if (event.tool_result) {
            const toolUuid = toolCallUuids[event.tool_result.name];
            if (toolUuid) {
              updateMessage(toolUuid, {
                mergeToolContent: { result: event.tool_result.result },
              });
            }
          }

          // turn is over, set tokens and final assistant message id
          if (event.done) {
            updateMessage(assistantMessageUuid, {
              id: event.assistant_message_id,
              tokens: event.tokens,
            });
            setLoading(false);
          }
          // handle errors
          else if (event.error) {
            updateMessage(assistantMessageUuid, { content: event.error });
            setLoading(false);
          }
          // compaction is happening, append a system message
          else if (event.compacting) {
            if (event.compacting.in_progress) {
              compactingUuid = crypto.randomUUID();
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
