import getApp from './app'
import { init, connect } from './models'


(async () => {
  if (!process.env.DB_STRING) {
    console.error('DB_STRING not specified!')
    return
  }
  const models = await connect(process.env.DB_STRING)
  console.log('connected to db')
  await init(models)
  console.log('initialized db')
  const app = await getApp(models)
  app.listen(3000, () => console.log('Example app listening on port 3000!'))
})().catch(console.error)
