var http = require('http');
var serveStatic = require('serve-static');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser   = require('body-parser');

// Serve up public/ftp folder
var serve = serveStatic('public', {'index': ['index.html', 'index.htm']})

// State holding variables
var posts = [];

// Setup router
var myRouter = Router();
myRouter.use(bodyParser.json());

// This function is a bit simpler...
http.createServer(function (request, response) {
  if (request.url.includes('api')) {
    response.writeHead(200, {'Content-Type': 'application/json'});
    myRouter(request, response, finalHandler(request, response))
  } else {
    serve(request,response, finalHandler(request,response))
  }
}).listen(3001);

// Notice how much cleaner these endpoint handlers are...
myRouter.get('/api/posts', function(request,response) {
  response.end(JSON.stringify(posts));
});

// See how i'm not having to build up the raw data in the body... body parser just gives me the whole thing as an object.
myRouter.post('/api/posts', function(request,response) {
  posts.push(request.body);
  response.end();
});

// See how the router automatically handled the path value and extracted the value for me to use?  How nice!
myRouter.get('/api/posts/:postId/comments', function(request,response) {
  response.end(JSON.stringify(posts[request.params.postId].comments));
});

myRouter.post('/api/posts/:postId/comments', function(request,response) {
  posts[request.params.postId].comments.push(request.body); 
  response.end();
});