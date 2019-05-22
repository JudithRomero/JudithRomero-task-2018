/* eslint-disable no-unused-expressions */
import chai, { assert } from 'chai'
import { describe, it, before, after } from 'mocha'
import express from 'express'
import chaiHttp from 'chai-http'
import * as _ from 'lodash'
import { getApp } from '../src/server/app'
import { connect, Models } from '../src/server/models'


chai.use(chaiHttp)

describe('/api/search', () => {
  let app: express.Application
  let models: Models
  const titles = _.range(6).map(i => `adv${[...Array(i).keys()].map(() => '#').join('')}`)

  before(async () => {
    assert.typeOf(process.env.TEST_DB_STRING, 'string')
    models = await connect(String(process.env.TEST_DB_STRING))
    await models.db.sync({ force: true })
    const tags: any[] = await Promise.all([1, 2, 3].map(i => models.tag.create({
      name: `tag-${i}`,
      linkName: `tag${[...Array(i).keys()].map(() => '$').join('')}`,
    })))
    const scene: any = await models.scene.create({
      description: 'desc',
      textAlign: 'NE',
    })
    const ads: any[] = await Promise.all(titles.map((name, i) => models.adventure.create({
      name,
      description: `desc${[...Array(i).keys()].map(() => '.').join('')}`,
      sceneId: scene.id,
    })))
    await Promise.all([
      models.adventureTag.create({ adventureId: ads[1].id, tagId: tags[0].id }),
      models.adventureTag.create({ adventureId: ads[2].id, tagId: tags[0].id }),
      models.adventureTag.create({ adventureId: ads[3].id, tagId: tags[0].id }),
      models.adventureTag.create({ adventureId: ads[4].id, tagId: tags[0].id }),
      models.adventureTag.create({ adventureId: ads[5].id, tagId: tags[1].id }),
      models.adventureTag.create({ adventureId: ads[1].id, tagId: tags[2].id }),
      models.adventureTag.create({ adventureId: ads[2].id, tagId: tags[2].id }),
    ])
    app = await getApp(models)
  })

  after(() => models.db.close())

  const assertPages = (pages: any[], expectedTitles: string[]) => {
    const allTitles = [].concat(...pages.map((p: any) => p.body.map((x: any) => x[0])))
    assert.lengthOf(_.intersection(allTitles, expectedTitles), expectedTitles.length)
  }

  it('returns without query', async () => {
    const pages = await Promise.all([
      chai.request(app).get('/api/search'),
      chai.request(app).get('/api/search').query({ p: 1 }),
      chai.request(app).get('/api/search').query({ p: 2 }),
    ])

    pages.forEach(res => assert.equal(res.status, 200))
    assert.lengthOf(pages[0].body, 5)
    assert.lengthOf(pages[1].body, 1)
    assert.lengthOf(pages[2].body, 0)
    assertPages(pages, titles)
  })

  it('can query title', async () => {
    const pages = await Promise.all([
      chai.request(app).get('/api/search').query({ q: 'adv', p: 0 }),
      chai.request(app).get('/api/search').query({ q: 'adv', p: 1 }),
      chai.request(app).get('/api/search').query({ q: 'adv', p: 2 }),
    ])

    pages.forEach(res => assert.equal(res.status, 200))
    assert.lengthOf(pages[0].body, 5)
    assert.lengthOf(pages[1].body, 1)
    assert.lengthOf(pages[2].body, 0)
    assertPages(pages, titles)
  })

  it('can query description', async () => {
    const pages = await Promise.all([
      chai.request(app).get('/api/search').query({ q: 'desc', p: 0 }),
      chai.request(app).get('/api/search').query({ q: 'desc', p: 1 }),
      chai.request(app).get('/api/search').query({ q: 'desc', p: 2 }),
    ])

    pages.forEach(res => assert.equal(res.status, 200))
    assert.lengthOf(pages[0].body, 5)
    assert.lengthOf(pages[1].body, 1)
    assert.lengthOf(pages[2].body, 0)
    assertPages(pages, titles)
  })

  it('can query tags', async () => {
    const pages = await Promise.all([
      chai.request(app).get('/api/search').query({ t: ['tag$', 'tag$$'] }),
      chai.request(app).get('/api/search').query({ t: ['tag$', 'tag$$'], p: 1 }),
    ])

    pages.forEach(res => assert.equal(res.status, 200))
    assert.lengthOf(pages[0].body, 5)
    assert.lengthOf(pages[1].body, 0)
    assertPages(pages, titles.slice(1))
  })

  it('can do complex query', async () => {
    const pages = await Promise.all([
      chai.request(app).get('/api/search').query({ t: ['tag$$'], q: '.....' }),
      chai.request(app).get('/api/search').query({ q: '....' }),
      chai.request(app).get('/api/search').query({ t: ['tag$$$'], q: 'd' }),
    ])

    pages.forEach(res => assert.equal(res.status, 200))
    assert.lengthOf(pages[0].body, 1)
    assert.lengthOf(pages[1].body, 2)
    assert.lengthOf(pages[2].body, 2)
    assertPages([pages[0]], [titles[5]])
    assertPages([pages[1]], [titles[4], titles[5]])
    assertPages([pages[2]], [titles[1], titles[2]])
  })
})
