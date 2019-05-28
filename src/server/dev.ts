import express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackConfig from '../client/webpack.dev'
import { errorMiddleware, configure } from './app'
import { init, connect, Models } from './models'


const getDevApp = (models: Models) => {
  const app = express()
  const w = webpack(webpackConfig)
  configure(app, models)
  app.use(webpackDevMiddleware(w, { stats: 'minimal' }))
  app.use(errorMiddleware)
  return app
}

(async () => {
  if (!process.env.DB_STRING) {
    console.error('DB_STRING not specified!')
    return
  }
  const port = parseInt(String(process.env.PORT), 10)
  if (Number.isNaN(port)) {
    console.error('PORT is not a number!')
    return
  }
  const models = await connect(process.env.DB_STRING)
  console.log('connected to db')
  await init(models)
  console.log('initialized db')
  const app = getDevApp(models)
  app.listen(port, () => console.log(`dev app listening on port ${port}!`))
})().catch(console.error)
