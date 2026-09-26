import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  X,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NoSkillsState } from './ProviderEmptyStates';
import type { ProviderSkill } from '../../types';

export interface ProviderSkillsProps {
  skills: ProviderSkill[];
  onAddSkill: (skill: ProviderSkill) => void;
  onRemoveSkill: (skillId: string) => void;
  className?: string;
}

export const ProviderSkills: React.FC<ProviderSkillsProps> = ({
  skills,
  onAddSkill,
  onRemoveSkill,
  className,
}) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('General');
  const [inputError, setInputError] = useState('');

  const suggestedSkills = [
    { name: 'Ceiling Fan Installation', category: 'Electrical' },
    { name: 'Switchboard Repair', category: 'Electrical' },
    { name: 'Pipe Leakage Rectification', category: 'Plumbing' },
    { name: 'Drainage Jetting', category: 'Plumbing' },
    { name: 'Split AC Deep Servicing', category: 'HVAC' },
    { name: 'Furniture Assembly', category: 'Carpentry' },
    { name: 'Lock Replacement', category: 'Carpentry' },
    { name: 'Circuit Breaker Diagnostics', category: 'Electrical' },
  ];

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) {
      setInputError('Skill name cannot be empty.');
      return;
    }
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setInputError('This skill is already in your profile list.');
      return;
    }

    onAddSkill({
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCategory,
      experienceLevel: 'intermediate',
    });
    setNewSkillName('');
    setInputError('');
  };

  const handleAddSuggested = (suggested: { name: string; category: string }) => {
    if (skills.some((s) => s.name.toLowerCase() === suggested.name.toLowerCase())) {
      return;
    }
    onAddSkill({
      id: `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: suggested.name,
      category: suggested.category,
      experienceLevel: 'intermediate',
    });
    setInputError('');
  };

  return (
    <Card variant="default" padding="md" className={className}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs">
          <Sparkles size={16} />
          <span>Technical Capabilities</span>
        </div>
        <CardTitle className="text-lg pt-1">Skills &amp; Specialisations</CardTitle>
        <CardDescription>
          Tags and trade competencies that match customer queries and automated keyword search.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Active Skills Chips List */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-2">
            Active Provider Skills ({skills.length})
          </label>

          {skills.length === 0 ? (
            <NoSkillsState />
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-900 border border-neutral-200 text-xs font-medium group transition-all"
                >
                  <Tag size={12} className="text-neutral-500" />
                  <span>{skill.name}</span>
                  <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1.5 ml-1">
                    {skill.category}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(skill.id)}
                    aria-label={`Remove skill ${skill.name}`}
                    className="ml-1 text-neutral-400 hover:text-rose-600 rounded-full p-0.5 hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add Custom Skill Form */}
        <form onSubmit={handleAddCustom} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
          <h4 className="text-xs font-semibold text-neutral-800">Add a Custom Trade Skill</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. Inverter Wiring, Submersible Pump Repair..."
                value={newSkillName}
                onChange={(e) => {
                  setNewSkillName(e.target.value);
                  if (inputError) setInputError('');
                }}
                error={inputError}
                aria-label="Skill name"
              />
            </div>
            <div className="w-full sm:w-44">
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Skill category"
              >
                <option value="General">General</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC &amp; AC</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Appliance">Appliance Repair</option>
              </select>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Plus size={15} />}
              className="shrink-0"
            >
              Add Skill
            </Button>
          </div>
          {inputError && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle size={13} />
              <span>{inputError}</span>
            </p>
          )}
        </form>

        {/* Suggested Skills Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700">
            Suggested Trade Capabilities
          </label>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills.map((sug) => {
              const isAdded = skills.some((s) => s.name.toLowerCase() === sug.name.toLowerCase());
              return (
                <button
                  key={sug.name}
                  type="button"
                  onClick={() => !isAdded && handleAddSuggested(sug)}
                  disabled={isAdded}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isAdded
                      ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-default'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer'
                  }`}
                >
                  <Plus size={12} className={isAdded ? 'opacity-30' : 'text-primary-600'} />
                  <span>{sug.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
