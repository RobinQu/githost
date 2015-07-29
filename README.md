# GitHost

HTTP Git sever, powered by koa


## Usage

Depends on `git` CLI currently. It will use something like `libgit` in the future.

### Basics

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

### Delegate

```
var githost = require('githost');

var delegate = githost.HostDelegate.create({

  //message to append
  message: function(event, write, end) {
    //event.repo.name
    //event.repo.group
    //event.type === 'reply'

    //write to client
    write('hello, world');
    end();
  },

  //interceptor for events
  intercept: function(event) {
    //event.repo.name
    //event.repo.group
    //event.repo.type is one of 'fetch', 'push', 'tag', 'info'


    //returns a yieldable to determine if this event should be intercepted
    return Promise.resolve(true);
  }
});

var app = githost.create({delegate: delegate});
app.listen(7070);
```


### Embbeded to another koa app

```
var mount = require('koa-mount');
var app = require('koa');
var githost = require('githost');

app.use(mount('/git', githost.create()));
app.use(function *() {
  if(this.path.indexOf('/git') === -1) {
    this.body = 'outside git repo';
  }
});

app.listen(8080);
```

## Remarks

* inspired by substack/pushover
