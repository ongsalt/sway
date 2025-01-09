import Elysia from "elysia";

const app = new Elysia()
    .get('/', () => 'hello world')

app.listen(49071)

console.log(`Starting listening on port ${app.server?.port}`)