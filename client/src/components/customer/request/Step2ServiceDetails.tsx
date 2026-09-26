import React from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, Wrench } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import type { RequestFormErrors } from '../../../types';

export interface Step2ServiceDetailsProps {
  serviceType: string;
  onChangeServiceType: (value: string) => void;
  descriptionOfWork: string;
  onChangeDescriptionOfWork: (value: string) => void;
  taskCount: number;
  onChangeTaskCount: (value: number) => void;
  duration: string;
  onChangeDuration: (value: string) => void;
  errors: RequestFormErrors;
  onBack: () => void;
  onContinue: () => void;
}

export const Step2ServiceDetails: React.FC<Step2ServiceDetailsProps> = ({
  serviceType,
  onChangeServiceType,
  descriptionOfWork,
  onChangeDescriptionOfWork,
  taskCount,
  onChangeTaskCount,
  duration,
  onChangeDuration,
  errors,
  onBack,
  onContinue,
}) => {
  const serviceTypeOptions = [
    { value: '', label: 'Select service type...' },
    { value: 'installation', label: 'Installation / New Setup' },
    { value: 'repair', label: 'Repair / Fault Rectification' },
    { value: 'maintenance', label: 'General Maintenance & Servicing' },
    { value: 'replacement', label: 'Replacement / Component Upgrade' },
    { value: 'inspection', label: 'Inspection / Diagnostic Assessment' },
  ];

  const durationOptions = [
    { value: '1-2', label: 'Short Task / Inspection (1–2 Hours)' },
    { value: 'half-day', label: 'Half Day Task (3–4 Hours)' },
    { value: 'full-day', label: 'Full Day Service (6–8 Hours)' },
    { value: 'flexible', label: 'Flexible / Estimated on-site' },
  ];

  return (
    <Card variant="default" padding="md" className="bg-white space-y-6">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
          <Wrench size={16} />
          <span>Step 2: Service Parameters</span>
        </div>
        <CardTitle>Specify Service Details</CardTitle>
        <CardDescription>
          Help the professional understand the exact nature and scale of work required.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Service Type Selection */}
        <Select
          label="Service Type / Nature of Task"
          value={serviceType}
          onChange={(e) => onChangeServiceType(e.target.value)}
          options={serviceTypeOptions}
          error={errors.serviceType}
          required
          helperText="Select whether this is an install, repair, replacement, or inspection."
        />

        {/* Detailed Work Scope */}
        <Textarea
          label="Specific Scope of Work"
          rows={3}
          value={descriptionOfWork}
          onChange={(e) => onChangeDescriptionOfWork(e.target.value)}
          placeholder="e.g. Model number, specific parts involved, location of the appliance, known symptoms..."
          error={errors.descriptionOfWork}
          required
          helperText="Add technical details, appliance models, or specific instructions."
        />

        {/* Task Count Stepper & Duration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Stepper Control */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800">
              Number of Units / Items / Rooms
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onChangeTaskCount(Math.max(1, taskCount - 1))}
                disabled={taskCount <= 1}
                aria-label="Decrease task count"
                className="w-10 h-10 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Minus size={16} />
              </button>

              <span className="w-12 text-center font-mono font-bold text-base text-neutral-900">
                {taskCount}
              </span>

              <button
                type="button"
                onClick={() => onChangeTaskCount(Math.min(10, taskCount + 1))}
                disabled={taskCount >= 10}
                aria-label="Increase task count"
                className="w-10 h-10 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-[11px] text-neutral-600">
              Quantity of items or fixtures requiring attention.
            </p>
          </div>

          {/* Expected Duration */}
          <Select
            label="Estimated Service Duration"
            value={duration}
            onChange={(e) => onChangeDuration(e.target.value)}
            options={durationOptions}
            error={errors.duration}
            required
            helperText="Expected time commitment for the visit."
          />
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
        >
          Back
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          rightIcon={<ArrowRight size={16} />}
          onClick={onContinue}
        >
          Continue to Location
        </Button>
      </CardFooter>
    </Card>
  );
};
