import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { ActivityList } from '../../components/customer/activity/ActivityList';

export const CustomerActivityPage: React.FC = () => {
  return (
    <PageContainer maxWidth="lg" className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="My Service Activity"
        description="Monitor submitted service requests, upcoming visits, in-progress jobs, and past completed services."
        breadcrumbs={[
          { label: 'Activity' },
        ]}
        actions={
          <Link to="/request">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle size={14} />}>
              Request New Service
            </Button>
          </Link>
        }
      />

      {/* Activity List Component */}
      <ActivityList />
    </PageContainer>
  );
};
