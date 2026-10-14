export interface Message {
  id?: number;
  localId?: string; // this is used for greedy loading
  role: 'user' | 'assistant' | 'system';
  tokens?: number;
  content: string;
  display_content?: string;
}

export interface MessageUpdate {
  id?: number;
  content?: string;
  replaceContent?: string;
  tokens?: number;
}
