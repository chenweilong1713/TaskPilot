import { createAccessSecret } from '../../../utils/accessTokens'

export default defineEventHandler(() => ({
  secret: createAccessSecret()
}))
