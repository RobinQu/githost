githost = require '..'
fs = require 'fs'
expect = require('chai').expect

describe 'Githost', ->

  git = new githost.GitHost()

  it 'should create and remove repo', (done)->
    repo = {group: 'super', name: 'man'}
    git.create(repo).then(->
      fp = git.resolve(repo)
      expect(fs.existsSync(fp)).to.be.ok
      git.remove(repo).then(->
        expect(fs.existsSync(fp)).not.to.be.ok
        done()
        )
      ).catch(done)
