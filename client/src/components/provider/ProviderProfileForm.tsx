import React, { useState } from 'react';
import {
  User,
  MapPin,
  Clock,
  Shield,
  Eye,
  Globe,
  Upload,
  Save,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import type { ProviderProfileData } from '../../types';

export interface ProviderProfileFormProps {
  initialData?: Partial<ProviderProfileData>;
  onSave?: (data: ProviderProfileData) => void;
  className?: string;
}

const DEFAULT_PROFILE: ProviderProfileData = {
  fullName: '',
  bio: '',
  experienceYears: 1,
  serviceArea: '',
  languages: ['Hindi', 'English'],
  phoneMasked: '+91 98••••••21',
  emailMasked: 'pr•••••@domain.com',
  profileStatus: 'incomplete',
  visibility: 'public',
  verificationStatus: 'unverified',
};

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({
  initialData,
  onSave,
  className,
}) => {
  const [formData, setFormData] = useState<ProviderProfileData>(() => ({
    ...DEFAULT_PROFILE,
    ...initialData,
  }));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full legal name is required.';
    }
    if (!formData.bio.trim() || formData.bio.trim().length < 15) {
      errs.bio = 'Please write at least 15 characters describing your background and trade.';
    }
    if (!formData.serviceArea.trim()) {
      errs.serviceArea = 'Primary service locality and operating PIN code is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (onSave) {
      onSave(formData);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Card variant="default" padding="md" className="bg-white space-y-6">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs">
              <User size={16} />
              <span>Professional Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={formData.visibility === 'public' ? 'success' : 'neutral'} size="sm">
                <Eye size={12} className="mr-1 inline-block" />
                <span>{formData.visibility === 'public' ? 'Publicly Listed' : 'Unlisted'}</span>
              </Badge>
              <Badge variant={formData.verificationStatus === 'verified' ? 'success' : 'warning'} size="sm">
                <Shield size={12} className="mr-1 inline-block" />
                <span className="capitalize">{formData.verificationStatus}</span>
              </Badge>
            </div>
          </div>
          <CardTitle className="text-lg pt-1">Provider Profile &amp; Bio</CardTitle>
          <CardDescription>
            This information is presented on your verified public profile for prospective customers.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {saveSuccess && (
            <Alert variant="success" title="Profile Details Updated">
              Changes to your profile information have been recorded for the upcoming backend sync.
            </Alert>
          )}

          {/* Avatar / Photo Section */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 font-bold text-xl flex items-center justify-center border-2 border-primary-200 shrink-0">
              {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : <User size={24} />}
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-neutral-900">Profile Photo</h4>
              <p className="text-[11px] text-neutral-500">
                A clear, professional headshot helps build immediate customer trust upon booking.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Upload size={13} />}
                className="text-xs h-7 px-2.5 mt-1"
                onClick={() => {
                  // UI placeholder for photo upload dialog
                  alert('Photo upload integration will connect with secure storage in subsequent phases.');
                }}
              >
                Upload Photo
              </Button>
            </div>
          </div>

          {/* Core Name & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name / Trade Entity"
              placeholder="e.g. Ramesh Kumar / R.K. Electricals"
              value={formData.fullName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              error={errors.fullName}
              required
              helperText="Matches your government-issued identity documents."
            />

            <Input
              type="number"
              min={0}
              max={50}
              label="Years of Professional Experience"
              value={formData.experienceYears.toString()}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  experienceYears: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              leftIcon={<Clock size={16} />}
              required
              helperText="Total industry tenure or trade practice."
            />
          </div>

          {/* Bio / About */}
          <Textarea
            label="About & Professional Overview"
            rows={4}
            placeholder="Describe your trade background, special tools, certifications, punctuality commitment, and service warranty..."
            value={formData.bio}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, bio: e.target.value }));
              if (errors.bio) setErrors((prev) => ({ ...prev, bio: '' }));
            }}
            error={errors.bio}
            required
            helperText="Write a minimum 15 characters overview visible to customers on your public profile."
          />

          {/* Service Locality & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Service Locality & Sectors"
              placeholder="e.g. Sector 62, Indirapuram, Noida East"
              value={formData.serviceArea}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, serviceArea: e.target.value }));
                if (errors.serviceArea) setErrors((prev) => ({ ...prev, serviceArea: '' }));
              }}
              leftIcon={<MapPin size={16} />}
              error={errors.serviceArea}
              required
              helperText="Town, sector, or radius where you attend client visits."
            />

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Languages Spoken
              </label>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-neutral-400 shrink-0" />
                <span className="text-xs text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-md font-medium">
                  {formData.languages.join(', ')}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Languages you communicate in with customers.
              </p>
            </div>
          </div>

          {/* Privacy & Account Notice */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-neutral-800">
              <Shield size={14} className="text-primary-600" />
              <span>Contact Privacy &amp; Verification Protocol</span>
            </div>
            <p className="leading-relaxed">
              Your registered phone (<span className="font-mono text-neutral-900">{formData.phoneMasked}</span>) and email (<span className="font-mono text-neutral-900">{formData.emailMasked}</span>) are masked from unverified users. Customer contact is only enabled during active scheduled service dispatches.
            </p>
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
              <Info size={13} className="shrink-0" />
              <span>Identity KYC submission is reviewed manually by SevaSetu operations.</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Profile Status: <strong className="capitalize text-neutral-700">{formData.profileStatus}</strong>
          </span>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save size={15} />}
          >
            Save Profile Details
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
