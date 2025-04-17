import cors from "@elysiajs/cors"
import {Html, html} from "@elysiajs/html"
import {GoogleGenAI} from "@google/genai"
import {Elysia, t} from "elysia"
import logixlysia from "logixlysia"
import markdownit from "markdown-it"

const ai = new GoogleGenAI({apiKey: import.meta.env.GOOGLE_API_KEY})
const md = markdownit()

const app = new Elysia()
    .use(logixlysia())
    .use(cors())
    .use(html())
    .get("/", () => {
        return (
            <html>
                <head>
                    <link rel="stylesheet" href="https://unpkg.com/7.css" />
                </head>
                <form method="get" action="/ask">
                    <input type="text" name="q" />
                    <select name="model">
                        <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    </select>
                    <button type="submit">Ask</button>
                </form>
            </html>
        )
    })
    .get(
        "/ask",
        async ({query: {q, model = "gemini-2.0-flash"}}) => {
            const response = await ai.models.generateContent({
                model,
                contents: `${q}`,
            })
            if (response.text) {
                const result = md.render(response.text)
                return result
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
