import { createRequire } from "module"
import { createParser } from "eventsource-parser"
import type { ParsedEvent, ReconnectInterval } from "eventsource-parser"

const require = createRequire(import.meta.url)
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai")

const endpoint = "https://edygpt-4.openai.azure.com/"
const azureApiKey = "76f97b3fe81643c99a97f7e90313d9a1"

const key35 = import.meta.env.AZURE_OPENAI_API_KEY_35
const url35 = import.meta.env.AZURE_OPENAI_API_URL_35
const model35 = import.meta.env.AZURE_OPENAI_API_MODEL_35

const key40 = import.meta.env.AZURE_OPENAI_API_KEY_40
const url40 = import.meta.env.AZURE_OPENAI_API_URL_40
const model40 = import.meta.env.AZURE_OPENAI_API_MODEL_40

// 初始化client 为3.5模型
let preModelType = '35'
let client = new OpenAIClient(url35, new AzureKeyCredential(key35))

export const aZureOpenAI = function (modelType, messages) {
    if (modelType !== preModelType) {
        preModelType = modelType
        client = new OpenAIClient(modelType === '35' ? url35 : url40, new AzureKeyCredential(modelType === '35' ? key35 : key40))
    }
    return client.listChatCompletions(modelType === '35' ? model35 : model40, messages, {
        temperature: 0.6,
        stream: true,
    })
}

/**
 * 微软api
 */
export const parseAzureOpenAIStream = (rawResponse: Response) => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of rawResponse as any) {
                const data = chunk.choices[0]?.finishReason;
                if (data === 'stop') {
                    controller.close()
                    return
                }
                const text = chunk.choices[0]?.delta?.content || ''
                const queue = encoder.encode(text)
                controller.enqueue(queue)
            }
        },
    })

    return new Response(stream)
}
