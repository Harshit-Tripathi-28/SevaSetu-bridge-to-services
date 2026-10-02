import React, { useState } from 'react';
import { Bot, Send, AlertTriangle, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AiClientService } from '../../services/ai.service';

interface AiSupportAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTicket?: () => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  suggestedActions?: string[];
  escalateToHuman?: boolean;
  escalationReason?: string | null;
}

export const AiSupportAssistantModal: React.FC<AiSupportAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenTicket,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your SevaSetu Support Assistant. I can help answer questions about booking lifecycles, cancellation policies, refunds, provider verification, and platform guidelines.',
      suggestedActions: ['Cancellation Policy', 'Refund Process', 'Dispute Resolution'],
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (q?: string) => {
    const questionText = q || inputQuestion.trim();
    if (!questionText || loading) return;

    setInputQuestion('');
    setMessages(prev => [...prev, { sender: 'user', text: questionText }]);
    setLoading(true);

    try {
      const res = await AiClientService.askSupport(questionText);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: res.answer,
          suggestedActions: res.suggestedActions,
          escalateToHuman: res.escalateToHuman,
          escalationReason: res.escalationReason,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to support assistant.';
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Support Notice: ${msg}. You can reach human support anytime.`,
          escalateToHuman: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SevaSetu Support Assistant"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '420px' }}>
        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {m.sender === 'bot' && (
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot style={{ width: '1rem', height: '1rem', color: '#4f46e5' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.625rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    backgroundColor: m.sender === 'user' ? '#4f46e5' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                    border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {m.text}
                </div>

                {m.escalateToHuman && (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#92400e',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AlertTriangle style={{ width: '0.875rem', height: '0.875rem' }} />
                      Human support recommended
                    </span>
                    {onOpenTicket && (
                      <Button size="sm" variant="secondary" onClick={() => { onClose(); onOpenTicket(); }}>
                        Open Ticket
                      </Button>
                    )}
                  </div>
                )}

                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {m.suggestedActions.map((act, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(act)}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '1rem',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', padding: '0.5rem' }}>
              <RefreshCw style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
              Thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <Input
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask about cancellation, refunds, bookings..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
          />
          <Button variant="primary" onClick={() => handleSend()} disabled={loading || !inputQuestion.trim()}>
            <Send style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>

        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>
          AI provides informational policy answers. Operational decisions are enforced by server business rules.
        </div>
      </div>
    </Modal>
  );
};
