githost = require '../'
Promise = require 'bluebird'
sinon = require 'sinon'
request = require 'supertest'
Utils = require './utils'
expect = require('chai').expect

describe 'Delegate', ->

  stub = sinon.stub().callsArg(2)
  delegate = githost.HostDelegate.create(
    intercept: (event)->
      if event.repo.name.indexOf('bad') > -1
        Promise.resolve(ok: false, message: 'bad luck', status: 401)
      else
        Promise.resolve(ok: true)

    after: stub

  )

  srv = githost.repo(delegate: delegate)

  it 'should intercept', (done)->
    request(srv.listen())
    .get('/mygroup/bad.git/info/refs')
    .query({service: 'receive-pack'})
    .expect(401)
    .expect(/bad\sluck/)
    .end(done)

  it 'should invoke after hooks', (done)->
    request(srv.listen())
    .post('/mygroup/myrepo.git/git-upload-pack')
    .send(Utils.loadData('upload_pack_req'))
    .type('application/octet-stream')
    .expect(->
        expect(stub.called).to.be.ok
        event = stub.lastCall.args[0]
        expect(event.repo.name).to.equal('myrepo')
        expect(event.headers.length).to.above(0)
      )
    .end(done)
