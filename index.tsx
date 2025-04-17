import cors from "@elysiajs/cors"
import {Html, html} from "@elysiajs/html"
import {GoogleGenAI} from "@google/genai"
import {Elysia, t} from "elysia"
import logixlysia from "logixlysia"
import markdownit from "markdown-it"

const ai = new GoogleGenAI({apiKey: import.meta.env.GOOGLE_API_KEY})
const md = markdownit()

function Layout({
    title,
    children,
}: {
    title?: string
    children: JSX.Element[] | JSX.Element
}) {
    return (
        <html>
            <head>
                <link rel="icon" href="https://chatgpt.com/favicon.ico" />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
                ></link>
                <title>{title ? `${title} - ChatGPT` : "ChatGPT"}</title>
            </head>
            <body>
                <main>{children}</main>
            </body>
        </html>
    )
}

const app = new Elysia()
    .use(logixlysia())
    .use(cors())
    .use(html())
    .get("/", () => {
        return (
            <Layout>
                <form method="get" action="/ask" class="col">
                    <input type="text" name="q" />
                    <div class="row ml-auto">
                        <select name="model">
                            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                        </select>
                        <button type="submit">Ask</button>
                    </div>
                </form>
            </Layout>
        )
    })
    .get(
        "/ask",
        async ({query: {q, model = "gemini-2.0-flash"}}) => {
            try {
                const [response, titleResponse] = await Promise.all([
                    ai.models.generateContent({
                        model,
                        contents: `System: You are ChatGPT, an advanced AI assistant powered by OpenAI's GPT-4o architecture. Your purpose is to be helpful, friendly, and intelligent in your interactions. You excel at reasoning, coding, writing, creativity, and conversation. You are speaking with a user named aspizu. Always respond in Markdown. \nUser: ${q}\n`,
                    }),
                    ai.models.generateContent({
                        model,
                        contents: `Generate a plain-text single-line short title for the following question: ${q}`,
                    }),
                ])
                if (response.text && titleResponse.text) {
                    return (
                        <Layout title={titleResponse.text}>
                            <a href="/">back</a>
                            <p>{q}</p>
                            <hr />
                            {md.render(response.text)}
                        </Layout>
                    )
                } else {
                    return (
                        <Layout>
                            <h1>Something went wrong</h1>
                            <span>No response from API</span>
                        </Layout>
                    )
                }
            } catch (error) {
                if (error instanceof Error) {
                    return (
                        <Layout>
                            <h1>Something went wrong</h1>
                            <span>{error.message}</span>
                        </Layout>
                    )
                }
            }
        },
        {
            query: t.Object({
                q: t.String(),
                model: t.Optional(t.Union([t.Literal("gemini-2.0-flash")])),
            }),
        }
    )
    .listen({
        hostname: import.meta.env.HOSTNAME,
        port: import.meta.env.PORT,
    })

export type App = typeof app
