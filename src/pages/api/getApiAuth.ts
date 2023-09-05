import { generateToken, verifyToken } from '../../utils/jwt'
import { getApiAuthInfoByEmail } from '../../utils/user'
import type { APIRoute } from 'astro'

export const get: APIRoute = async(context) => {
  // 从cookie中获取token
  const token = context.cookies.get('token').value
  const result = { code: 0, data: {times: 0}, message: '获取信息成功' }

  const validateUser = verifyToken(token)
  console.log(validateUser)

  if (!validateUser) {
    context.cookies.delete('token', { path: '/' })
    result.code = -1
    result.message = '请先登录'
  }

  try {
    const res: any = await getApiAuthInfoByEmail(validateUser.email)
    result.data = res
  } catch (err) {
    result.code = -1
    result.message = '对不起，遇到一点错误，请稍后再试'
  }
  return new Response(JSON.stringify(result))
}
