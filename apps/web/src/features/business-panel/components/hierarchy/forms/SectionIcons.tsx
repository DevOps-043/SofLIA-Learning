import { BarChart3, Info, Mail, MapPin, User, Users } from 'lucide-react';

const iconClassName = 'w-5 h-5';

export const sectionIcons = {
  contact: <Mail className={`${iconClassName} text-amber-500`} />,
  goals: <BarChart3 className={`${iconClassName} text-green-500`} />,
  info: <Info className={`${iconClassName} text-blue-500`} />,
  leader: <User className={`${iconClassName} text-purple-500`} />,
  location: <MapPin className={`${iconClassName} text-emerald-500`} />,
  team: <Users className={`${iconClassName} text-amber-500`} />,
};
