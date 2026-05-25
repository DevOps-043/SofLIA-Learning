import { Mail, MapPin, Phone } from 'lucide-react';
import type { Region, Team, Zone } from '../../../types/hierarchy.types';
import { formatFullAddress } from '../../../types/hierarchy.types';

interface DetailsPanelLocationContactProps {
  contactLabel: string;
  data: Region | Team | Zone;
  locationLabel: string;
}

export function DetailsPanelLocationContact({
  contactLabel,
  data,
  locationLabel,
}: DetailsPanelLocationContactProps) {
  const hasLocation = data.address || data.city || data.state || data.country;
  const hasContact = data.phone || data.email;

  return (
    <>
      {hasLocation && (
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{locationLabel}</h4>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
            <p className="text-neutral-700 dark:text-neutral-300">{formatFullAddress(data)}</p>
          </div>
        </div>
      )}
      {hasContact && (
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{contactLabel}</h4>
          <div className="space-y-2">
            {data.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-neutral-400" />
                <a href={`tel:${data.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{data.phone}</a>
              </div>
            )}
            {data.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-neutral-400" />
                <a href={`mailto:${data.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{data.email}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
