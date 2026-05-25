import dotenv from 'dotenv'
import path from 'path'

import { validateEnv } from './env.validation'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

export const config = validateEnv()
