import { generateToken, verifyToken } from '../../utils/jwt'
import type { APIRoute } from 'astro'

export const get: APIRoute = async(context) => {
  // 从cookie中获取token
  const token = context.cookies.get('token').value

  const result = { code: 0, data: {}, message: '登录成功' }

  const validateUser = verifyToken(token)
  console.log(validateUser)

  if (validateUser) {
    result.data = validateUser
  } else {
    context.cookies.delete('token', { path: '/' })
    result.code = -1
    result.message = '请先登录'
  }

  return new Response(JSON.stringify(result))
}
