/* eslint-disable no-unused-expressions */
import chai, { assert } from 'chai'
import { describe, it, before, after, beforeEach } from 'mocha'
import express from 'express'
import chaiHttp from 'chai-http'
import { getApp } from '../src/server/app'
import { connect, Models } from '../src/server/models'


chai.use(chaiHttp)

describe('/auth', () => {
  let app: express.Application
  let models: Models

  before(async () => {
    assert.typeOf(process.env.TEST_DB_STRING, 'string')
    models = await connect(String(process.env.TEST_DB_STRING))
    await models.db.sync({ force: true })
    app = await getApp(models)
  })

  beforeEach(() => models.db.sync({ force: true }))

  after(() => models.db.close())

  it('can register, logout and login', async () => {
    const res = await chai.request(app).post('/auth/register')
      .send({ username: '--droptables', password: '1234' }).redirects(0)
    const res2 = await chai.request(app).post('/auth/logout').redirects(0)
    const res3 = await chai.request(app).post('/auth/login')
      .send({ username: '--droptables', password: '1234' }).redirects(0)
    assert.equal(res.status, 200)
    assert.include(res.header['set-cookie'], 'username=--droptables; Path=/; SameSite=Strict')
    assert.equal(res2.status, 302)
    assert.equal(res3.status, 200)
  })

  it("can't register with existing username", async () => {
    await chai.request(app).post('/auth/register')
      .send({ username: '--droptables', password: '1234' })
    const res2 = await chai.request(app).post('/auth/register')
      .send({ username: '--droptables', password: '12345' }).redirects(0)
    const res3 = await chai.request(app).post('/auth/login')
      .send({ username: '--droptables', password: '1234' }).redirects(0)

    assert.equal(res2.status, 400)
    assert.equal(res3.status, 200)
  })
})
