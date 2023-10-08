
import { createRequire } from "module"
import { createParser } from 'eventsource-parser'
import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser'

const require = createRequire(import.meta.url)
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const endpoint = "https://edy01.openai.azure.com/"
const azureApiKey = 'b764c64b2e0c431cb43e1058e9f053dd'

const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

export const aZureOpenAI = function(modelType, messages) {
    return client.listChatCompletions('gpt-35-turbo', messages, {
        temperature: 0.6,
        stream: true,
    });
}

export const parseAzureOpenAIStream = async (rawResponse: Response) => {
    const result = [];
    for await (const chunk of rawResponse as any) {
        result.push(chunk.choices[0]);
    }
    return new Response(JSON.stringify(result))
  }
  