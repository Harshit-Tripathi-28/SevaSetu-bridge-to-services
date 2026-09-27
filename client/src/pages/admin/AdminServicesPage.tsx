import React, { useState } from 'react';
import { Plus, Search, Clock } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Alert } from '../../components/ui/Alert';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import type { AdminServiceCategory, AdminServiceItem } from '../../types/admin';

export const AdminServicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'services'>('categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'category' | 'service'>('service');

  // Form states for add modal structure
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState('fixed');
  const [basePrice, setBasePrice] = useState('');
  const [formSavedNotice, setFormSavedNotice] = useState(false);

  // Standard service categories
  const categories: AdminServiceCategory[] = [
    {
      id: 'cat-1',
      name: 'Electrical Services',
      slug: 'electrical',
      description: 'Wiring, fixtures, fuse boards, switchboards, and electrical fault repair.',
      isActive: true,
      servicesCount: 4,
    },
    {
      id: 'cat-2',
      name: 'Plumbing Solutions',
      slug: 'plumbing',
      description: 'Pipe repair, tap installation, water heater setup, and drainage solutions.',
      isActive: true,
      servicesCount: 3,
    },
    {
      id: 'cat-3',
      name: 'Carpentry & Woodwork',
      slug: 'carpentry',
      description: 'Furniture assembly, hinge repairs, custom fittings, and wooden fixtures.',
      isActive: true,
      servicesCount: 3,
    },
    {
      id: 'cat-4',
      name: 'Home Deep Cleaning',
      slug: 'cleaning',
      description: 'Full house sanitization, kitchen deep clean, and bathroom scrubbing.',
      isActive: true,
      servicesCount: 2,
    },
    {
      id: 'cat-5',
      name: 'Appliance Repair',
      slug: 'appliances',
      description: 'Air conditioners, washing machines, refrigerators, and microwaves.',
      isActive: true,
      servicesCount: 4,
    },
  ];

  // Standard catalog services
  const services: AdminServiceItem[] = [
    {
      id: 'srv-1',
      categoryId: 'cat-1',
      categoryName: 'Electrical Services',
      title: 'Ceiling Fan Installation & Repair',
      description: 'Mounting, balancing, capacitor replacement, and wiring.',
      pricingModel: 'fixed',
      basePrice: 299,
      currency: 'INR',
      durationMinutes: 45,
      isActive: true,
      bookingsCount: 0,
    },
    {
      id: 'srv-2',
      categoryId: 'cat-1',
      categoryName: 'Electrical Services',
      title: 'Switchboard & Socket Replacement',
      description: 'Safety inspection, socket upgrades, and short-circuit repair.',
      pricingModel: 'fixed',
      basePrice: 199,
      currency: 'INR',
      durationMinutes: 30,
      isActive: true,
      bookingsCount: 0,
    },
    {
      id: 'srv-3',
      categoryId: 'cat-2',
      categoryName: 'Plumbing Solutions',
      title: 'Tap Leakage & Valve Repair',
      description: 'Washer replacement, cartridge fixes, and pipe sealing.',
      pricingModel: 'fixed',
      basePrice: 249,
      currency: 'INR',
      durationMinutes: 40,
      isActive: true,
      bookingsCount: 0,
    },
    {
      id: 'srv-4',
      categoryId: 'cat-5',
      categoryName: 'Appliance Repair',
      title: 'Split AC Deep Service & Gas Check',
      description: 'Filter foam wash, condenser coil cleaning, and cooling pressure check.',
      pricingModel: 'fixed',
      basePrice: 599,
      currency: 'INR',
      durationMinutes: 60,
      isActive: true,
      bookingsCount: 0,
    },
  ];

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Category Table Columns
  const categoryColumns: ColumnDef<AdminServiceCategory>[] = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (cat) => (
        <div>
          <div className="font-semibold text-neutral-900">{cat.name}</div>
          <div className="text-xs text-neutral-500 font-mono mt-0.5">slug: {cat.slug}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (cat) => <div className="text-xs text-neutral-600 max-w-md">{cat.description}</div>,
    },
    {
      key: 'servicesCount',
      header: 'Catalog Services',
      sortable: true,
      render: (cat) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
          {cat.servicesCount} items
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (cat) =>
        cat.isActive ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="neutral" size="sm">Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Controls',
      headerClassName: 'text-right',
      className: 'text-right',
      render: () => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModalType('category');
            setIsAddModalOpen(true);
          }}
          className="text-xs h-7 px-2"
        >
          Edit
        </Button>
      ),
    },
  ];

  // Service Table Columns
  const serviceColumns: ColumnDef<AdminServiceItem>[] = [
    {
      key: 'title',
      header: 'Service Title',
      sortable: true,
      render: (srv) => (
        <div>
          <div className="font-semibold text-neutral-900">{srv.title}</div>
          <div className="text-xs text-neutral-500">{srv.categoryName}</div>
        </div>
      ),
    },
    {
      key: 'pricingModel',
      header: 'Pricing Model',
      render: (srv) => (
        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
          {srv.pricingModel}
        </span>
      ),
    },
    {
      key: 'basePrice',
      header: 'Standard Base Price',
      sortable: true,
      render: (srv) => (
        <span className="text-xs font-semibold text-neutral-900">
          {srv.basePrice ? `₹${srv.basePrice}` : 'Quote required'}
        </span>
      ),
    },
    {
      key: 'durationMinutes',
      header: 'Est. Duration',
      render: (srv) => (
        <span className="text-xs text-neutral-600 flex items-center gap-1">
          <Clock size={12} className="text-neutral-400" />
          {srv.durationMinutes ? `${srv.durationMinutes} mins` : 'Flexible'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (srv) =>
        srv.isActive ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="neutral" size="sm">Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Controls',
      headerClassName: 'text-right',
      className: 'text-right',
      render: () => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModalType('service');
            setIsAddModalOpen(true);
          }}
          className="text-xs h-7 px-2"
        >
          Edit
        </Button>
      ),
    },
  ];

  const handleSaveModal = () => {
    setFormSavedNotice(true);
    setTimeout(() => {
      setFormSavedNotice(false);
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Service &amp; Category Catalog Operations"
        description="Govern approved platform service taxonomies, pricing models, standard dispatch times, and active catalog availability."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Services' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setModalType('category');
                setIsAddModalOpen(true);
              }}
            >
              Add Category
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setModalType('service');
                setIsAddModalOpen(true);
              }}
            >
              Add Service
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('categories');
            setSearchQuery('');
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'categories'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('services');
            setSearchQuery('');
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'services'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Catalog Offerings ({services.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'categories' ? 'categories' : 'services'}...`}
          leftIcon={<Search size={16} className="text-neutral-400" />}
          className="h-9.5 text-xs"
        />
      </div>

      {/* Active Tab View */}
      {activeTab === 'categories' ? (
        <AdminTable<AdminServiceCategory>
          columns={categoryColumns}
          data={filteredCategories}
          keyExtractor={(c) => c.id}
          totalItems={filteredCategories.length}
        />
      ) : (
        <AdminTable<AdminServiceItem>
          columns={serviceColumns}
          data={filteredServices}
          keyExtractor={(s) => s.id}
          totalItems={filteredServices.length}
        />
      )}

      {/* Add / Edit Service Modal Structure */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={modalType === 'category' ? 'Configure Service Category' : 'Configure Service Offering'}
        size="md"
      >
        <div className="space-y-4">
          <Alert variant="info" title="Catalog Governance Notice">
            This catalog editor runs within the Part 7 UI framework. Structural changes will sync with database schemas upon live backend mutation API integration.
          </Alert>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {modalType === 'category' ? 'Category Name' : 'Service Title'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={modalType === 'category' ? 'e.g. Painting & Waterproofing' : 'e.g. Tap Installation & Leak Fix'}
              className="text-xs"
            />
          </div>

          {modalType === 'service' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Pricing Model
                </label>
                <Select
                  value={pricingModel}
                  onChange={(e) => setPricingModel(e.target.value)}
                  options={[
                    { label: 'Fixed Price', value: 'fixed' },
                    { label: 'Hourly Rate', value: 'hourly' },
                    { label: 'Custom Quote', value: 'quote' },
                  ]}
                  className="text-xs h-9.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Base Price (₹ INR)
                </label>
                <Input
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="e.g. 299"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Description &amp; Operational Scope
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline standard inclusions, equipment requirements, and safety guidelines..."
              className="text-xs"
            />
          </div>

          {formSavedNotice && (
            <Alert variant="success" title="Structure Saved">
              Catalog configuration recorded in local session state.
            </Alert>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveModal}>
              Save Configuration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
