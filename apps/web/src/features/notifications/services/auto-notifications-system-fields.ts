const FIELD_DISPLAY_NAMES: Record<string, string> = {
  username: 'Nombre de usuario',
  email: 'Correo electrónico',
  first_name: 'Nombre',
  last_name: 'Apellido',
  display_name: 'Nombre de visualización',
  phone: 'Teléfono',
  bio: 'Biografía',
  location: 'Ubicación',
  cargo_rol: 'Cargo',
  type_rol: 'Cargo de la empresa',
  profile_picture_url: 'Foto de perfil',
  curriculum_url: 'Currículum',
  linkedin_url: 'LinkedIn',
  github_url: 'GitHub',
  website_url: 'Sitio web',
  country_code: 'País',
  points: 'Puntos',
}

export function getFieldDisplayName(fieldName: string): string {
  return FIELD_DISPLAY_NAMES[fieldName] || fieldName
}
