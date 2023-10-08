// #vercel-disable-blocks
import { ProxyAgent, fetch } from 'undici'
import { createRequire } from "module"
// #vercel-end
import { generatePayload, parseOpenAIStream, generateAzurePayload } from '@/utils/openAI'
import { verifySignature } from '@/utils/auth'
import { verifyToken } from '@/utils/jwt'
import type { APIRoute } from 'astro'
import { aZureOpenAI, parseAzureOpenAIStream } from '@/utils/azureAI'

const require = createRequire(import.meta.url)
const tiktoken = require('tiktoken-node')
const enc = tiktoken.encodingForModel("gpt-3.5-turbo-16k")


const apiKey = import.meta.env.OPENAI_API_KEY
const apiAdminKey = import.meta.env.OPENAI_API_ADMIN_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = ((import.meta.env.OPENAI_API_BASE_URL) || 'https://api.openai.com').trim().replace(/\/$/, '')
// const sitePassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async(context) => {
  const body = await context.request.json()
  const token = context.cookies.get('token').value
  const { sign, time, messages, modelType, isAdmin } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }
  const validateUser = verifyToken(token)

  const periodTime = new Date(validateUser.period_time).getTime()
  const now = new Date().getTime()
  if (!validateUser) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid token.',
      },
    }), { status: 401 })
  }
  if (now > periodTime) {
    return new Response(JSON.stringify({
      error: {
        message: '您的会员已过期.',
      },
    }), { status: 403 })
  }
  // if (sitePassword && sitePassword !== pass) {
  //   return new Response(JSON.stringify({
  //     error: {
  //       message: 'Invalid password.',
  //     },
  //   }), { status: 401 })
  // }
  if (import.meta.env.PROD && !await verifySignature({ t: time, m: messages?.[messages.length - 1]?.content || '' }, sign)) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid signature.',
      },
    }), { status: 401 })
  }
  // 最多 15 * 1024 个tikToken，多余的截取
  let tikTokenLen = 0;
  const messageCurrent = messages.reduceRight((arr, item) => {
    if (tikTokenLen < 15 * 1024) { // 最多不能超过15 * 1024
      const tikTokenResult = enc.encode(item.content || '')
      arr.push(item)
      tikTokenLen = tikTokenLen + tikTokenResult.length
    }
    return arr;
  }, []).reverse()
  const initOptions = generatePayload(isAdmin ? apiAdminKey : apiAdminKey, messageCurrent, modelType)
  // #vercel-disable-blocks
  if (httpsProxy)
    initOptions.dispatcher = new ProxyAgent(httpsProxy)
  // #vercel-end

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  // console.log(messages, 'messages')
  // for await (const event of response) {
  //   for (const choice of event.choices) {
  //     const delta = choice.delta?.content;
  //     if (delta !== undefined) {
  //       console.log(`Chatbot: ${delta}`);
  //     }
  //   }
  // }
  const response = await aZureOpenAI(modelType, messages)
  console.log(response, 'response')
  return parseAzureOpenAIStream(response) as Response


  // const response = await fetch(`${baseUrl}/v1/chat/completions`, initOptions).catch((err: Error) => {
  //   console.error(err)
  //   return new Response(JSON.stringify({
  //     error: {
  //       code: err.name,
  //       message: err.message,
  //     },
  //   }), { status: 500 })
  // }) as Response
  // console.log(response, 'response')
  // return parseOpenAIStream(response) as Response
}
