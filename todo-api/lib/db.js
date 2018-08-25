const {Pool} = require('pg')

const pool = new Pool()

exports.query = async (query, values) => {
  let client = null
  try {
    client = await pool.connect()
    const result = await client.query(query, values)
    return result
  } finally {
    if (client) {
      client.release()
    }
  }
}

exports.connect = async () => {
  return pool.connect()
}
