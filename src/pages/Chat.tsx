import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatAPI } from '@/lib/api';
import { ChatMessage, ChatConversation } from '@/types';
import { Send, Bot, User, Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const CHATS_KEY = 'medchat_conversations';

const Chat = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(CHATS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setConversations(parsed);
      if (parsed.length > 0) {
        setActiveConversationId(parsed[0].id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHATS_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, activeConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const createNewConversation = () => {
    const newConversation: ChatConversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
    toast({
      title: 'Conversation deleted',
      description: 'The conversation has been removed.',
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    let conversationId = activeConversationId;

    if (!conversationId) {
      const newConversation: ChatConversation = {
        id: crypto.randomUUID(),
        title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations(prev => [newConversation, ...prev]);
      conversationId = newConversation.id;
      setActiveConversationId(conversationId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              title: c.messages.length === 0 ? inputMessage.slice(0, 30) + (inputMessage.length > 30 ? '...' : '') : c.title,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Conversation List */}
      <div className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border">
          <Button onClick={createNewConversation} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200",
                  activeConversationId === conversation.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary text-foreground"
                )}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{conversation.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {activeConversation?.messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-slide-in-left",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            {!activeConversation && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to MedChat</h2>
                <p className="text-muted-foreground max-w-md">
                  Start a conversation about medical imaging, PACS configurations, or any other topic.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card/50">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
