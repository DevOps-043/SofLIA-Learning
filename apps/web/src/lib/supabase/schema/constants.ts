export const Constants = {
  public: {
    Enums: {
      access_status: ['active', 'suspended', 'expired', 'cancelled'],
      discount_type: ['percentage', 'fixed_amount'],
      purchase_method: ['direct', 'subscription', 'gift', 'promo'],
    },
  },
} as const
