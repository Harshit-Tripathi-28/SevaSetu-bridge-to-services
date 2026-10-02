import React, { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, AlertCircle, MessageSquareQuote, RefreshCw } from 'lucide-react';
import { AiClientService } from '../../../services/ai.service';
import type { AiReviewSummaryRecord } from '@sevasetu/shared';

interface AiReviewSummaryCardProps {
  providerProfileId: string;
}

export const AiReviewSummaryCard: React.FC<AiReviewSummaryCardProps> = ({ providerProfileId }) => {
  const [summary, setSummary] = useState<AiReviewSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const data = await AiClientService.getReviewSummary(providerProfileId);
        if (isMounted) {
          setSummary(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load review summary');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (providerProfileId) {
      loadSummary();
    }

    return () => {
      isMounted = false;
    };
  }, [providerProfileId]);

  if (loading) {
    return (
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
        <span>Synthesizing verified reviews with AI...</span>
      </div>
    );
  }

  if (error || !summary || !summary.isSufficientData) {
    return (
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#64748b',
          fontSize: '0.85rem',
        }}
      >
        <MessageSquareQuote style={{ width: '1.25rem', height: '1.25rem', color: '#94a3b8', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 600 }}>AI Review Summary: </span>
          {summary?.summaryText || 'Insufficient verified review data to generate an automated summary. Real reviews are listed below.'}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
          <Sparkles style={{ width: '1.125rem', height: '1.125rem', color: '#6366f1' }} />
          <span>AI Summary of Verified Reviews</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Based on {summary.reviewCountAnalyzed} verified reviews
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: '1.5' }}>
        {summary.summaryText}
      </p>

      {summary.positiveThemes && summary.positiveThemes.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <ThumbsUp style={{ width: '0.875rem', height: '0.875rem' }} />
            <span>Key Customer Highlights</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {summary.positiveThemes.map((theme, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                }}
              >
                ✓ {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {summary.areasForImprovement && summary.areasForImprovement.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <AlertCircle style={{ width: '0.875rem', height: '0.875rem' }} />
            <span>Constructive Feedback Noted</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {summary.areasForImprovement.map((area, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                }}
              >
                • {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
