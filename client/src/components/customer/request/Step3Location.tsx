import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Info, CheckCircle2, Loader2, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { customerService } from '../../../services/customer.service';
import type { ServiceAddress, RequestFormErrors } from '../../../types';
import type { Address } from '@sevasetu/shared';

export interface Step3LocationProps {
  addressMode: 'saved' | 'new';
  onChangeAddressMode: (mode: 'saved' | 'new') => void;
  selectedSavedAddressId?: string;
  onSelectSavedAddress: (id: string, addr: ServiceAddress) => void;
  address: ServiceAddress;
  onChangeAddressField: (field: keyof ServiceAddress, value: string) => void;
  errors: RequestFormErrors;
  onBack: () => void;
  onContinue: () => void;
}

export const Step3Location: React.FC<Step3LocationProps> = ({
  addressMode,
  onChangeAddressMode,
  selectedSavedAddressId,
  onSelectSavedAddress,
  address,
  onChangeAddressField,
  errors,
  onBack,
  onContinue,
}) => {
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; isDefault: boolean; addr: ServiceAddress }>>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      setLoadingAddresses(true);
      try {
        const addrs = await customerService.getAddresses();
        if (isMounted) {
          const mapped = addrs.map((a: Address) => {
            const labelCapitalized = a.label === 'HOME' ? 'Home' : a.label === 'WORK' ? 'Work' : 'Other';
            return {
              id: a.id,
              label: labelCapitalized,
              isDefault: a.isDefault,
              addr: {
                label: labelCapitalized as 'Home' | 'Work' | 'Other',
                flatNumber: a.flatNumber,
                streetArea: a.streetArea,
                city: a.city,
                pincode: a.postalCode,
                landmark: a.landmark || undefined,
              },
            };
          });
          setSavedAddresses(mapped);

          // If in saved mode and nothing selected, select default address if present
          if (mapped.length > 0 && !selectedSavedAddressId) {
            const defaultAddr = mapped.find((m) => m.isDefault) || mapped[0];
            if (defaultAddr) {
              onSelectSavedAddress(defaultAddr.id, defaultAddr.addr);
            }
          } else if (mapped.length === 0 && addressMode === 'saved') {
            onChangeAddressMode('new');
          }
        }
      } catch {
        // If not logged in or addresses unavailable, fallback cleanly to new address mode
        if (isMounted && addressMode === 'saved') {
          onChangeAddressMode('new');
        }
      } finally {
        if (isMounted) {
          setLoadingAddresses(false);
        }
      }
    }
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card variant="default" padding="md" className="bg-white space-y-6">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
          <MapPin size={16} />
          <span>Step 3: Service Location</span>
        </div>
        <CardTitle>Where is the service required?</CardTitle>
        <CardDescription>
          Provide the address details where the service professional will attend.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Address Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-lg max-w-sm">
          <button
            type="button"
            onClick={() => onChangeAddressMode('saved')}
            className={cn(
              'flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer select-none',
              addressMode === 'saved'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            Saved Addresses
          </button>
          <button
            type="button"
            onClick={() => onChangeAddressMode('new')}
            className={cn(
              'flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer select-none',
              addressMode === 'new'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            Enter New Address
          </button>
        </div>

        {/* 1. Saved Addresses Selection View */}
        {addressMode === 'saved' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-800">
                Select from Saved Addresses ({savedAddresses.length})
              </label>
              {loadingAddresses && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Loader2 size={13} className="animate-spin text-primary-600" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            {loadingAddresses ? (
              <div className="p-8 text-center border border-neutral-200 rounded-xl bg-neutral-50">
                <Loader2 size={20} className="animate-spin text-primary-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-600">Retrieving your saved addresses...</p>
              </div>
            ) : savedAddresses.length === 0 ? (
              <div className="p-6 text-center border border-neutral-200 rounded-xl bg-neutral-50">
                <p className="text-xs font-medium text-neutral-700 mb-2">No saved service addresses found on your account.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onChangeAddressMode('new')}
                >
                  Enter Address Manually
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((sa) => {
                  const isSelected = selectedSavedAddressId === sa.id;
                  return (
                    <div
                      key={sa.id}
                      onClick={() => onSelectSavedAddress(sa.id, sa.addr)}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 relative',
                        isSelected
                          ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500 text-neutral-900'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs uppercase tracking-wider text-primary-700">
                            {sa.label}
                          </span>
                          {sa.isDefault && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Star size={10} className="fill-amber-500 text-amber-500" />
                              Primary
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="text-primary-600" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-neutral-900 leading-snug">
                        {sa.addr.flatNumber}, {sa.addr.streetArea}
                      </p>
                      <p className="text-[11px] text-neutral-600">
                        {sa.addr.city} — {sa.addr.pincode}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.address && (
              <p className="text-xs text-rose-600 font-medium pt-1">{errors.address}</p>
            )}
          </div>
        ) : (
          /* 2. New Address Entry Form */
          <div className="space-y-4 pt-1">
            {/* Address Label Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-800">
                Address Tag
              </label>
              <div className="flex items-center gap-3">
                {(['Home', 'Work', 'Other'] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onChangeAddressField('label', label)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                      address.label === label
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Flat / House No. / Building / Floor"
                  placeholder="e.g. Flat 302, Green Valley Apartments"
                  value={address.flatNumber}
                  onChange={(e) => onChangeAddressField('flatNumber', e.target.value)}
                  error={errors.flatNumber}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Street / Area / Sector / Colony"
                  placeholder="e.g. 14th Main Road, Sector 4"
                  value={address.streetArea}
                  onChange={(e) => onChangeAddressField('streetArea', e.target.value)}
                  error={errors.streetArea}
                  required
                />
              </div>

              <Input
                label="City / Town"
                placeholder="e.g. New Delhi"
                value={address.city}
                onChange={(e) => onChangeAddressField('city', e.target.value)}
                error={errors.city}
                required
              />

              <Input
                label="PIN Code (6 digits)"
                placeholder="e.g. 110001"
                maxLength={6}
                value={address.pincode}
                onChange={(e) => onChangeAddressField('pincode', e.target.value)}
                error={errors.pincode}
                required
              />

              <div className="sm:col-span-2">
                <Input
                  label="Landmark (Optional)"
                  placeholder="e.g. Behind Community Center, Opposite Park"
                  value={address.landmark || ''}
                  onChange={(e) => onChangeAddressField('landmark', e.target.value)}
                  helperText="Helps the service specialist reach your doorstep smoothly."
                />
              </div>
            </div>
          </div>
        )}

        {/* Future GPS Map Notice */}
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
          <Info size={16} className="text-neutral-500 shrink-0" />
          <span>Interactive map pinning and automated geolocation validation will be active in upcoming releases.</span>
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
          Continue to Date &amp; Time
        </Button>
      </CardFooter>
    </Card>
  );
};
