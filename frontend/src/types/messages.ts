export interface ToolContent {
  name: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
}

export interface MessageEvent {
  data?: string;
  tool_call?: Omit<ToolContent, 'result'>;
  tool_result?: ToolContent;
  user_message_id?: number;
  assistant_message_id?: number;
  done?: boolean;
  tokens?: number;
  error?: string;
  compacting?: CompactingMessage;
}

export interface BaseMessage {
  id?: number;
  localId?: string; // this is used for optimistic tracking
  tokens?: number;
  display_content?: string;
}

export interface StringMessage extends BaseMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolMessage extends BaseMessage {
  role: 'tool';
  content: ToolContent;
}

export interface CompactingMessage {
  in_progress: boolean;
  message: StringMessage;
}

export type Message = StringMessage | ToolMessage;

export interface MessageUpdate {
  id?: number;
  content?: string;
  replaceContent?: string;
  mergeToolContent?: Partial<ToolContent>;
  tokens?: number;
}
