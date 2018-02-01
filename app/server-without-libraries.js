var http = require('http');
var serveStatic = require('serve-static')
var finalHandler = require('finalhandler')
// Serve up public folder as-is
var serve = serveStatic('public', {'index': ['index.html', 'index.htm']})

// State holding variables
var posts = [];

http.createServer(function (request, response) {
  const { headers, method, url } = request;
  // Serve all the static content (html, css, images, etc.)
  if (!url.includes('api')) {
    serve(request,response, finalHandler(request,response));
  }
  let body = [];
  request.on('error', (err) => {
    // Log any errors for now to the console to debug
    console.error(err);
  }).on('data', (chunk) => {
    // Add the data from the next 'chunk' to the data array
    body.push(chunk);
  }).on('end', () => {
    // Put together all the pieces of the request body
    body = Buffer.concat(body).toString();
    
    // Log errors for now
    response.on('error', (err) => {
      console.error(err);
    });
    
    // Offload the routing and handling of the api calls to helper function
    handleApiRequest(body,request,response);
  });
}).listen(8080);

function handleApiRequest(body, request,response) {
  // Set the default headers on the response
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json');
  if (request.method === "GET") {
    if (request.url === "/api/posts") {
      response.end(JSON.stringify(posts));
    } else if (request.url.search('/\/api\/posts\/*\/comments/')) {
      var postNumber = Number(request.url.match('/\d+$/'));
      response.end(JSON.stringify(posts[postNumber].comments));
    }
  } else if (request.method === "POST") {
    var postBody = JSON.parse(body);
    if (request.url === "/api/posts") {
      posts.push(postBody);
      response.end();
    } else if (request.url.search('/\/api\/posts\/*\/comments/')) {
      var postNumber = Number(request.url.match('/\d+$/'));
      posts[postNumber].comments.push(postBody); 
      response.end();
    }
  }
}
