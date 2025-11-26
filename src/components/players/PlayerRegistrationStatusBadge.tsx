import { Badge } from "@/components/ui/badge";

interface PlayerRegistrationStatusBadgeProps {
  status: string;
  className?: string;
}

export const PlayerRegistrationStatusBadge = ({ 
  status, 
  className 
}: PlayerRegistrationStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: '🕐 Menunggu Persetujuan',
          variant: 'secondary' as const,
        };
      case 'approved':
        return {
          label: '✅ Disetujui',
          variant: 'default' as const,
        };
      case 'rejected':
        return {
          label: '❌ Ditolak',
          variant: 'destructive' as const,
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
