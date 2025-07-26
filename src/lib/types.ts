export type User = {
  id: string;
  name: string;
};

export type Message = {
  id: string;
  text: string;
  sender: string;
  type: 'broadcast' | 'private' | 'system';
  timestamp: number;
};
