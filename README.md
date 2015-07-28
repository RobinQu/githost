# GitHost

HTTP Git sever, powered by koa


## Usage

Start GitHost server

```
var githost = require('githost');

githost.create().listen(8080, function () {
  console.log('git server is up and running at port 8080');
});
```

Using git commands, like:

```
git push http://localhost:8080/myGroup/myRepo master
```
