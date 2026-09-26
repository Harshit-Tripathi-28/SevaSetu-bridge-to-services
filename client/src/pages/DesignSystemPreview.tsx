import React, { useState } from 'react';
import {
  Search,
  Mail,
  Lock,
  ArrowRight,
  Download,
  Trash2,
  CheckCircle,
  Inbox,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  Alert,
  Spinner,
  Skeleton,
  EmptyState,
  Modal,
  ModalFooter,
} from '../components/ui';
import { PageContainer } from '../layouts/PageContainer';
import { PageHeader } from '../layouts/PageHeader';

export const DesignSystemPreview: React.FC = () => {
  // Interactive preview states
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState('Standard input value');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('option-1');
  const [selectVal, setSelectVal] = useState('option-1');
  const [showAlert, setShowAlert] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

  const toggleLoading = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <PageContainer maxWidth="lg">
      {/* Reusable PageHeader */}
      <PageHeader
        title="SevaSetu Visual Foundation"
        description="Standardized visual tokens, typography scale, responsive primitives, and reusable UI components. Designed for high contrast, accessibility, and consistency across all platform touchpoints."
        breadcrumbs={[
          { label: 'Foundation', href: '/' },
          { label: 'Design System' },
        ]}
      />

      <div className="space-y-12 mt-8">

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">1. Color Palette Tokens</h2>
          <p className="text-xs text-neutral-600">Centralized semantic color scales adhering to WCAG AA contrast standards.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-primary-600 shadow-inner" />
            <div className="font-semibold text-neutral-900">Primary (600)</div>
            <div className="text-neutral-600 font-mono text-[11px]">#0284c7</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-primary-700 shadow-inner" />
            <div className="font-semibold text-neutral-900">Primary Hover</div>
            <div className="text-neutral-600 font-mono text-[11px]">#0369a1</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-primary-50 border border-primary-200" />
            <div className="font-semibold text-neutral-900">Primary Light</div>
            <div className="text-neutral-600 font-mono text-[11px]">#f0f9ff</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-emerald-600 shadow-inner" />
            <div className="font-semibold text-neutral-900">Success</div>
            <div className="text-neutral-600 font-mono text-[11px]">#059669</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-amber-600 shadow-inner" />
            <div className="font-semibold text-neutral-900">Warning</div>
            <div className="text-neutral-600 font-mono text-[11px]">#d97706</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-rose-600 shadow-inner" />
            <div className="font-semibold text-neutral-900">Error / Destructive</div>
            <div className="text-neutral-600 font-mono text-[11px]">#dc2626</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs pt-1">
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-neutral-900 shadow-inner" />
            <div className="font-semibold text-neutral-900">Text Primary</div>
            <div className="text-neutral-600 font-mono text-[11px]">#0f172a</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-neutral-600 shadow-inner" />
            <div className="font-semibold text-neutral-900">Text Secondary</div>
            <div className="text-neutral-600 font-mono text-[11px]">#475569</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-neutral-400 shadow-inner" />
            <div className="font-semibold text-neutral-900">Text Muted</div>
            <div className="text-neutral-600 font-mono text-[11px]">#94a3b8</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-neutral-200 shadow-inner" />
            <div className="font-semibold text-neutral-900">Border Default</div>
            <div className="text-neutral-600 font-mono text-[11px]">#e2e8f0</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-neutral-100 shadow-inner" />
            <div className="font-semibold text-neutral-900">Surface Secondary</div>
            <div className="text-neutral-600 font-mono text-[11px]">#f1f5f9</div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-neutral-200 bg-white">
            <div className="h-10 rounded bg-neutral-50 border border-neutral-200" />
            <div className="font-semibold text-neutral-900">Background Canvas</div>
            <div className="text-neutral-600 font-mono text-[11px]">#f8fafc</div>
          </div>
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">2. Typography Scale</h2>
          <p className="text-xs text-neutral-600">Standardized hierarchy and sizing using clean modern typography.</p>
        </div>

        <Card padding="md" className="space-y-4 divide-y divide-neutral-100">
          <div className="pt-2 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">Display (36px / Bold)</span>
            <span className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              Multifunctional Services Platform
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">H1 (30px / Bold)</span>
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
              Primary Section Header
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">H2 (24px / SemiBold)</span>
            <span className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-tight">
              Secondary Module Title
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">H3 (20px / SemiBold)</span>
            <span className="text-lg sm:text-xl font-semibold text-neutral-900 leading-snug">
              Card or Subsection Title
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">Body Large (18px)</span>
            <span className="text-lg text-neutral-700 leading-relaxed">
              Standard lead paragraph text for introductory content and overviews.
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">Body (16px)</span>
            <span className="text-base text-neutral-700 leading-normal">
              Regular body copy used across description blocks, articles, and general interface text.
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">Body Small (14px)</span>
            <span className="text-sm text-neutral-600 leading-normal">
              Compact copy used in tables, auxiliary panels, and supporting descriptions.
            </span>
          </div>
          <div className="pt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-xs font-mono text-neutral-600 w-36 shrink-0">Caption (12px)</span>
            <span className="text-xs text-neutral-600">
              Microcopy, timestamps, status labels, and helper texts.
            </span>
          </div>
        </Card>
      </section>

      {/* 3. Button Component System */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">3. Button System</h2>
          <p className="text-xs text-neutral-600">Variants, sizes, states, keyboard focus indicators, and loading states.</p>
        </div>

        <Card padding="md" className="space-y-6">
          {/* Variants */}
          <div>
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-3">
              Variants (Medium Size)
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link Button</Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-3">
              Sizes
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small Button</Button>
              <Button size="md">Medium Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
          </div>

          {/* States & Icons */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-3">
              States &amp; Icons
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button leftIcon={<Download size={16} />}>With Left Icon</Button>
              <Button variant="outline" rightIcon={<ArrowRight size={16} />}>With Right Icon</Button>
              <Button variant="destructive" leftIcon={<Trash2 size={16} />}>Delete Action</Button>
              <Button disabled>Disabled State</Button>
              <Button
                variant="primary"
                isLoading={buttonLoading}
                onClick={toggleLoading}
              >
                {buttonLoading ? 'Processing...' : 'Click for Loading State'}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Form Controls & Inputs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">4. Form Control Primitives</h2>
          <p className="text-xs text-neutral-600">Accessible text inputs, textareas, selects, checkboxes, and radio options.</p>
        </div>

        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Standard Text Input"
              placeholder="Enter text..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              helperText="Helper message explaining expected format."
              required
            />

            <Input
              label="Input with Left Icon"
              placeholder="Search items..."
              leftIcon={<Search size={16} />}
              helperText="Demonstrates icon alignment inside control."
            />

            <Input
              label="Password Input Field"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              required
            />

            <Input
              label="Error State Input"
              defaultValue="invalid@address"
              error="Please enter a valid format."
              leftIcon={<Mail size={16} />}
            />

            <Select
              label="Select Dropdown"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              helperText="Dropdown with standardized keyboard selection."
              options={[
                { value: 'option-1', label: 'Primary Option One' },
                { value: 'option-2', label: 'Secondary Option Two' },
                { value: 'option-3', label: 'Tertiary Option Three' },
              ]}
            />

            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">Checkboxes &amp; Radio Buttons</label>
              <div className="space-y-2 pt-1">
                <Checkbox
                  label="Interactive standard checkbox"
                  helperText="Supports keyboard toggle via spacebar."
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                />
                <Checkbox
                  label="Disabled checkbox item"
                  disabled
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Radio
                  name="demo-radio"
                  label="Option A"
                  checked={radioVal === 'option-1'}
                  onChange={() => setRadioVal('option-1')}
                />
                <Radio
                  name="demo-radio"
                  label="Option B"
                  checked={radioVal === 'option-2'}
                  onChange={() => setRadioVal('option-2')}
                />
                <Radio
                  name="demo-radio"
                  label="Disabled"
                  disabled
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Multi-line Textarea"
                placeholder="Enter detailed description or remarks..."
                rows={3}
                helperText="Standardized multi-line input element."
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Cards & Surface System */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">5. Card &amp; Surface System</h2>
          <p className="text-xs text-neutral-600">Modular surface containers for structured content presentation.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Border with subtle shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-600">Standard surface container used for modular blocks.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Medium shadow elevation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-600">Higher elevation for prominent or focused containers.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="primary" className="w-full">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>Hover &amp; focus elevation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-600">Hover over this card to preview dynamic elevation transition.</p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-primary-600 font-medium">Click to select →</span>
            </CardFooter>
          </Card>

          <Card variant="subtle">
            <CardHeader>
              <CardTitle>Subtle Card</CardTitle>
              <CardDescription>Low-contrast background</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-600">Ideal for auxiliary notes, secondary sections, and grouping.</p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-neutral-600">Static Container</span>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 6. Badges & Status Indicators */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">6. Badges &amp; Status Indicators</h2>
          <p className="text-xs text-neutral-600">Compact visual tags for system states and labels.</p>
        </div>

        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Information</Badge>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-3">
            <Badge variant="neutral" withDot>Neutral with Dot</Badge>
            <Badge variant="success" withDot>Active / Online</Badge>
            <Badge variant="warning" withDot>Pending Review</Badge>
            <Badge variant="error" withDot>Action Required</Badge>
            <Badge variant="info" withDot>In Progress</Badge>
            <Badge variant="success" icon={<CheckCircle size={12} />}>Verified Item</Badge>
          </div>
        </Card>
      </section>

      {/* 7. Avatar System */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">7. Avatar System</h2>
          <p className="text-xs text-neutral-600">Representational primitives supporting sizes, initials, fallbacks, and status dots.</p>
        </div>

        <Card padding="md" className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Avatar size="xs" initials="SS" />
            <span className="text-xs text-neutral-600 font-mono">XS (24px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar size="sm" initials="SS" status="online" />
            <span className="text-xs text-neutral-600 font-mono">SM (32px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar size="md" initials="SS" status="busy" />
            <span className="text-xs text-neutral-600 font-mono">MD (40px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar size="lg" initials="SS" status="away" />
            <span className="text-xs text-neutral-600 font-mono">LG (56px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar size="xl" />
            <span className="text-xs text-neutral-600 font-mono">XL (80px Fallback)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar size="lg" shape="rounded" initials="SS" />
            <span className="text-xs text-neutral-600 font-mono">Rounded Shape</span>
          </div>
        </Card>
      </section>

      {/* 8. Alert & Feedback Components */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">8. Alert &amp; Feedback Components</h2>
            <p className="text-xs text-neutral-600">Standardized feedback boxes with accessibility role attributes.</p>
          </div>
          {!showAlert && (
            <Button size="sm" variant="outline" onClick={() => setShowAlert(true)}>
              Reset Dismissed Alert
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <Alert variant="info" title="System Notice">
            This is an informational notice regarding platform maintenance and scheduled synchronization.
          </Alert>

          {showAlert && (
            <Alert
              variant="success"
              title="Operation Completed"
              onClose={() => setShowAlert(false)}
            >
              Changes were validated and saved. This alert is dismissible via the close button.
            </Alert>
          )}

          <Alert variant="warning" title="Attention Recommended">
            Please verify network parameters before executing additional operations.
          </Alert>

          <Alert variant="error" title="Critical Exception Notice">
            An error prevented the request from completing. Review the error details below.
          </Alert>
        </div>
      </section>

      {/* 9. Loading Patterns */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">9. Loading Patterns</h2>
          <p className="text-xs text-neutral-600">Accessible spinning indicators and pulsing skeleton placeholders.</p>
        </div>

        <Card padding="md" className="space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Spinner Sizes &amp; Colors
            </div>
            <div className="flex items-center gap-6">
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="xl" />
              <Spinner size="md" variant="neutral" />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Skeleton Placeholders
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" className="w-1/3" />
              <Skeleton variant="text" className="w-2/3" />
              <Skeleton variant="text" className="w-full" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Skeleton variant="circular" className="w-10 h-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" className="w-1/4" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 10. Empty State System */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">10. Empty State System</h2>
          <p className="text-xs text-neutral-600">Standard reusable empty canvas for lists, searches, or queries.</p>
        </div>

        <EmptyState
          icon={<Inbox size={24} />}
          title="No records to display"
          description="This is a standardized empty state component. It accepts custom icons, titles, descriptions, and call-to-action buttons."
          action={<Button size="sm" variant="outline">Action Trigger</Button>}
        />
      </section>

      {/* 11. Modal Dialog System */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">11. Modal Dialog System</h2>
          <p className="text-xs text-neutral-600">Accessible dialog overlay with backdrop blur, keyboard escape handler, and focus isolation.</p>
        </div>

        <Card padding="md" className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Interactive Modal Demo</h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Click the button to preview the modal dialog, backdrop, and keyboard escape interaction.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Demo Modal
          </Button>
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Design System Dialog Demo"
          description="This dialog demonstrates standardized layout, title, body content, and action buttons."
          size="md"
        >
          <div className="space-y-3 text-sm text-neutral-600">
            <p>
              Modals in the SevaSetu design system manage backdrop clicks, disable background scrolling,
              and listen to the <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-xs text-neutral-800">Escape</code> key.
            </p>
            <p>
              The layout is responsive and cleanly adapts to mobile viewports while preserving accessible focus.
            </p>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </section>
      </div>
    </PageContainer>
  );
};
