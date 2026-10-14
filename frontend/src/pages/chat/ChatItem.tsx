import './Chat.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Message } from '@beltloop/types';

interface ChatItemProps {
  message: Message;
}

function UserContent({ message }: ChatItemProps) {
  return <>{message.content}</>;
}

function AssistantContent({ message }: ChatItemProps) {
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

// TODO: handle system messages different for compacted stuff
function ChatItem({ message }: ChatItemProps) {
  return (
    <div className={`chat-item ${message.role}`}>
      {message.role === 'user' ? (
        <UserContent message={message} />
      ) : (
        <AssistantContent message={message} />
      )}
    </div>
  );
}

export default ChatItem;
