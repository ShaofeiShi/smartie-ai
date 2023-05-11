import type { APIRoute } from 'astro'

export const get: APIRoute = async(context) => {
  // 从cookie中获取token
  const token = context.cookies.get('token').value
  // const result = { code: 0, data: {}, message: '退出成功' }
  if (token)
    context.cookies.delete('token', { path: '/' })
  return context.redirect('/login')
  // return new Response(JSON.stringify(result))
}
