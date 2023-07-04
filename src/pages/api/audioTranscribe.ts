/**
 * 语音转文本
 */
import { createRequire } from "module"
import type { APIRoute } from "astro"
import { nanoid } from "nanoid"

const require = createRequire(import.meta.url)
const { Configuration, OpenAIApi } = require("openai")
const fs = require("fs")
const configuration = new Configuration({
  apiKey: import.meta.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export const post: APIRoute = async (context) => {
  // 生成随机文件名保存语音
  const randomFileName = nanoid()
  const url = `./${randomFileName}.mp3`
  // 接收request中的文件base64格式文件
  const body = await context.request.json()
  const { audioFile } = body
  const base64Data = audioFile.replace(/^data:audio\/\w+;base64,/, "")
  const audioFileBuffer = Buffer.from(base64Data, "base64")

  // 写入文件
  await fs.writeFileSync(url, audioFileBuffer)

  const readStream = fs.createReadStream(url)
  let result = {
    code: -1,
    message: '遇到问题请重试',
    data: {}
  }

  try {
    const {
      data: { text: prompt },
    } = await openai.createTranscription(readStream, "whisper-1")
    result.code = 0
    result.message = '语音转化文字成功'
    result.data = {
        text: prompt
    };
    console.log(prompt, 'prompt')
  } catch (err) {
    console.log(err, "translate file error")
  } finally {
    try {
        fs.unlinkSync(url) // 完成转化以后删除文件
    } catch (err) {
        console.log(err, 'delete file error')
    }
  }
  return new Response(JSON.stringify(result))
}
