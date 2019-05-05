import express, { Request, NextFunction, Response } from 'express'
import path from 'path'
import hbs from 'hbs'
import sequelize, { Op } from 'sequelize'
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
  hbs.registerHelper('defaultImgPlaceholder',
    () => new hbs.handlebars.SafeString('onerror="this.src=\'/android-chrome-512x512.png\'"'))
  const get = (
    url: string,
    handler: (req: Request, res: Response) => Promise<void>,
  ) => app.get(url, (req, res, next) => handler(req, res).catch(next))

  get('/', async (req, res) => {
    const tags = (await models.tag.findAll()).map((x: any) => [x.name, x.linkName])
    res.render('index.hbs', { tags: JSON.stringify(tags) })
  })

  get('/api/search', async (req, res) => {
    const { p, q, t } = req.query
    const page = p ? Math.abs(Math.round(Number(p))) : 0
    const query = `%${q || ''}%`
    let rows: any[] = []
    if (t) {
      rows = await models.db.query(
        `SELECT a.*, t.name as "tagName", t."linkName" FROM (
          SELECT DISTINCT a.id FROM adventures AS a
            LEFT OUTER JOIN adventure_tags as at ON at."adventureId" = id
            JOIN tags as t ON t.id = at."tagId"
          WHERE t."linkName" IN (?) AND a."sceneId" IS NOT NULL
            AND (a.name ILIKE '%' || ? || '%' OR a.description ILIKE '%' || ? || '%')
          LIMIT 5 OFFSET ?
        ) as aid
          JOIN adventures as a ON a.id = aid.id
          LEFT OUTER JOIN adventure_tags as at ON at."adventureId" = aid.id
          JOIN tags as t ON t.id = at."tagId"`,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [[].concat(t), query, query, page * 5],
        },
      )
    } else {
      rows = await models.db.query(
        `SELECT a.*, t.name as "tagName", t."linkName" FROM (
          SELECT a.id FROM adventures AS a
          WHERE a."sceneId" IS NOT NULL AND (a.name ILIKE '%' || ? || '%' OR a.description ILIKE '%' || ? || '%')
          LIMIT 5 OFFSET ?
        ) as aid
          JOIN adventures as a ON a.id = aid.id
          LEFT OUTER JOIN adventure_tags as at ON at."adventureId" = aid.id
          LEFT OUTER JOIN tags as t ON t.id = at."tagId"`,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [query, query, page * 5],
        },
      )
    }
    const dbAdventures: any = {}
    rows.forEach((row: any) => {
      if (!(row.id in dbAdventures)) {
        const tags = row.tagName ? [[row.tagName, row.linkName]] : []
        dbAdventures[row.id] = [row.name, row.imageUrl, row.sceneId, row.description, tags]
      } else if (row.tagName) {
        dbAdventures[row.id][4].push([row.tagName, row.linkName])
      }
    })
    res.json(Object.values(dbAdventures))
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
    res.render('tag.hbs', { adventures, title: tagData.name })
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
