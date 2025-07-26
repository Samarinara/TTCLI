"use client";

import type { User, Message } from "@/lib/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Autotype } from "./Autotype";
import { Crown, Send, User as UserIcon, Users } from "lucide-react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { ref, onValue, set, push, onDisconnect, serverTimestamp } from "firebase/database";

// --- Main Terminal Component ---
export function WhisperNetTerminal() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGm, setIsGm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gmId, setGmId] = useState<string | null>(null);
  const firebaseConfigured = isFirebaseConfigured();

  // --- Firebase Listeners ---
  useEffect(() => {
    if (!firebaseConfigured || !db || !currentUser) return;

    // Set up listeners only when a user is logged in
    const usersRef = ref(db, 'users');
    const messagesRef = ref(db, 'messages');
    const gmIdRef = ref(db, 'gmId');

    const usersListener = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setUsers(data ? Object.values(data) : []);
    });

    const messagesListener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages: Message[] = [];
      if (data) {
        for (const id in data) {
          loadedMessages.push({ id, ...data[id] });
        }
      }
      loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loadedMessages);
    });

    const gmIdListener = onValue(gmIdRef, (snapshot) => {
      const newGmId = snapshot.val();
      setGmId(newGmId);
    });

    // Cleanup function
    return () => {
      usersListener();
      messagesListener();
      gmIdListener();
    };
  }, [currentUser, firebaseConfigured]);

  // Effect to update isGm state whenever gmId or currentUser changes
  useEffect(() => {
    if (currentUser && gmId) {
      setIsGm(currentUser.id === gmId);
    } else {
      setIsGm(false);
    }
  }, [currentUser, gmId]);


  // --- Core Actions ---
  const handleLogin = (name: string) => {
    if (!firebaseConfigured || !db) return;
    const newUser: User = { id: crypto.randomUUID(), name };
    
    const userRef = ref(db, `users/${newUser.id}`);
    set(userRef, newUser);
    onDisconnect(userRef).remove();

    const gmIdRef = ref(db, 'gmId');
    onValue(gmIdRef, (snapshot) => {
      if (!snapshot.exists()) {
        set(gmIdRef, newUser.id);
        addMessage(`SYSTEM: ${name} has initiated the session as Game Master.`, 'system');
        onDisconnect(gmIdRef).remove(); // If GM disconnects, clear the GM ID
      } else {
        addMessage(`SYSTEM: ${name} has connected.`, 'system');
      }
    }, { onlyOnce: true });
    
    // Set current user after setting up Firebase logic
    setCurrentUser(newUser);
  };

  const addMessage = (text: string, type: Message['type'], sender?: string) => {
    if (!firebaseConfigured || !db || !currentUser) return;
    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);
    const newMessage: Omit<Message, 'id' | 'timestamp'> & { timestamp: object } = {
      text,
      sender: sender || currentUser.name,
      type,
      timestamp: serverTimestamp(),
    };
    set(newMessageRef, newMessage);
  };

  const transferGm = (newGmId: string) => {
    if (!firebaseConfigured || !db) return;
    const newGm = users.find(u => u.id === newGmId);
    if (!newGm || !currentUser || !isGm) return;

    const gmIdRef = ref(db, 'gmId');
    set(gmIdRef, newGmId);
    // The new GM's onDisconnect is already set up when they logged in.
    // We just need to remove the onDisconnect for the old GM's gmId reference.
    onDisconnect(ref(db, 'gmId')).cancel();
    onDisconnect(ref(db, `users/${newGmId}`)).remove(); // Ensure new GM is removed
    onDisconnect(ref(db, 'gmId')).remove(); // And becomes the new GM to be removed

    addMessage(`SYSTEM: GM powers transferred to ${newGm.name}.`, 'system');
  };

  if (!firebaseConfigured) {
    return (
        <div className="flex items-center justify-center h-screen w-screen p-4">
            <Card className="w-full max-w-lg bg-transparent border-dashed text-center">
                <CardHeader>
                    <CardTitle className="text-shadow-glow text-destructive">FIREBASE NOT CONFIGURED</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>This application requires a Firebase Realtime Database to function.</p>
                    <p>Please create a Firebase project, enable the Realtime Database, and paste your configuration object into the <code className="bg-muted p-1 rounded">src/lib/firebase.ts</code> file.</p>
                    <p>You can find your config in your Firebase project settings.</p>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen p-2 sm:p-4">
      <div className="flex flex-col md:flex-row w-full h-full border border-accent p-2 gap-4">
        <div className="flex-grow flex flex-col h-full overflow-hidden">
          <MessageFeed messages={messages} currentUser={currentUser} isGm={isGm} gmId={gmId} />
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

  if (booting) {
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

function MessageFeed({ messages, currentUser, isGm, gmId }: { messages: Message[], currentUser: User, isGm: boolean, gmId: string | null }) {
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
    if (isGm) return true; // GM sees all
    if (msg.type === 'system' || msg.type === 'broadcast') return true; // Everyone sees system and broadcast
    if (msg.type === 'private') {
        // Player sees their own private messages to GM
        return msg.sender === currentUser.name;
    }
    // Default to not showing other message types to non-GMs
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
                // GM sees who sent the DM
                return `[DM from ${senderName.toUpperCase()}] >`;
             } else {
                // Player just sees their message to GM
                return `[DM to GM] >`;
             }
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
