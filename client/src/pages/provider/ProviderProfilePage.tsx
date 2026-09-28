import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { ProviderProfileForm } from '../../components/provider/ProviderProfileForm';
import { ProviderSkills } from '../../components/provider/ProviderSkills';
import { ProviderProfileCompletion } from '../../components/provider/ProviderProfileCompletion';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { providerService } from '../../services/provider.service';
import type { ProviderProfileData as UIProviderProfileData, ProviderSkill } from '../../types';
import type { ProviderSkillItem, ProviderOnboardingState } from '@sevasetu/shared';

export const ProviderProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UIProviderProfileData | null>(null);
  const [skills, setSkills] = useState<ProviderSkill[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [onboarding, setOnboarding] = useState<ProviderOnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profData, skillsData, servicesData, onboardingData] = await Promise.all([
        providerService.getProfile(),
        providerService.getSkills(),
        providerService.getServices(),
        providerService.getOnboardingState(),
      ]);

      const fullName = profData.displayName || profData.businessName || 'Service Provider';
      setProfile({
        fullName,
        bio: profData.bio || '',
        experienceYears: profData.experienceYears || 1,
        serviceArea: profData.serviceAreaSummary || '',
        languages: profData.languages.length > 0 ? profData.languages : ['Hindi', 'English'],
        phoneMasked: profData.user?.phone || 'Not configured',
        emailMasked: profData.user?.email || '',
        profileStatus:
          profData.onboardingStatus === 'COMPLETED' ? 'active' : 'incomplete',
        visibility: profData.isPubliclyListed ? 'public' : 'unlisted',
        verificationStatus: 'unverified',
      });

      setSkills(
        skillsData.map((s: ProviderSkillItem) => ({
          id: s.id,
          name: s.name,
          category: s.category || 'General',
          experienceLevel:
            (s.experienceLevel?.toLowerCase() as 'beginner' | 'intermediate' | 'expert') ||
            'intermediate',
        }))
      );

      setServicesCount(servicesData.length);
      setOnboarding(onboardingData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load provider profile';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (data: UIProviderProfileData) => {
    try {
      setFeedback(null);
      await providerService.updateProfile({
        businessName: data.fullName,
        displayName: data.fullName,
        bio: data.bio,
        experienceYears: data.experienceYears,
        serviceAreaSummary: data.serviceArea,
        languages: data.languages,
        isPubliclyListed: data.visibility === 'public',
      });

      // Also persist service area structured model if provided
      if (data.serviceArea.trim()) {
        await providerService.setServiceArea({
          city: 'Noida',
          locality: data.serviceArea.trim(),
          state: 'Uttar Pradesh',
          postalCode: '201301',
        });
      }

      setProfile(data);
      const updatedOnboarding = await providerService.getOnboardingState();
      setOnboarding(updatedOnboarding);
      setFeedback({ type: 'success', message: 'Profile information saved successfully to database.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setFeedback({
        type: 'error',
        message,
      });
    }
  };

  const handleAddSkill = async (skill: ProviderSkill) => {
    try {
      setFeedback(null);
      const created = await providerService.addSkill({
        name: skill.name,
        category: skill.category,
        experienceLevel: skill.experienceLevel,
      });

      const expLevel: 'beginner' | 'intermediate' | 'expert' =
        created.experienceLevel === 'expert' || created.experienceLevel === 'beginner'
          ? created.experienceLevel
          : 'intermediate';

      setSkills((prev) => [
        {
          id: created.id,
          name: created.name,
          category: created.category || 'General',
          experienceLevel: expLevel,
        },
        ...prev,
      ]);

      const updatedOnboarding = await providerService.getOnboardingState();
      setOnboarding(updatedOnboarding);
      setFeedback({ type: 'success', message: `Added skill "${created.name}".` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add skill';
      setFeedback({
        type: 'error',
        message,
      });
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      setFeedback(null);
      await providerService.removeSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      const updatedOnboarding = await providerService.getOnboardingState();
      setOnboarding(updatedOnboarding);
      setFeedback({ type: 'success', message: 'Skill removed.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove skill';
      setFeedback({
        type: 'error',
        message,
      });
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setCompletingOnboarding(true);
      setFeedback(null);
      const res = await providerService.completeOnboarding();
      setOnboarding(res);
      if (profile) {
        setProfile({ ...profile, profileStatus: 'active' });
      }
      setFeedback({
        type: 'success',
        message: 'Congratulations! You have completed provider onboarding. Your profile is now eligible for public listing.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setCompletingOnboarding(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="xl" className="py-16 text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
        <p className="text-sm text-neutral-600">Loading your provider profile and trade credentials...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Provider Profile &amp; Credentials"
        description="Manage your professional bio, service area boundaries, trade skills, and onboarding readiness."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Profile' },
        ]}
      />

      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          title={feedback.type === 'success' ? 'Success' : 'Error'}
          onClose={() => setFeedback(null)}
        >
          <span>{feedback.message}</span>
        </Alert>
      )}

      {/* Profile Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile Form and Skills */}
        <div className="lg:col-span-8 space-y-6">
          <ProviderProfileForm
            initialData={profile || undefined}
            onSave={handleSaveProfile}
          />

          <ProviderSkills
            skills={skills}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        </div>

        {/* Right Column: Profile Completion Checklist & Onboarding Actions */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          <ProviderProfileCompletion
            profile={profile}
            hasServices={servicesCount > 0}
            hasSkills={skills.length > 0}
            hasAvailability={true}
          />

          {/* Real Onboarding Submission Card */}
          {onboarding && (
            <Card variant="default" padding="md" className="bg-white space-y-3 border-primary-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
                    Onboarding Readiness
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    {onboarding.completionPercentage ?? onboarding.progressPercentage ?? 0}%
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold pt-1">
                  Status: {onboarding.status || onboarding.onboardingStatus || 'NOT_STARTED'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {onboarding.status === 'COMPLETED' || onboarding.onboardingStatus === 'COMPLETED'
                    ? 'Your provider onboarding checklist is satisfied.'
                    : `Incomplete sections: ${onboarding.sections?.filter((s) => !s.isComplete).map((s) => s.title).join(', ') || onboarding.remainingSections?.join(', ') || 'Review required'}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {onboarding.status !== 'COMPLETED' && onboarding.onboardingStatus !== 'COMPLETED' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    disabled={!onboarding.isComplete || completingOnboarding}
                    onClick={handleCompleteOnboarding}
                    leftIcon={completingOnboarding ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  >
                    {!onboarding.isComplete
                      ? 'Complete Required Steps to Submit'
                      : 'Finalize & Complete Onboarding'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-medium">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Onboarding finalized and ready for customer discovery.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
