const express = require("express")
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Snippets API')
})

const snippetsRouter = require("./api/snippets")
app.use("/api/snippets", snippetsRouter)

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
