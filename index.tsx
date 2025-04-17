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
            <>
                <form method="get" action="/ask" class="col">
                    <input type="text" name="q" />
                    <div class="row ml-auto">
                        <select name="model">
                            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                        </select>
                        <button type="submit">Ask</button>
                    </div>
                </form>
                <style>{`
                    .row { display: flex; flex-direction: row; }
                    .col { display: flex; flex-direction: column; }
                    .ml-auto { margin-left: auto; }
                `}</style>
            </>
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
                return (
                    <>
                        <a href="/">back</a>
                        <p>{q}</p>
                        <hr />
                        {result}
                    </>
                )
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
