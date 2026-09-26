import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';

export const ProviderResultSkeleton: React.FC = () => {
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3.5">
            <Skeleton variant="circular" className="w-14 h-14" />
            <div className="space-y-2">
              <Skeleton variant="text" className="w-32" />
              <Skeleton variant="text" className="w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-20" />
            <Skeleton variant="text" className="w-16" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton variant="rectangular" className="h-6 w-16" />
            <Skeleton variant="rectangular" className="h-6 w-20" />
            <Skeleton variant="rectangular" className="h-6 w-14" />
          </div>
          <Skeleton variant="text" className="w-1/2" />
        </div>

        <div className="pt-3 border-t border-neutral-100 flex justify-between">
          <Skeleton variant="rectangular" className="h-8 w-24" />
          <Skeleton variant="rectangular" className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  );
};
