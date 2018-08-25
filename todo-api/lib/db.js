const {Pool} = require('pg')

const pool = new Pool()

exports.query = async (query, values) => {
  let client = null
  try {
    const client = await pool.connect()
    const result = await client.query(query, values)
    return result
  } finally {
    client && client.release()
  }
}

exports.connect = async () => {
  return pool.connect()
}
