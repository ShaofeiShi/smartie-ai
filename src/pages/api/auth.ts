import type { APIRoute } from 'astro'
import {findUser} from '../../utils/auth'
  
const realPassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async(context) => {
  const body = await context.request.json()

  const { pass } = body
  const test = null

  findUser()
  
  return new Response(JSON.stringify({
    code: (!realPassword || test === realPassword) ? 0 : -1,
  }))
}
