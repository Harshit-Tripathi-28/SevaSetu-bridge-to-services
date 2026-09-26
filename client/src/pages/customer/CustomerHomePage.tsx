import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ServiceCategoryGrid } from '../../components/customer/category/ServiceCategoryGrid';
import { CORE_SERVICE_CATEGORIES } from '../../constants/categories';

export const CustomerHomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero & Service Discovery Section */}
      <section className="bg-gradient-to-b from-primary-50/60 via-white to-neutral-50/30 border-b border-neutral-200/80 pt-10 pb-14">
        <PageContainer maxWidth="lg" className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary-200 text-primary-800 text-xs font-semibold shadow-2xs">
              <Sparkles size={14} className="text-primary-600" />
              <span>Multi-functional Home &amp; Local Services Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Reliable local service professionals, delivered to your doorstep.
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Connect directly with verified electricians, plumbers, cleaners, carpenters, maids, and drivers in your local neighborhood.
            </p>
          </div>

          {/* Quick Search Entry Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl shadow-md border border-neutral-200">
              <div className="flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What service do you need? (e.g., tap leak, switchboard repair)..."
                  leftIcon={<Search size={18} className="text-neutral-400" />}
                  className="border-0 shadow-none focus:ring-0 text-sm"
                  aria-label="Search for services"
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="shrink-0">
                Find Services
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-neutral-600 px-3 pt-3">
              <span>Popular: Cleaning, Electrician, Plumber, Maid</span>
              <Link to="/request" className="text-primary-700 font-semibold hover:underline flex items-center gap-1">
                <span>Tell us what you need</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. Core Service Categories Grid */}
      <section>
        <PageContainer maxWidth="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
                <Layers size={14} />
                <span>Standardized Service Catalog</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Explore Service Categories
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Browse certified professionals by specialized service domain.
              </p>
            </div>

            <Link to="/services">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                All Categories
              </Button>
            </Link>
          </div>

          <ServiceCategoryGrid categories={CORE_SERVICE_CATEGORIES} />
        </PageContainer>
      </section>

      {/* 3. How It Works Framework */}
      <section className="bg-white border-y border-neutral-200 py-12">
        <PageContainer maxWidth="lg" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              How SevaSetu Connects You
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              A transparent, safe, and dependable framework for local service procurement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="subtle" className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-xs">
                1
              </div>
              <h3 className="font-semibold text-base text-neutral-900">Specify Your Requirement</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Describe your service need using plain words or choose from curated categories with your preferred date and time.
              </p>
            </Card>

            <Card variant="subtle" className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-xs">
                2
              </div>
              <h3 className="font-semibold text-base text-neutral-900">Match With Verified Pros</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Review verified professional profiles, skills, service areas, and transparent pricing models before confirmation.
              </p>
            </Card>

            <Card variant="subtle" className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-xs">
                3
              </div>
              <h3 className="font-semibold text-base text-neutral-900">Service Completion &amp; Trust</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Professional service delivery with transparent status tracking, direct communication, and service assurance.
              </p>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* 4. Trust & Safety Framework */}
      <section>
        <PageContainer maxWidth="lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-neutral-900 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck size={18} />
                <span>Verified Professionals</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Identity and skill credential checks ensure peace of mind for every customer and household.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary-400 font-semibold text-sm">
                <CheckCircle2 size={18} />
                <span>Transparent Pricing</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Clear pricing models (fixed, hourly, or upfront quotes) without hidden surcharges or surprise costs.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Clock size={18} />
                <span>Prompt Scheduling</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Flexible scheduling matching your timetable, whether you need immediate assistance or planned maintenance.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 5. Customer Activity & Action Shortcut Framework */}
      <section>
        <PageContainer maxWidth="lg">
          <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-900">Track Ongoing &amp; Past Services</h3>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Check service request statuses, upcoming visits, and service history anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Link to="/activity" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  View Activity
                </Button>
              </Link>
              <Link to="/request" className="w-full sm:w-auto">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  New Request
                </Button>
              </Link>
            </div>
          </Card>
        </PageContainer>
      </section>
    </div>
  );
};
