import express, { Request, NextFunction, Response } from 'express'
import path from 'path'
import hbs from 'hbs'
import { Op } from 'sequelize'
import { Models } from './models'


const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(req.url, err.stack)
  res.status(500).send('Internal server error')
  next()
}

export default async (models: Models) => {
  const app = express()
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))
  app.use('/', express.static(path.join(__dirname, 'static')))
  hbs.registerPartials(path.join(__dirname, 'views'))
  const get = (
    url: string,
    handler: (req: Request, res: Response) => Promise<void>,
  ) => app.get(url, (req, res, next) => handler(req, res).catch(next))

  get('/', async (req, res) => {
    const dbAdventures: any[] = await models.adventure
      .findAll({ include: [models.tag], where: { sceneId: { [Op.not]: null } } })
    const adventures = dbAdventures.map((x: any) => ({
      name: x.name,
      description: x.description,
      sceneId: x.sceneId,
      imageUrl: x.imageUrl,
      tags: x.tags.map((t: any) => [t.name, t.linkName]),
    }))
    res.render('index.hbs', { adventures })
  })

  get('/tag/:tag', async (req, res) => {
    const { tag } = req.params
    const tagData: any = await models.tag
      .findOne({
        include: [{
          model: models.adventure,
          where: { sceneId: { [Op.not]: null } },
          include: [models.tag],
        }],
        where: { linkName: tag },
      })
    if (!tagData) {
      res.sendStatus(404)
      return
    }
    const adventures = tagData.adventures.map((x: any) => ({
      name: x.name,
      description: x.description,
      sceneId: x.sceneId,
      imageUrl: x.imageUrl,
      tags: x.tags.map((t: any) => [t.name, t.linkName]),
    }))
    res.render('index.hbs', { adventures, title: tagData.name })
  })

  get('/scene/:sceneId', async (req, res) => {
    const { sceneId } = req.params
    const { root } = req.query
    const dbScene: any = await models.scene
      .findByPk(sceneId, { include: [models.action, models.achievement] })
    if (!dbScene) {
      res.sendStatus(404)
      return
    }
    const south = ['SE', 'SW'].includes(dbScene.textAlign) ? 'south' : ''
    const east = ['SE', 'NE'].includes(dbScene.textAlign) ? 'east' : ''
    const scene = {
      description: dbScene.description,
      textAlign: dbScene.textAlign,
      sceneTextClasses: dbScene.imageUrl ? `${south} ${east}` : '',
      imageUrl: dbScene.imageUrl,
      root,
      actions: dbScene.actions.length
        ? dbScene.actions.map((x: any) => [x.sceneId, x.description])
        : [[root, 'Начать заново']],
      achievements: dbScene.achievements.map((x: any) => [x.description, x.imageUrl]),
    }
    res.render('scene.hbs', scene)
  })

  app.use(errorMiddleware)
  app.use('*', (req, res) => {
    res.sendStatus(404)
  })

  return app
}
