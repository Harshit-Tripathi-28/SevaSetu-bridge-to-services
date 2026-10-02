import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { AiMatchExplanation } from '@sevasetu/shared';

interface AiMatchBadgeProps {
  matchExplanation?: AiMatchExplanation;
}

export const AiMatchBadge: React.FC<AiMatchBadgeProps> = ({ matchExplanation }) => {
  if (!matchExplanation) return null;

  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5' }}>
          <Sparkles style={{ width: '0.875rem', height: '0.875rem' }} />
          <span>AI Match Insights</span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
          }}
        >
          {matchExplanation.rankingAssistanceScore}% Compatibility
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
        {matchExplanation.explanations.map((exp, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem', color: '#10b981' }} />
            {exp}
          </span>
        ))}
      </div>
    </div>
  );
};
