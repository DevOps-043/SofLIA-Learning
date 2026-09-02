# Verificacion canonica de correo

## Contrato funcional

- Registro manual: `auth.users.email_confirmed_at` permanece nulo hasta que el
  usuario consume un token de confirmacion valido.
- SSO: Google o Microsoft demuestran control del correo; el callback confirma
  `auth.users` y sincroniza `public.users` antes de emitir la sesion.
- `public.users.email_verified` es una proyeccion. La autoridad canonica sigue
  siendo `auth.users.email_confirmed_at`.

## Configuracion obligatoria de Supabase Auth

En Authentication > Providers > Email del proyecto alojado:

1. desactivar el registro directo, porque las altas publicas pasan por la accion
   protegida del servidor;
2. activar la confirmacion de correo y desactivar `Confirm email` automatico;
3. establecer `https://soflia.ai` como Site URL y permitir
   `https://soflia.ai/auth/**` como redirect URL;
4. conservar `{{ .ConfirmationURL }}` como enlace principal de la plantilla.

Si se usa una plantilla basada en `TokenHash`, el enlace debe ser exactamente:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

No se debe usar solo `{{ .RedirectTo }}`: ese valor no contiene la prueba de
posesion del correo.

Verificacion de deriva contra el proyecto desplegado:

```bash
npm run security:check-auth-verification
```

El comando requiere `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY`; solo lee `/auth/v1/settings` y falla si signup
directo o autoconfirmacion vuelven a habilitarse.
