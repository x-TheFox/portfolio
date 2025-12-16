'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePersona } from '@/hooks/usePersona';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Minimize2,
  Maximize2,
  Bot,
  User
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'chat_messages';
const MAX_STORED_MESSAGES = 50; // Limit stored messages to prevent storage overflow

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { persona, classification } = usePersona();

  // Load messages from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const restoredMessages = parsed.map((m: Message & { timestamp: string }) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restoredMessages);
      }
    } catch (error) {
      console.error('Failed to restore chat messages:', error);
    }
    setIsInitialized(true);
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      // Only store the most recent messages to prevent overflow
      const messagesToStore = messages.slice(-MAX_STORED_MESSAGES);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore));
    } catch (error) {
      console.error('Failed to save chat messages:', error);
    }
  }, [messages, isInitialized]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Add initial greeting based on persona (only if no restored messages)
  useEffect(() => {
    if (isOpen && isInitialized && messages.length === 0) {
      const greeting = getPersonaGreeting(persona);
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, persona, messages.length, isInitialized]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          persona,
          confidence: classification?.confidence,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage.content += chunk;
          setMessages(prev => 
            prev.map(m => m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m)
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-14 h-14 rounded-full',
              'bg-blue-600 text-white shadow-lg',
              'hover:bg-blue-500 transition-colors',
              'flex items-center justify-center'
            )}
            aria-label="Open chat"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px',
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-[380px] max-w-[calc(100vw-48px)]',
              'bg-zinc-900 border border-zinc-800 rounded-2xl',
              'shadow-2xl overflow-hidden flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-blue-400" />
                <span className="font-medium text-white">Portfolio Assistant</span>
                {classification?.confidence && classification.confidence > 0.6 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    {persona} mode
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      rows={1}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg resize-none',
                        'bg-zinc-800 border border-zinc-700',
                        'text-white placeholder-zinc-500',
                        'focus:outline-none focus:border-blue-500',
                        'text-sm'
                      )}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        'p-2 rounded-lg',
                        'bg-blue-600 text-white',
                        'hover:bg-blue-500 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <motion.div 
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative',
          isUser ? 'bg-gradient-to-br from-zinc-600 to-zinc-700' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
        )}
        whileHover={{ scale: 1.1 }}
      >
        {!isUser && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </motion.div>

      {/* Content */}
      <div className={cn(
        'max-w-[80%] px-3 py-2 rounded-xl relative overflow-hidden',
        isUser 
          ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-white' 
          : 'bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 text-zinc-200 border border-zinc-700/50'
      )}>
        {!isUser && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />
        )}
        <div className="relative chat-message-content">
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ChatMarkdown content={message.content} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm prose prose-sm prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed prose-headings:my-2 prose-pre:my-2 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/50 prose-a:text-cyan-400 prose-strong:text-white prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
      <MarkdownRenderer content={content} compact />
    </div>
  );
}

function getPersonaGreeting(persona: string): string {
  const greetings: Record<string, string> = {
    recruiter: "Hi! I'm here to help you learn about my experience and qualifications. Feel free to ask about my background, skills, or availability.",
    engineer: "Hey! Want to dive into some technical details? I can explain my projects, discuss architecture decisions, or share code samples.",
    designer: "Hello! I'd love to walk you through my design process. Ask me about any project or my approach to UX/UI.",
    cto: "Welcome! Happy to discuss system architecture, team leadership experience, or technical strategy. What would you like to know?",
    gamer: "Hey there! 🎮 Want to chat about game dev, check out some demos, or just talk about cool interactive stuff?",
    curious: "Hi! I'm here to help you explore. What brings you to my portfolio today?",
  };
  return greetings[persona] || greetings.curious;
}
