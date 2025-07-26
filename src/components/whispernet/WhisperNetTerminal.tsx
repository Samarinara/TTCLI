"use client";

import type { User, Message } from "@/lib/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Autotype } from "./Autotype";
import { Crown, Send, User as UserIcon, Users } from "lucide-react";

// --- Main Terminal Component ---
export function WhisperNetTerminal() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGm, setIsGm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gmId, setGmId] = useState<string | null>(null);

  const LOCAL_STORAGE_PREFIX = "whispernet_";

  // --- State Synchronization with LocalStorage ---
  const loadState = useCallback(() => {
    try {
      const storedUser = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}user`);
      const storedIsGm = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}is_gm`);
      const storedUsers = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}users`);
      const storedMessages = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}messages`);
      const storedGmId = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}gm_id`);

      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedIsGm) setIsGm(JSON.parse(storedIsGm));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedMessages) setMessages(JSON.parse(storedMessages));
      if (storedGmId) setGmId(JSON.parse(storedGmId));

    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, [loadState]);

  const saveState = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, []);

  // --- Core Actions ---
  const handleLogin = (name: string) => {
    const newUser: User = { id: crypto.randomUUID(), name };
    setCurrentUser(newUser);
    saveState("user", newUser);

    const currentUsers = JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}users`) || '[]');
    const updatedUsers = [...currentUsers, newUser];
    setUsers(updatedUsers);
    saveState("users", updatedUsers);
    
    const currentGmId = JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}gm_id`) || 'null');
    if (!currentGmId) {
      setIsGm(true);
      setGmId(newUser.id);
      saveState("is_gm", true);
      saveState("gm_id", newUser.id);
      addMessage(`SYSTEM: ${newUser.name} has initiated the session as Game Master.`, 'system');
    } else {
        setIsGm(false);
        saveState("is_gm", false);
        addMessage(`SYSTEM: ${newUser.name} has connected.`, 'system');
    }
  };
  
  const addMessage = (text: string, type: Message['type'], sender?: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      text,
      sender: sender || (currentUser?.name ?? "Unknown"),
      type,
      timestamp: Date.now(),
    };
    const updatedMessages = [...JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}messages`) || '[]'), newMessage];
    setMessages(updatedMessages);
    saveState("messages", updatedMessages);
  };
  
  const transferGm = (newGmId: string) => {
    const newGm = users.find(u => u.id === newGmId);
    if (!newGm || !currentUser || !isGm) return;
    
    setGmId(newGmId);
    saveState("gm_id", newGmId);
    
    if (currentUser.id === newGmId) {
        setIsGm(true);
        saveState("is_gm", true);
    } else if (currentUser.id === gmId) {
        setIsGm(false);
        saveState("is_gm", false);
    }

    addMessage(`SYSTEM: GM powers transferred to ${newGm.name}.`, 'system');
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen p-2 sm:p-4">
      <div className="flex flex-col md:flex-row w-full h-full border border-accent p-2 gap-4">
        <div className="flex-grow flex flex-col h-full overflow-hidden">
          <MessageFeed messages={messages} currentUser={currentUser} isGm={isGm} />
          <InputLine onSendMessage={addMessage} isGm={isGm} />
        </div>
        {isGm && <GmDashboard users={users} gmId={gmId} onTransferGm={transferGm} />}
      </div>
    </div>
  );
}

// --- Sub-components ---

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');
  const [booting, setBooting] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  if(booting) {
    return (
        <div className="flex items-center justify-center h-screen w-screen">
            <Autotype text="INITIALIZING WHISPERNET v1.0..." />
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <Card className="w-full max-w-sm bg-transparent border-dashed">
        <CardHeader>
          <CardTitle className="text-shadow-glow">
            <Autotype text="AUTHENTICATION REQUIRED" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username">ENTER CALLSIGN:</label>
              <Input
                id="username"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 bg-input text-foreground focus:ring-primary"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground">
              CONNECT
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageFeed({ messages, currentUser, isGm }: { messages: Message[], currentUser: User, isGm: boolean }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);
  
  const filteredMessages = messages.filter(msg => {
      if (msg.type === 'system' || msg.type === 'broadcast') return true;
      if (isGm) return true; // GM sees all
      if (msg.sender === currentUser.name) return true; // Player sees their own DMs
      return false;
  });

  return (
    <ScrollArea className="flex-grow p-2" ref={scrollAreaRef}>
      <div className="space-y-2">
        {filteredMessages.map((msg) => (
          <div key={msg.id}>
            <Autotype
              text={`${getPrefix(msg, currentUser, isGm)} ${msg.text}`}
              className={msg.type === 'system' ? 'text-accent-foreground' : ''}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function getPrefix(msg: Message, currentUser: User, isGm: boolean): string {
    const senderName = msg.sender === currentUser.name ? 'you' : msg.sender;
    switch (msg.type) {
        case 'system':
            return `[SYSTEM] >`;
        case 'broadcast':
            return `[${senderName.toUpperCase()}] >`;
        case 'private':
             if (isGm) {
                return `[DM from ${senderName.toUpperCase()}] >`;
             }
             return `[DM to GM] >`;
        default:
            return `[${senderName.toUpperCase()}] >`
    }
}

function InputLine({ onSendMessage, isGm }: { onSendMessage: (text: string, type: Message['type']) => void, isGm: boolean }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const type = isGm ? 'broadcast' : 'private';
      onSendMessage(inputValue.trim(), type);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-t border-accent">
      <span className="text-shadow-glow">{isGm ? "GM_BROADCAST" : "DIRECT_MSG_GM"}:/&gt;</span>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
        autoComplete="off"
      />
      <Button type="submit" variant="ghost" size="icon">
        <Send className="h-4 w-4" />
      </Button>
      <span className="cursor-blink">_</span>
    </form>
  );
}

function GmDashboard({ users, gmId, onTransferGm }: { users: User[], gmId: string | null, onTransferGm: (id: string) => void }) {
  return (
    <Card className="md:w-64 lg:w-72 flex-shrink-0 border-dashed bg-transparent h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-shadow-glow flex items-center gap-2"><Users/> GM Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden flex flex-col">
          <h3 className="text-lg mb-2 flex items-center gap-2"><UserIcon/> Connected Users</h3>
        <ScrollArea className="flex-grow pr-2">
            <div className="space-y-2">
            {users.map((user) => (
                <div key={user.id} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                    {user.id === gmId ? <Crown className="w-4 h-4 text-primary"/> : <div className="w-4 h-4"/>}
                    {user.name}
                </span>
                {user.id !== gmId && (
                    <Button variant="ghost" size="sm" onClick={() => onTransferGm(user.id)}>
                        Make GM
                    </Button>
                )}
                </div>
            ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
