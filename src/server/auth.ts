import express, { Request, Response, NextFunction } from 'express'
import { hash, compare } from 'bcrypt'
import { Models } from './models'


export const checkUsername = (username: string) => username && !!/^[a-z0-9-]{1,50}$/i.exec(username)
export const checkPassword = (password: string) => password.length && password.length < 50
export const getImgurUrl = (imgurId: string) => imgurId && /^\w+$/.exec(imgurId) && `https://i.imgur.com/${imgurId}.png`
export const getHash = async (plain: string) => new Promise<string>(
  (res, rej) => hash(plain, 10, (err, h) => (err ? rej(err) : res(h))),
)
export const compareHashes = async (plain: string, h: string) => new Promise<boolean>(
  res => compare(plain, h, (err, c) => (err ? res(false) : res(c))),
)
export const rndKey = () => Math.random().toString(16).substr(2)
export const rndKeyN = (n: number) => [...Array(n).keys()].map(rndKey).join('')
export const updateCsrf = (res: Response) => res.cookie('csrf', rndKeyN(3), { sameSite: true })
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies.csrf) updateCsrf(res)
  next()
}
export const logoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const s = (req as any).session
  if (!s.username) {
    res.cookie('username', '', { sameSite: true })
    res.cookie('avatarUrl', '', { sameSite: true })
  }
  next()
}

const setSession = (req: Request, res: Response, username: string, avatarUrl: string) => {
  const s = (req as any).session
  s.username = username
  res.cookie('username', username, { sameSite: true })
  res.cookie('avatarUrl', avatarUrl, { sameSite: true })
}

const checkCsrf = (req: Request, res: Response, csrf: string) => {
  if (req.cookies.csrf && csrf !== req.cookies.csrf) {
    res.sendStatus(400)
    return false
  }
  return true
}

const checkForm = (req: Request, res: Response,
  username: string, password: string, csrf: string) => {
  if (!checkCsrf(req, res, csrf)) return false
  if (!checkUsername(username) || !checkPassword(password)) {
    res.sendStatus(400)
    return false
  }
  return true
}

export default (models: Models) => {
  const router = express.Router()
  const post = (
    url: string,
    handler: (req: Request, res: Response) => Promise<void>,
  ) => router.post(url, (req, res, next) => handler(req, res).catch(next))

  post('/register', async (req, res) => {
    const { username, password, imgurId, csrf } = req.body
    if (!checkForm(req, res, username, password, csrf)) return
    updateCsrf(res)
    const avatarUrl = getImgurUrl(imgurId) || `https://api.adorable.io/avatars/200/${rndKey()}`
    const passHash = await getHash(password)
    try {
      await models.user.create({
        name: username,
        password: passHash,
        avatarUrl,
      })
    } catch (err) {
      res.sendStatus(400)
      return
    }
    setSession(req, res, username, avatarUrl)
    res.sendStatus(200)
  })

  post('/login', async (req, res) => {
    const { username, password, csrf } = req.body
    if (!checkForm(req, res, username, password, csrf)) return
    updateCsrf(res)
    const user: any = await models.user.findByPk(username)
    const randomHash = await getHash(rndKey())
    const passHash = user ? user.password : randomHash
    if (!await compareHashes(password, passHash) || !user) {
      res.sendStatus(400)
      return
    }
    setSession(req, res, username, user.avatarUrl)
    res.sendStatus(200)
  })

  post('/logout', async (req, res) => {
    if (!checkCsrf(req, res, req.body.csrf)) return
    setSession(req, res, '', '')
    updateCsrf(res)
    res.redirect('/login')
  })

  return router
}
