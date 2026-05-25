import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface AvailabilityIconProps {
  available: boolean;
}

export function AvailabilityIcon({ available }: AvailabilityIconProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }}>
        {available ? (
          <Check className="h-6 w-6 text-success" />
        ) : (
          <X className="h-6 w-6 text-gray-500" />
        )}
      </motion.div>
    </div>
  );
}
