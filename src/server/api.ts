import express, { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Models } from './models'


const dbAdventuresToJson = (adventures: any[]) => adventures.map((x: any) => {
  const submissions: any = {}
  x.submissions.forEach((s: any) => {
    const prev = (submissions[s.user.name] && submissions[s.user.name][0]) || 0
    submissions[s.userName] = [prev + 1, s.user.avatarUrl]
  })
  return [
    x.id,
    x.name,
    x.description,
    x.sceneId,
    x.imageUrl,
    x.tags.map((tt: any) => [tt.name, tt.linkName]),
    submissions,
  ]
})

export default (models: Models) => {
  const router = express.Router()
  const get = (
    url: string,
    handler: (req: Request, res: Response) => Promise<void>,
  ) => router.get(url, (req, res, next) => handler(req, res).catch(next))

  get('/search', async (req, res) => {
    const { p, q, t } = req.query
    const page = p ? Math.abs(Math.round(Number(p))) : 0
    const query = `%${q || ''}%`
    if (t) {
      const adv2 = await models.adventure.findAndCountAll({
        where: {
          [Op.or]: [{ name: { [Op.iLike]: query } }, { name: { [Op.iLike]: query } }],
          sceneId: { [Op.not]: null },
        },
        offset: page * 5,
        limit: 5,
        include: [
          {
            model: models.tag,
            where: { linkName: { [Op.in]: [].concat(t) } },
            include: [{ model: models.adventure, include: [models.tag] }],
          },
          { model: models.submission, include: [models.user] },
        ],
        order: [['id', 'ASC']],
      })
      const allTags: any = {}
      adv2.rows.forEach((aa: any) => aa.tags.forEach((tt: any) => tt.adventures.forEach(
        (adv: any) => adv.tags.forEach((tag: any) => {
          if (allTags[tag.linkName]) {
            allTags[tag.linkName].advs.push(adv.id)
            return
          }
          allTags[tag.linkName] = { name: tag.name, linkName: tag.linkName, advs: [adv.id] }
        }),
      )))
      adv2.rows.forEach((adv: any) => {
        adv.tags = []
      })
      adv2.rows.forEach((adv: any) => {
        adv.tags.push(...Object.values(allTags).filter((tag: any) => tag.advs.includes(adv.id)))
      })
      res.json(dbAdventuresToJson(adv2.rows))
    } else {
      const dbAdventures = await models.adventure.findAndCountAll({
        where: {
          [Op.or]: [{ name: { [Op.iLike]: query } }, { name: { [Op.iLike]: query } }],
          sceneId: { [Op.not]: null },
        },
        offset: page * 5,
        limit: 5,
        include: [models.tag, { model: models.submission, include: [models.user] }],
        order: [['id', 'ASC']],
      })
      res.json(dbAdventuresToJson(dbAdventures.rows))
    }
  })

  get('/tag/:tag', async (req, res) => {
    const { tag } = req.params
    const tagData: any = await models.tag
      .findOne({
        include: [{
          model: models.adventure,
          where: { sceneId: { [Op.not]: null } },
          include: [models.tag, { model: models.submission, include: [models.user] }],
        }],
        where: { linkName: tag },
      })
    if (!tagData) {
      res.sendStatus(404)
      return
    }
    const adventures = dbAdventuresToJson(tagData.adventures)
    res.json({ adventures, title: tagData.name })
  })

  get('/tags', async (req, res) => {
    const tags = (await models.tag.findAll()).map((x: any) => [x.name, x.linkName])
    res.json(tags)
  })

  get('/scene/:sceneId', async (req, res) => {
    const { sceneId } = req.params
    const adventureId = req.query.a
    const dbScene: any = await models.scene
      .findByPk(sceneId, { include: [models.action, models.achievement] })
    if (!dbScene) {
      res.sendStatus(404)
      return
    }
    const userName = (req as any).session.username
    if (dbScene.final && userName && adventureId) {
      await models.submission.create({ userName, adventureId })
    }
    const scene = {
      description: dbScene.description,
      textAlign: dbScene.textAlign,
      imageUrl: dbScene.imageUrl,
      actions: dbScene.actions.map((x: any) => [x.sceneId, x.description]),
      achievements: dbScene.achievements.map((x: any) => [x.description, x.imageUrl]),
    }
    res.json(scene)
  })

  return router
}
