import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Home,
  Briefcase,
  Star,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { customerService } from '../../services/customer.service';
import type { CustomerProfile, Address, AddressLabel } from '@sevasetu/shared';

export const CustomerProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [addressSuccess, setAddressSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Address Modal/Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState<AddressLabel>('HOME');
  const [flatNumber, setFlatNumber] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [profData, addrData] = await Promise.all([
        customerService.getProfile(),
        customerService.getAddresses(),
      ]);
      setProfile(profData);
      setFullName(profData.fullName || '');
      setPhone(profData.phone || '');
      setAddresses(addrData);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(null);
    setErrorMessage(null);
    try {
      const updated = await customerService.updateProfile({ fullName, phone });
      setProfile(updated);
      setProfileSuccess('Profile details updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrLabel('HOME');
    setFlatNumber('');
    setStreetArea('');
    setCity('');
    setState('Uttar Pradesh');
    setPostalCode('');
    setLandmark('');
    setIsDefault(addresses.length === 0);
    setShowAddressForm(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setFlatNumber(addr.flatNumber);
    setStreetArea(addr.streetArea);
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setLandmark(addr.landmark || '');
    setIsDefault(addr.isDefault);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber.trim() || !streetArea.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMessage('Please fill in Flat/House, Street/Area, City, and PIN code.');
      return;
    }

    setIsSavingAddress(true);
    setErrorMessage(null);
    try {
      if (editingAddressId) {
        await customerService.updateAddress(editingAddressId, {
          label: addrLabel,
          flatNumber,
          streetArea,
          city,
          state,
          postalCode,
          landmark,
          isDefault,
        });
        setAddressSuccess('Address updated successfully.');
      } else {
        await customerService.createAddress({
          label: addrLabel,
          flatNumber,
          streetArea,
          city,
          state,
          postalCode,
          landmark,
          isDefault,
        });
        setAddressSuccess('New service address added successfully.');
      }
      setShowAddressForm(false);
      const updatedAddresses = await customerService.getAddresses();
      setAddresses(updatedAddresses);
      setTimeout(() => setAddressSuccess(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetPrimary = async (addressId: string) => {
    try {
      await customerService.setDefaultAddress(addressId);
      const updated = await customerService.getAddresses();
      setAddresses(updated);
      setAddressSuccess('Primary default address updated.');
      setTimeout(() => setAddressSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to set primary address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;
    try {
      await customerService.deleteAddress(addressId);
      const updated = await customerService.getAddresses();
      setAddresses(updated);
      setAddressSuccess('Address removed.');
      setTimeout(() => setAddressSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="lg" className="py-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-primary-600" size={32} />
        <p className="text-sm font-medium text-neutral-600">Loading your profile and addresses...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title="My Profile &amp; Addresses"
        description="Manage your account profile, contact credentials, and verified service delivery addresses."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Profile' },
        ]}
      />

      {errorMessage && (
        <Alert variant="error" title="Error" onClose={() => setErrorMessage(null)}>
          <p className="text-sm">{errorMessage}</p>
        </Alert>
      )}

      {profileSuccess && (
        <Alert variant="success" title="Profile Saved" onClose={() => setProfileSuccess(null)}>
          <p className="text-sm">{profileSuccess}</p>
        </Alert>
      )}

      {addressSuccess && (
        <Alert variant="success" title="Address Updated" onClose={() => setAddressSuccess(null)}>
          <p className="text-sm">{addressSuccess}</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile Information Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="default" padding="md" className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs">
                  <User size={16} />
                  <span>Account Information</span>
                </div>
                <Badge variant="success" size="sm">
                  {profile?.status || 'ACTIVE'}
                </Badge>
              </div>
              <CardTitle className="text-lg pt-1">Personal Details</CardTitle>
              <CardDescription>Update your name and communication phone number.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address <span className="text-neutral-400 font-normal">(Primary Auth)</span>
                  </label>
                  <Input value={profile?.email || ''} disabled className="bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                </div>

                <div>
                  <label htmlFor="customer-fullname" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    id="customer-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customer-phone" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="customer-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={isSavingProfile}
                    leftIcon={<Save size={14} />}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Saved Service Addresses */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="default" padding="md" className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs">
                  <MapPin size={16} />
                  <span>Delivery Locations</span>
                </div>
                <CardTitle className="text-lg pt-1">Saved Service Addresses</CardTitle>
                <CardDescription>
                  Addresses used when requesting plumbing, cleaning, electrical, and home services.
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddAddress}
                leftIcon={<Plus size={14} />}
                className="text-xs"
              >
                Add Address
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {addresses.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-xl space-y-3">
                  <MapPin size={32} className="mx-auto text-neutral-400" />
                  <p className="text-sm font-semibold text-neutral-700">No saved addresses yet</p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Add your home or office address to enable quick service bookings and technician dispatch.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleOpenAddAddress} leftIcon={<Plus size={14} />}>
                    Add First Address
                  </Button>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border transition-all ${
                      addr.isDefault
                        ? 'border-primary-300 bg-primary-50/20 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" size="sm" className="font-semibold text-xs">
                            {addr.label === 'HOME' && <Home size={11} className="mr-1 inline-block" />}
                            {addr.label === 'WORK' && <Briefcase size={11} className="mr-1 inline-block" />}
                            {addr.label}
                          </Badge>
                          {addr.isDefault && (
                            <Badge variant="success" size="sm" className="text-[10px] font-bold">
                              <CheckCircle2 size={10} className="mr-1 inline-block" />
                              Primary Address
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 pt-0.5">
                          {addr.flatNumber}, {addr.streetArea}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {addr.city}, {addr.state} — <span className="font-mono">{addr.postalCode}</span>
                        </p>
                        {addr.landmark && (
                          <p className="text-xs text-neutral-500 italic">
                            Landmark: {addr.landmark}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!addr.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(addr.id)}
                            className="text-xs h-7 px-2 text-neutral-600 hover:text-primary-700"
                            title="Set as Primary Default"
                          >
                            <Star size={12} className="mr-1 inline-block" />
                            Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAddress(addr)}
                          className="text-xs h-7 px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs h-7 px-2 text-neutral-500 hover:text-red-600 hover:bg-red-50"
                          aria-label="Delete address"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Add / Edit Address Form Modal / Inline Box */}
          {showAddressForm && (
            <Card variant="default" padding="md" className="bg-neutral-50 border-primary-300 shadow-md">
              <CardHeader className="pb-2 border-b border-neutral-200">
                <CardTitle className="text-base font-bold text-neutral-900">
                  {editingAddressId ? 'Edit Saved Address' : 'Add New Service Address'}
                </CardTitle>
                <CardDescription>
                  Enter full location details where the service professional will attend.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-neutral-700">Label:</label>
                    {(['HOME', 'WORK', 'OTHER'] as AddressLabel[]).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddrLabel(lbl)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          addrLabel === lbl
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Flat / House / Building *
                      </label>
                      <Input
                        value={flatNumber}
                        onChange={(e) => setFlatNumber(e.target.value)}
                        placeholder="e.g. Flat 402, Block B"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Street / Locality / Sector *
                      </label>
                      <Input
                        value={streetArea}
                        onChange={(e) => setStreetArea(e.target.value)}
                        placeholder="e.g. Sector 62, Indirapuram"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">City *</label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Noida"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">State</label>
                      <Input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Uttar Pradesh"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">PIN Code *</label>
                      <Input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 201301"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Landmark <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <Input
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite City Hospital"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="addr-default"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="addr-default" className="text-xs text-neutral-700 font-medium">
                      Set as primary default address
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddressForm(false)}
                      disabled={isSavingAddress}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSavingAddress}
                      leftIcon={<Save size={14} />}
                    >
                      {isSavingAddress ? 'Saving Address...' : editingAddressId ? 'Update Address' : 'Save Address'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
