fs = require 'fs'
path = require 'path'

exports.loadData = (name)->
  return fs.readFileSync(path.join(__dirname, "./dat/#{name}.dat"))
