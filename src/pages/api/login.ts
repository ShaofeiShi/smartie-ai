import { findOneUserByPwd } from '../../utils/user'
import { generateToken } from '../../utils/jwt'
import type { APIRoute } from 'astro'
// [
//   {
//     id: 1,
//     email: 'sunchenmei@edianyun.com',
//     password: 'fbfb386efea67e816f2dda0a8c94a98eb203757aebb3f55f183755a192d44467',
//     nickname: 'mm',
//     created_at: 2023-05-04T13:53:56.000Z,
//     updated_at: 2023-05-04T13:53:56.000Z
//   }
// ]
export const post: APIRoute = async(context) => {
  const body = await context.request.json()

  const { user, pass } = body

  const result = { code: 0, data: {}, message: '登录成功' }

  try {
    const res = await findOneUserByPwd(user, pass)
    if (res.length) {
      const { id, email, nickname, period_time } = res[0]
      const token = generateToken({ id, nickname, period_time })
      result.data = { id, nickname, period_time }
      context.cookies.set('token', token, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24, sameSite: 'strict' })
    } else {
      result.code = -1
      result.message = '您输入的用户或密码错误'
    }
  } catch (err) {
    result.code = -1
    result.message = '对不起，遇到一点错误，请稍后再试'
  }
  return new Response(JSON.stringify(result))
}
