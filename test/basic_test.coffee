githost = require '../'
request = require 'supertest'
Buffer = require('buffer').Buffer

sinon = require 'sinon'
expect = require('chai').expect

Utils = require './utils'

describe 'Simple HTTP', ->

  srv = githost.repo()

  it 'should handle info request', (done)->
    cb = sinon.spy()
    srv.once('git:info', cb)
    request(srv.listen())
    .get('/mygroup/myrepo.git/info/refs')
    .query({service: 'receive-pack'})
    .expect('content-type', 'application/x-git-receive-pack-advertisement')
    .expect(200)
    .expect(->
        event = cb.firstCall.args[0]
        expect(event.repo).to.be.ok
        expect(event.repo.name).to.equal('myrepo')
        expect(event.repo.group).to.equal('mygroup')
      )
    .end(done)


  it 'should handle upload', (done)->
    cb = sinon.spy()
    srv.once('git:header', cb)
    request(srv.listen())
    .post('/mygroup/myrepo.git/git-upload-pack')
    .send(Utils.loadData('upload_pack_req'))
    .type('application/octet-stream')
    .expect('content-type', 'application/x-git-upload-pack-result')
    .expect(200)
    .expect(->
        event = cb.firstCall.args[0]
        expect(event.repo).to.be.ok
        expect(event.repo.name).to.equal('myrepo')
        expect(event.repo.group).to.equal('mygroup')
      )
    .end(done)


  it 'should handle receieve', (done)->
    cb = sinon.spy()
    srv.once('git:header', cb)
    request(srv.listen())
    .post('/mygroup/myrepo.git/git-receive-pack')
    .type('application/octet-stream')
    .send(Utils.loadData('receive_pack_req'))
    .expect('content-type', 'application/x-git-receive-pack-result')
    .expect(200)
    .expect(->
        event = cb.firstCall.args[0]
        expect(event.repo).to.be.ok
        expect(event.repo.name).to.equal('myrepo')
        expect(event.repo.group).to.equal('mygroup')
      )
    .end(done)
