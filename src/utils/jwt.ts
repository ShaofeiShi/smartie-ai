import jwt from 'jsonwebtoken'
interface TokenPaylout {
  id: number
  nickname: string
}
const secretKey = import.meta.env.PUBLIC_SECRET_KEY as string

export function generateToken(payload: TokenPaylout) {
  return jwt.sign(payload, secretKey, { expiresIn: '12h' })
}

export function verifyToken(token: string) {
  let decoded = null
  if (token) {
    try {
      decoded = jwt.verify(token, secretKey)
      return decoded
    } catch (error) {
      console.error(error)
    }
  }

  return decoded
}
