import React, { useState, useEffect, useCallback } from 'react';
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
import { AdminService } from '../../services/admin.service';
import type { AdminServiceCategory, AdminServiceItem } from '../../types/admin';

export const AdminServicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'services'>('categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'category' | 'service'>('service');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form states for add modal structure
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState('fixed');
  const [basePrice, setBasePrice] = useState('');
  const [formSavedNotice, setFormSavedNotice] = useState(false);

  const [categories, setCategories] = useState<AdminServiceCategory[]>([]);
  const [services, setServices] = useState<AdminServiceItem[]>([]);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, srvsRes] = await Promise.all([
        AdminService.listCategories(),
        AdminService.listServices({ limit: 100 }),
      ]);

      const mappedCats: AdminServiceCategory[] = (cats || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        isActive: c.isActive !== false,
        servicesCount: c._count?.services || c.services?.length || 0,
      }));

      const mappedSrvs: AdminServiceItem[] = (srvsRes.services || []).map((s: any) => ({
        id: s.id,
        categoryId: s.categoryId,
        categoryName: s.category?.name || 'Standard Category',
        title: s.title,
        description: s.description || '',
        pricingModel: (s.pricingModel?.toLowerCase() as any) || 'fixed',
        basePrice: s.basePricePaise ? s.basePricePaise / 100 : 0,
        currency: 'INR',
        durationMinutes: 45,
        isActive: s.isActive !== false,
        bookingsCount: s._count?.bookings || 0,
      }));

      setCategories(mappedCats);
      setServices(mappedSrvs);
      if (mappedCats.length > 0 && !selectedCategoryId && mappedCats[0]) {
        setSelectedCategoryId(mappedCats[0].id);
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleService = async (serviceId: string, currentActive: boolean) => {
    try {
      await AdminService.setServiceActiveStatus(serviceId, !currentActive, 'Status updated via admin console');
      await loadCatalog();
    } catch (err) {
      console.error('Failed to update service status:', err);
    }
  };

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
      render: (srv) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleService(srv.id, srv.isActive)}
          className="text-xs h-7 px-2"
        >
          {srv.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  const handleSaveModal = async () => {
    try {
      if (modalType === 'category') {
        const catSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await AdminService.createCategory({
          name: title,
          slug: catSlug,
          description,
        });
      } else {
        const srvSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await AdminService.createService({
          categoryId: selectedCategoryId || (categories[0]?.id || ''),
          title,
          slug: srvSlug,
          description,
          pricingModel: pricingModel.toUpperCase(),
          basePrice: Math.round((parseFloat(basePrice) || 0) * 100),
        });
      }
      setFormSavedNotice(true);
      await loadCatalog();
      setTimeout(() => {
        setFormSavedNotice(false);
        setIsAddModalOpen(false);
        setTitle('');
        setSlug('');
        setDescription('');
        setBasePrice('');
      }, 800);
    } catch (err) {
      console.error('Failed to create catalog item:', err);
    }
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
          isLoading={isLoading}
          totalItems={filteredCategories.length}
        />
      ) : (
        <AdminTable<AdminServiceItem>
          columns={serviceColumns}
          data={filteredServices}
          keyExtractor={(s) => s.id}
          isLoading={isLoading}
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
          <Alert variant="info" title="Catalog Administration">
            Changes made here will be persisted to PostgreSQL and will govern future customer service bookings.
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

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Slug Identifier
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. painting-waterproofing"
              className="text-xs"
            />
          </div>

          {modalType === 'service' && (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <Select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  className="text-xs h-9.5"
                />
              </div>

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
            </>
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
            <Alert variant="success" title="Saved Successfully">
              Catalog configuration saved to database.
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
