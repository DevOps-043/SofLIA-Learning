import { createAdminClient } from '../../../../lib/supabase/admin'
import type { UserSubscription } from '../../types/profile.types'
import { mapSubscriptionRecord } from '../profile.shared'

export async function getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
  try {
    const supabase = createAdminClient()
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        subscription_id,
        subscription_type,
        subscription_status,
        price_cents,
        start_date,
        end_date,
        next_billing_date,
        course_id,
        courses:course_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !subscriptions?.length) {
      return []
    }

    return subscriptions.map((record) => mapSubscriptionRecord(record))
  } catch {
    return []
  }
}
