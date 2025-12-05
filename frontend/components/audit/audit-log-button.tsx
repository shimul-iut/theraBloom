'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useAuditLogCount } from '@/hooks/use-audit-logs';

interface AuditLogButtonProps {
  resourceType: string;
  resourceId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showCount?: boolean;
}

export function AuditLogButton({
  resourceType,
  resourceId,
  variant = 'outline',
  size = 'default',
  showCount = true,
}: AuditLogButtonProps) {
  const router = useRouter();
  const { data } = useAuditLogCount(resourceType, resourceId);
  const count = data?.count || 0;

  const handleClick = () => {
    router.push(
      `/audit-logs?resourceType=${resourceType}&resourceId=${resourceId}`
    );
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick}>
      <History className="mr-2 h-4 w-4" />
      View Audit History
      {showCount && count > 0 && (
        <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold">
          {count}
        </span>
      )}
    </Button>
  );
}
