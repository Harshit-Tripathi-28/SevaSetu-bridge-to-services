import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal, ModalFooter } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { NoServicesState } from './ProviderEmptyStates';
import { CORE_SERVICE_CATEGORIES } from '../../constants/categories';
import type { ProviderServiceItem, ProviderPricingModel } from '../../types';

export interface ProviderServicesProps {
  services: ProviderServiceItem[];
  onAddService: (service: ProviderServiceItem) => void;
  onUpdateService: (service: ProviderServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  className?: string;
}

const PRICING_MODEL_LABELS: Record<ProviderPricingModel, string> = {
  hourly: 'Hourly Rate',
  fixed: 'Fixed Price',
  per_visit: 'Per-Visit Inspection',
  per_task: 'Per-Task / Per-Unit',
  quote: 'Quote / On-site Estimate',
};

export const ProviderServices: React.FC<ProviderServicesProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState('electrician');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPricingModel, setFormPricingModel] = useState<ProviderPricingModel>('fixed');
  const [formBasePrice, setFormBasePrice] = useState<string>('');
  const [formMinDuration, setFormMinDuration] = useState('1 hour');
  const [formServiceArea, setFormServiceArea] = useState('All Sectors');
  const [formIsActive, setFormIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenAdd = () => {
    setEditingServiceId(null);
    setFormCategory('electrician');
    setFormTitle('');
    setFormDescription('');
    setFormPricingModel('fixed');
    setFormBasePrice('');
    setFormMinDuration('1 hour');
    setFormServiceArea('All Sectors');
    setFormIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc: ProviderServiceItem) => {
    setEditingServiceId(svc.id);
    setFormCategory(svc.category);
    setFormTitle(svc.title);
    setFormDescription(svc.description);
    setFormPricingModel(svc.pricingModel);
    setFormBasePrice(svc.basePrice ? svc.basePrice.toString() : '');
    setFormMinDuration(svc.minDuration || '1 hour');
    setFormServiceArea(svc.serviceArea || 'All Sectors');
    setFormIsActive(svc.isActive);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formTitle.trim()) errs.title = 'Service title is required.';
    if (!formDescription.trim()) errs.description = 'Service description is required.';
    if (formPricingModel !== 'quote' && (!formBasePrice || isNaN(Number(formBasePrice)))) {
      errs.basePrice = 'Enter a valid base price amount.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: ProviderServiceItem = {
      id: editingServiceId || `svc-${Date.now()}`,
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      pricingModel: formPricingModel,
      basePrice: formBasePrice ? Number(formBasePrice) : undefined,
      minDuration: formMinDuration,
      serviceArea: formServiceArea,
      isActive: formIsActive,
    };

    if (editingServiceId) {
      onUpdateService(payload);
    } else {
      onAddService(payload);
    }
    setIsModalOpen(false);
  };

  const categoryOptions = CORE_SERVICE_CATEGORIES.map((c) => ({
    value: c.slug,
    label: c.name,
  }));

  const pricingModelOptions: { value: ProviderPricingModel; label: string }[] = [
    { value: 'fixed', label: 'Fixed Price (per job)' },
    { value: 'hourly', label: 'Hourly Rate (per hour)' },
    { value: 'per_visit', label: 'Per-Visit Inspection Charge' },
    { value: 'per_task', label: 'Per-Task / Per-Unit Rate' },
    { value: 'quote', label: 'Custom Quote / Estimate on Site' },
  ];

  return (
    <Card variant="default" padding="md" className={className}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs">
              <Wrench size={16} />
              <span>Service Catalog</span>
            </div>
            <CardTitle className="text-lg pt-1">Offered Services &amp; Rates</CardTitle>
            <CardDescription>
              Manage distinct service packages, pricing structures, and expected durations.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenAdd}
          >
            Add Service
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {services.length === 0 ? (
          <NoServicesState
            action={
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenAdd}>
                Add Your First Service
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <div
                key={svc.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  svc.isActive
                    ? 'bg-white border-neutral-200 hover:border-neutral-300'
                    : 'bg-neutral-50/70 border-neutral-200/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant={svc.isActive ? 'neutral' : 'warning'} size="sm" className="capitalize">
                      {svc.category}
                    </Badge>
                    <h4 className="font-semibold text-sm text-neutral-900 mt-1 leading-snug">
                      {svc.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-900 block">
                      {svc.basePrice ? `₹${svc.basePrice}` : 'Custom Quote'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {PRICING_MODEL_LABELS[svc.pricingModel]}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {svc.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                  {svc.minDuration && (
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} />
                      <span>{svc.minDuration}</span>
                    </span>
                  )}
                  {svc.serviceArea && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={12} />
                      <span>{svc.serviceArea}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateService({ ...svc, isActive: !svc.isActive })}
                    className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    {svc.isActive ? (
                      <ToggleRight size={18} className="text-emerald-600" />
                    ) : (
                      <ToggleLeft size={18} className="text-neutral-400" />
                    )}
                    <span className="text-[11px] font-medium">
                      {svc.isActive ? 'Active' : 'Paused'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(svc)}
                      aria-label="Edit service"
                      className="p-1.5 text-neutral-500 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteService(svc.id)}
                      aria-label="Delete service"
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingServiceId ? 'Edit Service Offering' : 'Add New Service Offering'}
        description="Configure pricing structure and duration for this specific trade task."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Service Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            options={categoryOptions}
            required
          />

          <Input
            label="Service Offering Title"
            placeholder="e.g. Ceiling Fan Installation &amp; Wiring"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            error={errors.title}
            required
          />

          <Textarea
            label="Description of Service"
            rows={3}
            placeholder="Specify what is included in this service (e.g. mounting bracket, safety testing, minor wire dressing)..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            error={errors.description}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Pricing Model"
              value={formPricingModel}
              onChange={(e) => setFormPricingModel(e.target.value as ProviderPricingModel)}
              options={pricingModelOptions}
              required
            />

            {formPricingModel !== 'quote' && (
              <Input
                type="number"
                min={0}
                label="Base Rate / Starting Price (₹)"
                placeholder="e.g. 299"
                value={formBasePrice}
                onChange={(e) => setFormBasePrice(e.target.value)}
                error={errors.basePrice}
                leftIcon={<Tag size={15} />}
                required
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Estimated Duration"
              placeholder="e.g. 1–2 hours"
              value={formMinDuration}
              onChange={(e) => setFormMinDuration(e.target.value)}
              helperText="Typical on-site visit time."
            />

            <Input
              label="Service Locality / Sectors"
              placeholder="e.g. Sector 62 &amp; within 10 km"
              value={formServiceArea}
              onChange={(e) => setFormServiceArea(e.target.value)}
              helperText="Operating boundary."
            />
          </div>

          {errors.general && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{errors.general}</span>
            </p>
          )}

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              {editingServiceId ? 'Update Service' : 'Save Service'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
};
