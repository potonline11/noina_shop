/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles, HelpCircle, RefreshCw, Smartphone, Award, GraduationCap } from 'lucide-react';

interface AIChatWidgetProps {
  products: Product[];
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Inline formatting for strong, italic, and code blocks
const formatInlineMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 font-sans">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 font-sans">$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] text-indigo-600">$1</code>');
};

export default function AIChatWidget({ products }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `สวัสดีครับ! ยินดีต้อนรับสู่ **Noina AI Support** 🤖✨\n\nผมเป็นผู้ช่วยอัจฉริยะที่ช่วยตอบทุกข้อสงสัยเกี่ยวกับสินค้าไอทีมือสองคัดเกรดพรีเมียม และคำนวณแผนสร้างรายได้แบบเครือข่าย **NLM (Noina Line Marketing)** ของร้าน Noinashop ครับ!\n\n**ท่านอยากให้ผมช่วยเหลือเรื่องอะไรดีครับวันนี้?** สามารถกดดูหัวข้อแนะนำด้านล่าง หรือพิมพ์ถามคำถามที่ท่านต้องการได้เลยครับ`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Suggested questions for easier onboarding
  const suggestions = [
    { text: 'แผน NLM ปันผลยังไงบ้าง?', icon: <Award className="w-3 h-3 text-indigo-500" /> },
    { text: 'แนะนำมือสองงบไม่เกิน 2 หมื่น', icon: <Smartphone className="w-3 h-3 text-emerald-500" /> },
    { text: 'คะแนน BV คืออะไร เอาไปใช้ทำอะไร?', icon: <GraduationCap className="w-3 h-3 text-amber-500" /> },
    { text: 'อยากเลื่อนตำแหน่งเป็น Gold ต้องทำไง?', icon: <Sparkles className="w-3 h-3 text-cyan-500" /> }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Send chat request to our Express server backend route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          // Exclude first greeting message to save context tokens, map rest
          history: messages.slice(1),
          products: products
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'การเชื่อมต่อระบบ AI ล้มเหลว');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          text: `❌ ขออภัยด้วยครับ เกิดข้อผิดพลาดทางเทคนิค:\n\n*${err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ AI ได้ โปรดลองใหม่อีกครั้งในภายหลัง'}*` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const clearChatHistory = () => {
    if (window.confirm('ต้องการล้างประวัติการสนทนาทั้งหมดใช่หรือไม่?')) {
      setMessages([
        {
          role: 'assistant',
          text: `สวัสดีครับ! ผม **Noina AI Support** 🤖 ยินดีต้อนรับกลับมาครับ มีคำถามเกี่ยวกับสินค้าในร้านหรือคำนวณคะแนนปันผลสายงาน NLM ถามผมได้เลยครับ!`
        }
      ]);
    }
  };

  // Safe custom Markdown formatter supporting headers, bulleted lists, numbered lists, and inline tags
  const renderMessageText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      let className = "text-xs md:text-sm leading-relaxed";
      
      // Headers
      if (content.startsWith('### ')) {
        content = content.replace('### ', '');
        className = "font-extrabold text-slate-800 text-xs md:text-sm mt-3 mb-1.5 block font-sans";
      } else if (content.startsWith('## ')) {
        content = content.replace('## ', '');
        className = "font-extrabold text-indigo-900 text-sm md:text-base mt-4 mb-2 block border-b border-indigo-50/50 pb-1 font-sans";
      } else if (content.startsWith('# ')) {
        content = content.replace('# ', '');
        className = "font-black text-indigo-950 text-base md:text-lg mt-5 mb-3 block border-b border-indigo-100 pb-1 font-sans";
      }
      
      // Bullets
      const isBullet = content.trim().startsWith('- ') || content.trim().startsWith('* ');
      if (isBullet) {
        content = content.replace(/^[\s]*[-*]\s+/, '');
        return (
          <div key={idx} className="flex gap-2 ml-2 my-1 leading-relaxed">
            <span className="text-indigo-500 font-bold shrink-0 select-none">•</span>
            <span className="text-xs md:text-sm text-slate-600 font-sans" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
          </div>
        );
      }
      
      // Numbered Lists
      const numRegex = /^[\s]*(\d+)\.\s+/;
      if (numRegex.test(content)) {
        const match = content.match(numRegex);
        if (match) {
          const num = match[1];
          content = content.replace(numRegex, '');
          return (
            <div key={idx} className="flex gap-2 ml-2 my-1 leading-relaxed">
              <span className="text-indigo-600 font-bold shrink-0 select-none">{num}.</span>
              <span className="text-xs md:text-sm text-slate-600 font-sans" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
            </div>
          );
        }
      }
      
      // Blank Space Lines
      if (!content.trim()) {
        return <div key={idx} className="h-2" />;
      }
      
      return (
        <p key={idx} className={`${className} my-1 text-slate-600 font-sans`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
      );
    });
  };

  return (
    <>
      {/* 1. FLOATING CHAT LAUNCHER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl focus:outline-none transition-colors ${
            isOpen ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          id="ai-chat-launcher"
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-none" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6 animate-bounce" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
          )}
        </motion.button>
      </div>

      {/* 2. CHAT PANEL SCREEN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 md:right-6 w-[92vw] sm:w-[420px] h-[550px] max-h-[80vh] bg-white rounded-2xl border border-slate-150 shadow-2xl flex flex-col z-50 overflow-hidden"
            id="ai-chat-panel"
          >
            {/* PANEL HEADER */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                  <Bot className="w-5 h-5 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold tracking-wide flex items-center gap-1">
                    Noina AI Support
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-bold text-emerald-300 uppercase tracking-widest rounded-md select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">ตอบคำถาม แนะนำสินค้า และแผนธุรกิจ NLM</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChatHistory}
                  title="ล้างประวัติการสนทนา"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* MESSAGES VIEWPORT CONTAINER */}
            <div 
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto p-4 bg-slate-50 space-y-4"
              id="chat-messages-container"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Role Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold text-xs' 
                        : 'bg-white border-slate-200 text-indigo-600'
                    }`}>
                      {msg.role === 'user' ? 'ME' : <Bot className="w-4 h-4 text-indigo-600" />}
                    </div>

                    {/* Chat Bubble Box */}
                    <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm border ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
                        : 'bg-white border-slate-150 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                      ) : (
                        <div className="space-y-1">
                          {renderMessageText(msg.text)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loader indicator while fetching */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-indigo-600 shadow-sm">
                      <Bot className="w-4 h-4 text-indigo-600 animate-spin" />
                    </div>
                    <div className="bg-white border border-slate-150 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      <span className="text-xs text-slate-500 font-sans font-medium">Noina AI กำลังคิดหาคำตอบให้ท่าน...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* SUGGESTION CHIPS BOX */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion.text)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-full text-[10px] md:text-xs font-semibold text-slate-600 hover:text-indigo-700 transition flex items-center gap-1 shrink-0 shadow-sm"
                >
                  {suggestion.icon}
                  {suggestion.text}
                </button>
              ))}
            </div>

            {/* CHAT INPUT FORM */}
            <form 
              onSubmit={handleFormSubmit}
              className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ถาม Noina AI เกี่ยวกับแผนธุรกิจหรือข้อมูลสินค้า..."
                disabled={loading}
                className="flex-grow px-3.5 py-2 text-xs md:text-sm rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
