import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export interface MessageComposerProps {
  onSendMessage: (content: string, attachmentName?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message to service partner...',
  className,
}) => {
  const [content, setContent] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [content]);

  const handleSend = () => {
    if ((!content.trim() && !attachmentName) || disabled) return;
    onSendMessage(content.trim(), attachmentName || undefined);
    setContent('');
    setAttachmentName(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSimulateAttachment = () => {
    // Media attachment structure
    const fileName = prompt(
      'Simulate attachment file name (e.g., photo-of-leak.jpg or meter-reading.png):',
      'photo-of-site.jpg'
    );
    if (fileName && fileName.trim()) {
      setAttachmentName(fileName.trim());
    }
  };

  return (
    <div className={cn('p-3 sm:p-4 bg-white border-t border-neutral-200', className)}>
      {/* Pending Attachment Chip */}
      {attachmentName && (
        <div className="mb-2 flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-lg text-xs text-neutral-800 w-fit">
          <Paperclip size={13} className="text-neutral-500" />
          <span className="font-medium font-mono">{attachmentName}</span>
          <button
            type="button"
            onClick={() => setAttachmentName(null)}
            className="ml-1 text-neutral-400 hover:text-neutral-700"
            aria-label="Remove attachment"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={handleSimulateAttachment}
          disabled={disabled}
          title="Add photo or document (media upload pipeline)"
          aria-label="Add attachment"
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40"
        >
          <Paperclip size={18} />
        </button>

        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            maxLength={1000}
            className={cn(
              'w-full py-2 px-3 text-xs sm:text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl resize-none',
              'focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all scrollbar-none',
              'placeholder:text-neutral-400'
            )}
            aria-label="Message text"
          />
        </div>

        {/* Send Action Button */}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={disabled || (!content.trim() && !attachmentName)}
          aria-label="Send message"
          className="h-9 px-3 shrink-0"
        >
          <Send size={15} />
        </Button>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400 px-1">
        <span>Press <kbd className="font-mono bg-neutral-100 px-1 rounded">Enter</kbd> to send, <kbd className="font-mono bg-neutral-100 px-1 rounded">Shift + Enter</kbd> for new line</span>
        <span>{content.length}/1000</span>
      </div>
    </div>
  );
};
