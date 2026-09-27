import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Home, Briefcase, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'UNAUTHENTICATED';
  const attemptedPath = (location.state as { attemptedPath?: string })?.attemptedPath;

  return (
    <PageContainer maxWidth="md" className="py-16">
      <EmptyState
        icon={<ShieldAlert size={36} className="text-red-500" />}
        title="Access Restricted: Role Authorization Required"
        description={
          attemptedPath
            ? `You attempted to access ${attemptedPath}, which is restricted to authorized user roles. Your current account role does not possess permissions for this area.`
            : 'Your active account role is not authorized to access this section of the platform.'
        }
        action={
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Your Current Role:</span>
              <Badge variant="warning" size="md">
                {userRole}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Link to="/">
                <Button variant="outline" size="sm" leftIcon={<Home size={14} />}>
                  Customer Portal
                </Button>
              </Link>

              {user?.role === 'PROVIDER' && (
                <Link to="/provider">
                  <Button variant="primary" size="sm" leftIcon={<Briefcase size={14} />}>
                    Provider Console
                  </Button>
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link to="/admin">
                  <Button variant="primary" size="sm" leftIcon={<ShieldCheck size={14} />}>
                    Operations Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        }
      />
    </PageContainer>
  );
};
