import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Clock, Calendar, MapPin, Layers, RefreshCw, ArrowRight } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Select } from '../../ui/Select';
import { Badge } from '../../ui/Badge';
import { Alert } from '../../ui/Alert';
import { AiClientService } from '../../../services/ai.service';
import type { AiServiceRequestIntent, ServiceCategory } from '@sevasetu/shared';

interface AiServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  onApplySearch: (params: {
    categorySlug?: string;
    keyword?: string;
    date?: string;
    time?: string;
  }) => void;
}

export const AiServiceRequestModal: React.FC<AiServiceRequestModalProps> = ({
  isOpen,
  onClose,
  categories,
  onApplySearch,
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedIntent, setParsedIntent] = useState<AiServiceRequestIntent | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await AiClientService.parseServiceRequest(inputText.trim());
      setParsedIntent(res.structuredRequest);
      setMissingFields(res.missingFields || []);
      setExplanation(res.explanation?.summary || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze request. Please try the standard search.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndSearch = async () => {
    if (!parsedIntent) return;

    try {
      await AiClientService.confirmServiceRequest(parsedIntent);
    } catch {
      // Confirmation telemetry optional; proceed to search regardless
    }

    onApplySearch({
      categorySlug: parsedIntent.categorySlug || undefined,
      keyword: parsedIntent.serviceSlug || undefined,
      date: parsedIntent.requestedDate || undefined,
      time: parsedIntent.preferredStartTime || undefined,
    });
    onClose();
  };

  const updateField = <K extends keyof AiServiceRequestIntent>(key: K, value: AiServiceRequestIntent[K]) => {
    if (!parsedIntent) return;
    setParsedIntent({
      ...parsedIntent,
      [key]: value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Intelligent Service Assistant"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Intro Banner */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#6366f1', flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
              Describe what you need in natural language
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', lineHeight: '1.4' }}>
              Type your requirements in Hindi, English, or mixed language. AI will extract the service, timing, frequency, and trade requirements for your confirmation.
            </div>
          </div>
        </div>

        {/* Input Textarea */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
            What service do you need?
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 'Mere ghar mein 3 rooms hain aur har Sunday deep cleaning chahiye, subah 10 baje ke baad.' or 'Urgent plumber needed for bathroom pipe leak.'"
            rows={3}
            disabled={isAnalyzing}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {inputText.length} / 1000 characters
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Analysis Notice">
            {error}
          </Alert>
        )}

        {/* Structured Interpretation Results */}
        {parsedIntent && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                  Extracted Requirements (Editable)
                </span>
              </div>
              <Badge variant={parsedIntent.confidence > 0.8 ? 'success' : 'warning'}>
                Confidence: {Math.round(parsedIntent.confidence * 100)}%
              </Badge>
            </div>

            {explanation && (
              <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', background: '#fff', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #edf2f7' }}>
                &ldquo;{explanation}&rdquo;
              </div>
            )}

            {missingFields.length > 0 && (
              <Alert variant="warning" title="Missing Required Information">
                Please review or specify the following fields before booking: <strong>{missingFields.join(', ')}</strong>.
              </Alert>
            )}

            {/* Editable Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  <Layers style={{ width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '0.25rem' }} />
                  Service Category
                </label>
                <Select
                  value={parsedIntent.categorySlug || ''}
                  onChange={(e) => updateField('categorySlug', e.target.value || null)}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(c => ({ value: c.slug, label: c.name })),
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  <Calendar style={{ width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '0.25rem' }} />
                  Requested Date
                </label>
                <Input
                  type="date"
                  value={parsedIntent.requestedDate || ''}
                  onChange={(e) => updateField('requestedDate', e.target.value || null)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  <Clock style={{ width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '0.25rem' }} />
                  Start Time
                </label>
                <Input
                  type="time"
                  value={parsedIntent.preferredStartTime || ''}
                  onChange={(e) => updateField('preferredStartTime', e.target.value || null)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  <MapPin style={{ width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '0.25rem' }} />
                  Recurrence
                </label>
                <Select
                  value={parsedIntent.recurrence}
                  onChange={(e) => updateField('recurrence', e.target.value as AiServiceRequestIntent['recurrence'])}
                  options={[
                    { value: 'ONE_OFF', label: 'One-off Job' },
                    { value: 'DAILY', label: 'Daily Service' },
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'MONTHLY', label: 'Monthly' },
                  ]}
                />
              </div>
            </div>

            {/* Task Scope Details */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                Task Details & Scope
              </label>
              <Input
                type="text"
                value={parsedIntent.taskDescription}
                onChange={(e) => updateField('taskDescription', e.target.value)}
                placeholder="Specific job requirements"
              />
            </div>

            {/* Confirm & Proceed Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAndSearch}
              >
                Confirm & Search Providers
                <ArrowRight style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
