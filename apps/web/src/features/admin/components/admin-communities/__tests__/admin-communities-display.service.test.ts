import { describe, expect, it } from 'vitest'
import {
  getAdminCommunityCreatorInitial,
  getAdminCommunityStatusConfig,
  getAdminCommunityTypeConfig,
} from '../admin-communities-display.service'

const theme = {
  primaryColor: 'primary-token',
  successColor: 'success-token',
  warningColor: 'warning-token',
  dangerColor: 'danger-token',
  secondaryColor: 'secondary-token',
  mutedTextColor: 'muted-token',
  inputBg: 'input-token',
  borderColor: 'border-token',
}

describe('admin-communities-display.service', () => {
  it('resolves type badges from visibility and access type', () => {
    expect(
      getAdminCommunityTypeConfig(
        { visibility: 'private', access_type: 'open' },
        theme,
      ),
    ).toMatchObject({
      labelKey: 'communityCard.typePrivate',
      color: theme.warningColor,
    })

    expect(
      getAdminCommunityTypeConfig(
        { visibility: 'public', access_type: 'moderated' },
        theme,
      ),
    ).toMatchObject({
      labelKey: 'communityCard.typeModerated',
      color: theme.secondaryColor,
    })
  })

  it('resolves active and inactive status badges', () => {
    expect(getAdminCommunityStatusConfig(true, theme)).toMatchObject({
      labelKey: 'communityCard.statusActive',
      color: theme.successColor,
    })
    expect(getAdminCommunityStatusConfig(false, theme)).toMatchObject({
      labelKey: 'communityCard.statusInactive',
      color: theme.mutedTextColor,
      bg: theme.inputBg,
    })
  })

  it('builds creator initials with a fallback', () => {
    expect(getAdminCommunityCreatorInitial('Ada')).toBe('A')
    expect(getAdminCommunityCreatorInitial()).toBe('A')
  })
})
