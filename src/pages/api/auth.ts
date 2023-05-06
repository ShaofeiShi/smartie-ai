import { createRequire } from 'module'
const require = createRequire(import.meta.url)
require('reflect-metadata')

import { createConnection } from 'typeorm'
import User from 'src/entity/User'
import type { APIRoute } from 'astro'

  
const realPassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async(context) => {
  const body = await context.request.json()

  const { pass } = body
  const test = null

  createConnection().then(async(connection) => {
    const firstUser = await connection.manager.findOne(User)
    console.log('get User: ', firstUser)
  }).catch(error => console.log(error))

  return new Response(JSON.stringify({
    code: (!realPassword || test === realPassword) ? 0 : -1,
  }))
}
