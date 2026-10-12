export interface Message {
  id?: number;
  localId?: string; // this is used for greedy loading
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MessageUpdate {
  id?: number;
  content?: string;
}
