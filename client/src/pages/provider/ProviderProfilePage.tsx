import React, { useState } from 'react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { ProviderProfileForm } from '../../components/provider/ProviderProfileForm';
import { ProviderSkills } from '../../components/provider/ProviderSkills';
import { ProviderProfileCompletion } from '../../components/provider/ProviderProfileCompletion';
import type { ProviderProfileData, ProviderSkill } from '../../types';

export const ProviderProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProviderProfileData>({
    fullName: 'Ramesh Kumar (R.K. Electricals)',
    bio: 'Certified electrical technician with 8+ years hands-on experience in residential installations, circuit breaker troubleshooting, and appliance setup. Committed to strict safety standards.',
    experienceYears: 8,
    serviceArea: 'Sector 62, Indirapuram, Noida East & surrounding areas',
    languages: ['Hindi', 'English'],
    phoneMasked: '+91 98••••••21',
    emailMasked: 'ra•••••@gmail.com',
    profileStatus: 'active',
    visibility: 'public',
    verificationStatus: 'verified',
  });

  const [skills, setSkills] = useState<ProviderSkill[]>([
    { id: 'sk-1', name: 'Ceiling Fan Installation', category: 'Electrical', experienceLevel: 'expert' },
    { id: 'sk-2', name: 'Switchboard Repair & Rewiring', category: 'Electrical', experienceLevel: 'expert' },
    { id: 'sk-3', name: 'MCB & Circuit Breaker Diagnostics', category: 'Electrical', experienceLevel: 'intermediate' },
    { id: 'sk-4', name: 'Appliance Voltage Testing', category: 'Electrical', experienceLevel: 'intermediate' },
  ]);

  const handleSaveProfile = (data: ProviderProfileData) => {
    setProfile(data);
  };

  const handleAddSkill = (skill: ProviderSkill) => {
    setSkills((prev) => [skill, ...prev]);
  };

  const handleRemoveSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Provider Profile &amp; Credentials"
        description="Manage your professional bio, service area boundaries, trade skills, and identity verification status."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Profile' },
        ]}
      />

      {/* Profile Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile Form and Skills */}
        <div className="lg:col-span-8 space-y-6">
          <ProviderProfileForm
            initialData={profile}
            onSave={handleSaveProfile}
          />

          <ProviderSkills
            skills={skills}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        </div>

        {/* Right Column: Profile Completion Checklist */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          <ProviderProfileCompletion
            profile={profile}
            hasServices={true}
            hasSkills={skills.length > 0}
            hasAvailability={true}
          />
        </div>
      </div>
    </PageContainer>
  );
};
