import { findOneUserByPwd, generateToken, verifyToken } from '../../utils/auth'
import type { APIRoute } from 'astro'

export const get: APIRoute = async(context) => {
  // 从cookie中获取token
  const token = context.cookies.get('token').value
  console.log(token)
  const result = { code: 0, data: {}, message: '登录成功' }
  if (token) {
    const payload = verifyToken(token)
    console.log(payload)
    if (payload) {
      result.data = payload
    } else {
      context.cookies.delete('token', { path: '/' })
      result.code = -1
      result.message = '请先登录'
    }
  } else {
    result.code = -1
    result.message = '请先登录'
  }
  return new Response(JSON.stringify(result))
}
