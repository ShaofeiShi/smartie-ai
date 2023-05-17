import { addNewUser, findOneUserByName } from '../../utils/user'
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

  const { user, nick, pass } = body

  const result = { code: -1, data: {}, message: '对不起，遇到一点错误，请稍后再试' }
  if (!user || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(user)) {
    result.message = '请输入正确的邮箱'
    return new Response(JSON.stringify(result))
  }
  if (!nick) {
    result.message = '请输入昵称'
    return new Response(JSON.stringify(result))
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/.test(pass)) {
    result.message = '密码必须包含大小写字母和数字，长度为8-20位'
    return new Response(JSON.stringify(result))
  }

  try {
    const userExists = await findOneUserByName(user, nick)

    if (userExists.length) {
      const { id, email, nickname } = userExists[0]
      if (email === user)
        result.message = '该邮箱已被注册'
      else if (nickname === nick)
        result.message = '该昵称已存在'
      return new Response(JSON.stringify(result))
    }

    const res = await addNewUser(user, nick, pass)
    // {
    //   fieldCount: 0,
    //   affectedRows: 1,
    //   insertId: 2,
    //   info: '',
    //   serverStatus: 2,
    //   warningStatus: 0
    // }
    console.log(res)
    if (res.affectedRows) {
      const token = generateToken({ id: res.insertId, nickname: nick })
      context.cookies.set('token', token, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 12, sameSite: 'strict' })
      result.code = 0
      result.message = '注册成功'
      result.data = { id: res.insertId, nickname: nick }
      return new Response(JSON.stringify(result))
    }
  } catch (err) {
    console.error(err)
  }
  return new Response(JSON.stringify(result))
}
