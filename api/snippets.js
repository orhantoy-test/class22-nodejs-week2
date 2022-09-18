const express = require("express")
const knex = require("../database")
const router = express.Router()

// GET /api/snippets
router.get("/", async (request, response) => {
  const authHeader = request.get("Authorization")
  const authUser = await getUserFromAuthHeader(authHeader)

  if (authHeader && !authUser) {
    return response.status(403).json({ error: "Not authorized" })
  }

  let snippetsQuery = knex("snippets")

  if (authUser) {
    snippetsQuery = snippetsQuery.where({ user_id: authUser.id })
  } else {
    snippetsQuery = snippetsQuery.where({ is_private: false })
  }

  const snippets = await getSnippets(snippetsQuery)
  response.json(snippets)
})

// POST /api/snippets
router.post("/", async (request, response) => {
  const authHeader = request.get("Authorization")
  const authUser = await getUserFromAuthHeader(authHeader)

  if (!authUser) {
    response.status(403).json({ error: "Not authorized" })
    return
  }

  const [snippetId] = await knex("snippets").insert({
    title: request.body.title || "Untitled",
    contents: request.body.contents || "No contents",
    is_private: request.body.is_private,
    user_id: authUser.id,
  })

  response.status(201).json({ message: "Created snippet", id: snippetId })
})

// GET /api/snippets/:id
router.get("/:id", async (request, response) => {
  const authHeader = request.get("Authorization")
  const authUser = await getUserFromAuthHeader(authHeader)

  if (authHeader && !authUser) {
    return response.status(403).json({ error: "Not authorized" })
  }

  let snippetsQuery = knex("snippets").where({ "snippets.id": request.params.id }).limit(1)
  const snippets = await getSnippets(snippetsQuery)

  if (snippets.length > 0) {
    response.json(snippets[0])
  } else {
    response.status(404).json({ error: "Not found" })
  }
})

async function getUserFromAuthHeader(header) {
  if (typeof header !== "string") {
    return null
  }

  const [type, tokenValue] = header.split(" ", 2)
  let users = []

  if (type === "token" || typeof tokenValue === "string") {
    users = await knex("users").whereNotNull("confirmed_at").where({ token: tokenValue }).limit(1)
  }

  return users[0]
}

async function getSnippets(query) {
  const snippets = await query.join("users", "users.id", "snippets.user_id").select(["snippets.*", "users.first_name AS user_first_name", "users.last_name AS user_last_name"])

  return snippets.map((snippet) => {
    const { user_id, user_first_name, user_last_name, ...rest } = snippet

    return {
      ...rest,
      user: {
        id: user_id,
        first_name: user_first_name,
        last_name: user_last_name,
      },
    }
  })
}

module.exports = router
