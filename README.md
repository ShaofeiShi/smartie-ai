Pre environment
Node: Check that both your development environment and deployment environment are using Node v18 or later. You can use nvm to manage multiple node versions locally。
 node -v
PNPM: We recommend using pnpm to manage dependencies. If you have never installed pnpm, you can install it with the following command:
 npm i -g pnpm
OPENAI_API_KEY: Before running this application, you need to obtain the API key from OpenAI. You can register the API key at https://beta.openai.com/signup.


Getting Started
Install dependencies
 pnpm install
Copy the .env.example file, then rename it to .env, and add your OpenAI API key to the .env file.
 OPENAI_API_KEY=sk-xxx...
Run the application, the local project runs on http://localhost:3000/
 pnpm run dev