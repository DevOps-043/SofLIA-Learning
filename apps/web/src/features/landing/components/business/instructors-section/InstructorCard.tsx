import { Card, CardContent, Badge } from '@aprende-y-aplica/ui';
import type { Instructor } from '@aprende-y-aplica/shared';
import { motion } from 'framer-motion';
import { GraduationCap, Star, Users } from 'lucide-react';

import { staggerItem } from '../../../../../shared/utils/animations';

interface InstructorCardProps {
  instructor: Instructor;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        variant="glassmorphism"
        className="group h-full cursor-pointer border border-gray-200 bg-white dark:border-gray-500/30 dark:bg-gray-800/95"
      >
        <CardContent className="p-8">
          <InstructorAvatar instructor={instructor} />
          <div className="mb-4 text-center">
            <h3 className="mb-1 text-2xl font-bold text-primary dark:text-white">
              {instructor.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/70">{instructor.role}</p>
          </div>

          <p className="mb-6 min-h-[60px] text-center text-gray-600 dark:text-white/70">
            {instructor.bio}
          </p>
          <InstructorStats instructor={instructor} />
          <div className="flex flex-wrap justify-center gap-2">
            {instructor.expertise.slice(0, 3).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="border-gray-200 bg-gray-100 text-xs text-primary dark:border-gray-500/30 dark:bg-gray-800 dark:text-white/90"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InstructorAvatar({ instructor }: InstructorCardProps) {
  const initials = instructor.name.split(' ').map((name) => name[0]).join('');

  return (
    <div className="mb-6 flex justify-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white">
          {instructor.avatar ? (
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 rounded-full bg-primary p-2">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function InstructorStats({ instructor }: InstructorCardProps) {
  return (
    <div className="mb-6 flex justify-center gap-6">
      <InstructorStat icon={<Star className="h-4 w-4 fill-warning text-warning" />} value={instructor.rating.toFixed(1)} />
      <InstructorStat icon={<Users className="h-4 w-4 text-accent" />} value={instructor.students.toLocaleString()} />
      <InstructorStat icon={<GraduationCap className="h-4 w-4 text-accent" />} value={instructor.courses} />
    </div>
  );
}

function InstructorStat({ icon, value }: { icon: JSX.Element; value: number | string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-semibold text-primary dark:text-white">{value}</span>
    </div>
  );
}
