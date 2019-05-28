import express, { Request, NextFunction, Response, Application } from 'express'
import path from 'path'
import history from 'connect-history-api-fallback'
import cookieSession from 'cookie-session'
import cookieParser from 'cookie-parser'
import { Models } from './models'
import apiRouter from './api'
import authRouter, { rndKey, csrfMiddleware, logoutMiddleware } from './auth'


export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(req.url, err.stack)
  res.status(500).send('Internal server error')
  next()
}

const noCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
}

export const configure = (app: Application, models: Models) => {
  app.use(cookieParser())
  app.use(cookieSession({
    name: 'session',
    keys: [rndKey(), rndKey(), rndKey()],
  }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/api', noCacheMiddleware, csrfMiddleware, apiRouter(models))
  app.use('/auth', noCacheMiddleware, csrfMiddleware, authRouter(models))
  app.use('/', express.static(path.join(__dirname, 'static')))
  app.use(logoutMiddleware)
  app.use(history())
}

export const getApp = (models: Models) => {
  const app = express()
  configure(app, models)
  app.use('/', express.static(path.join(__dirname, 'client')))
  app.use(errorMiddleware)
  return app
}
