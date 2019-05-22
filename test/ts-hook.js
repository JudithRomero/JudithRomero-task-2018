const path = require('path')
const project = path.resolve(__dirname, 'tsconfig.json')
require('dotenv/config')
process.env.TS_NODE_FILES = true
require('ts-node').register({ project })
