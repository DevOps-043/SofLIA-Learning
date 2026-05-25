'use client'

import { createContext } from 'react'
import type { NotificationContextType } from './notification-context.types'

export const NotificationContext =
  createContext<NotificationContextType | undefined>(undefined)
