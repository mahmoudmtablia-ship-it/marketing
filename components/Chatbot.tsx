"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AssistantSuggestion = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  source: string | null;
};

type ChatMessage = {
  role: "user" | "bot";
  text: string;
  suggestions?: AssistantSuggestion[];
};

function formatPrice(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "I can help you narrow products, compare value, and point you to the best live catalog matches.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    const nextMessage = input.trim();
    if (!nextMessage || isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: nextMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: nextMessage }),
      });

      const payload = (await response.json()) as {
        error?: string;
        reply?: string;
        suggestions?: AssistantSuggestion[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Assistant request failed.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: payload.reply ?? "I reviewed the catalog and prepared the best next options.",
          suggestions: payload.suggestions ?? [],
        },
      ]);
    } catch (error) {
      console.error("[CHATBOT_REQUEST_ERROR]", error);
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: error instanceof Error ? error.message : "The assistant is temporarily unavailable.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/50 transition-transform hover:scale-110 hover:bg-primary/90"
        aria-label="Toggle Shopping Assistant"
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageSquare className="h-6 w-6 text-white" />}
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 sm:w-[380px]">
          <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/10 p-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Nexus Shopping Assistant</h3>
              <p className="text-xs text-muted-foreground">Live catalog guidance with AI fallback</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "border border-white/10 bg-white/5 text-foreground"
                  }`}
                >
                  <p>{message.text}</p>

                  {message.suggestions && message.suggestions.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.slice(0, 3).map((suggestion) => (
                        <Link
                          key={suggestion.id}
                          href={`/product/${suggestion.id}`}
                          className="block rounded-xl border border-white/10 bg-black/20 p-3 transition-colors hover:border-primary/40 hover:bg-primary/10"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{suggestion.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {suggestion.category} - {formatPrice(suggestion.price)}
                                {suggestion.source ? ` - ${suggestion.source}` : ""}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Checking the live catalog...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-black/20 p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSend();
                  }
                }}
                placeholder="Ask for deals, alternatives, or category picks..."
                className="h-10 rounded-xl border-white/10 bg-background/50 text-sm focus-visible:ring-primary/50"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => void handleSend()}
                className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
