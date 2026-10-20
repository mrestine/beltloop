import './Chat.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Message, type StringMessage, type ToolMessage } from '@beltloop/types';
import { useState } from 'react';

interface ChatItemProps {
  message: Message;
}
interface StringChatItemProps {
  message: StringMessage;
}
interface ToolChatItemProps {
  message: ToolMessage;
}

function UserContent({ message }: StringChatItemProps) {
  return <>{message.content}</>;
}

function AssistantContent({ message }: StringChatItemProps) {
  const content = message.display_content || message.content;

  return (
    <>
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      ) : (
        <span className="loader-wrap">
          <span className="loader"></span>
          <span className="loader"></span>
          <span className="loader"></span>
        </span>
      )}
    </>
  );
}

// TODO: make this look goooood
function ToolContent({ message }: ToolChatItemProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      <>
        {message.content.name} {message.content.result ? 'done' : 'running'}
      </>
      {isExpanded && (
        <>
          <pre>arguments: {JSON.stringify(message.content.arguments)}</pre>
          <pre>result: {JSON.stringify(message.content.result)}</pre>
        </>
      )}
    </div>
  );
}

function ChatItem({ message }: ChatItemProps) {
  return (
    <div className={`chat-item ${message.role}`}>
      {message.role === 'user' ? (
        <UserContent message={message} />
      ) : message.role === 'tool' ? (
        <ToolContent message={message} />
      ) : (
        <AssistantContent message={message} />
      )}
    </div>
  );
}

export default ChatItem;
