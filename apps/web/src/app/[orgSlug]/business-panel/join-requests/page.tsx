import { redirect } from 'next/navigation'

export default function JoinRequestsPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const { orgSlug } = params
  redirect(`/${orgSlug}/business-panel/users?tab=requests`)
}
