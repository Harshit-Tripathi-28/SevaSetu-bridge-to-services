import React from 'react';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Textarea } from '../../ui/Textarea';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Button } from '../../ui/Button';

export interface Step5PreferencesProps {
  additionalInstructions: string;
  onChangeAdditionalInstructions: (value: string) => void;
  accessInstructions: string;
  onChangeAccessInstructions: (value: string) => void;
  hasPets: boolean;
  onChangeHasPets: (value: boolean) => void;
  parkingAvailable: boolean;
  onChangeParkingAvailable: (value: boolean) => void;
  bringTools: boolean;
  onChangeBringTools: (value: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const Step5Preferences: React.FC<Step5PreferencesProps> = ({
  additionalInstructions,
  onChangeAdditionalInstructions,
  accessInstructions,
  onChangeAccessInstructions,
  hasPets,
  onChangeHasPets,
  parkingAvailable,
  onChangeParkingAvailable,
  bringTools,
  onChangeBringTools,
  onBack,
  onContinue,
}) => {
  return (
    <Card variant="default" padding="md" className="bg-white space-y-6">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
          <Settings size={16} />
          <span>Step 5: On-site Preferences</span>
        </div>
        <CardTitle>Preferences &amp; Access Instructions</CardTitle>
        <CardDescription>
          Helpful notes for the service specialist prior to arriving at your location.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Access Instructions */}
        <Input
          label="Building Access / Entry Instructions (Optional)"
          placeholder="e.g. Ring flat 402 from gate, elevator code 1234, call upon arrival..."
          value={accessInstructions}
          onChange={(e) => onChangeAccessInstructions(e.target.value)}
          helperText="Direct instructions on gate clearance, visitor registration, or elevators."
        />

        {/* Additional Task Guidance */}
        <Textarea
          label="Additional Instructions or Material Notes (Optional)"
          rows={3}
          placeholder="e.g. The switchboard is located behind the master bed, please bring a step stool..."
          value={additionalInstructions}
          onChange={(e) => onChangeAdditionalInstructions(e.target.value)}
          helperText="Any special precautions, power shutoff locations, or preferred working environment."
        />

        {/* Household Practical Toggles */}
        <div className="pt-2 space-y-3">
          <label className="block text-xs font-semibold text-neutral-800">
            Household &amp; Arrival Conditions
          </label>
          <div className="space-y-2.5 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200">
            <Checkbox
              label="Parking space available on premises"
              helperText="Provider can park a two-wheeler or service vehicle safely."
              checked={parkingAvailable}
              onChange={(e) => onChangeParkingAvailable(e.target.checked)}
            />

            <Checkbox
              label="Pets present in the household"
              helperText="Notifies the professional in advance for comfort and safety."
              checked={hasPets}
              onChange={(e) => onChangeHasPets(e.target.checked)}
            />

            <Checkbox
              label="Provider should bring basic consumables &amp; testing gear"
              helperText="e.g., Insulation tapes, screws, standard sealant, or testing meters."
              checked={bringTools}
              onChange={(e) => onChangeBringTools(e.target.checked)}
            />
          </div>
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
          Review &amp; Confirm
        </Button>
      </CardFooter>
    </Card>
  );
};
