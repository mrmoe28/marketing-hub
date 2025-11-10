"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, History, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChatHistory } from "@/components/ChatHistory";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  actions?: string[]; // Track which tools were executed
}

export function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentActions, setCurrentActions] = useState<string[]>([]);
  const [includeClientData, setIncludeClientData] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadConversation = async (id: string | null) => {
    if (!id) {
      startNewConversation();
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConversationId(id);
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          includeClientData,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Show which tools were executed (for visual feedback during processing)
      if (data.executedTools && data.executedTools.length > 0) {
        setCurrentActions(data.executedTools);
        // Brief delay to show the actions before clearing
        setTimeout(() => setCurrentActions([]), 500);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          actions: data.executedTools
        },
      ]);

      // Update conversation ID if this was a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCurrentActions([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all z-50"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1100px] max-h-[85vh] flex">
        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="w-64 border-r flex-shrink-0 overflow-hidden">
            <ChatHistory
              currentConversationId={conversationId}
              onSelectConversation={loadConversation}
              onNewConversation={startNewConversation}
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>AI Agent</DialogTitle>
                  <DialogDescription>
                    Ask questions about your clients and data
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="include-data"
                checked={includeClientData}
                onCheckedChange={setIncludeClientData}
              />
              <Label htmlFor="include-data" className="text-xs text-muted-foreground cursor-pointer">
                Include my client data in context
              </Label>
            </div>
          </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/10 to-violet-600/10 mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">How can I help?</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask me about your clients, get insights, or ask general questions about email marketing.
              </p>
              <div className="grid grid-cols-1 gap-2 mt-6 w-full">
                <button
                  onClick={() => setInput("How many clients do I have?")}
                  className="text-sm p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  How many clients do I have?
                </button>
                <button
                  onClick={() => setInput("What custom fields are available?")}
                  className="text-sm p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  What custom fields are available?
                </button>
                <button
                  onClick={() => setInput("Show me clients in Georgia")}
                  className="text-sm p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  Show me clients in Georgia
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "assistant" ? "" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-blue-600 to-violet-600"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs font-medium">You</span>
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg p-3 ${
                    msg.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                      {msg.actions.map((action, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium"
                        >
                          <Zap className="h-3 w-3" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {currentActions.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {currentActions.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 text-blue-500" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
