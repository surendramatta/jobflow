'use client';

import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  queued: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  tailoring: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  approval_needed: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  submitted: 'bg-primary-50 text-primary-700 ring-primary-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  failed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  draft: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  queued: 'Queued',
  tailoring: 'Tailoring',
  approval_needed: 'Needs Approval',
  approved: 'Approved',
  submitted: 'Submitted',
  rejected: 'Rejected',
  failed: 'Failed',
  active: 'Active',
  closed: 'Closed',
  draft: 'Draft',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        statusStyles[status] || statusStyles.pending,
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
