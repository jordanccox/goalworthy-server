var http = require('http');

// State holding variables
var goals = [];
var user = {};
var categories = [];

http.createServer(function (request, response) {
  const { headers, method, url } = request;
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
}).listen(3001);

function handleApiRequest(body, request,response) {
  // Set the default headers on the response
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json');
  if (request.method === "GET") {
    if (request.url === "/v1/goals") {
      response.end(JSON.stringify(goals));
    } 
  } else if (request.method === "POST") {
    var postBody = JSON.parse(body);
    if (request.url.search('/\/v1\/me\/goals\/*\/accept/')) {
      var goalId = Number(request.url.match('/\d+$/'));
      let goal = goals.find((goal)=> {
        return goal.id == goalId
      })
      user.acceptedGoals.push(postBody); 
      response.end();
    }
  }
}
