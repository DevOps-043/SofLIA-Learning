import { loginSchema } from './schema'

export function readLoginFormInput(formData: FormData) {
  return loginSchema.parse({
    emailOrUsername: formData.get('emailOrUsername'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') === 'true',
  })
}
