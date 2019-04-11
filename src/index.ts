import getApp from './app'
import { init, connect } from './models'


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
  const app = await getApp(models)
  app.listen(port, () => console.log(`app listening on port ${port}!`))
})().catch(console.error)
