import { getAuthenticatedUser, toAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  return {
    user: toAuthUser(user)
  }
})
