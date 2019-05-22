import express, { Request, NextFunction, Response } from 'express'
import path from 'path'
import history from 'connect-history-api-fallback'
import { Models } from './models'
import apiRouter from './api'


export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(req.url, err.stack)
  res.status(500).send('Internal server error')
  next()
}

export const getApp = (models: Models) => {
  const app = express()
  app.use('/', express.static(path.join(__dirname, 'static')))
  app.use('/api', apiRouter(models))
  app.use(history())
  app.use('/', express.static(path.join(__dirname, 'client')))
  app.use(errorMiddleware)

  return app
}
