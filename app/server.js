var http = require('http');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser   = require('body-parser');
var fs = require('fs');
// State holding variables
var goals = [];
var user = {};
var users = [];
var categories = [];

// Setup router
var myRouter = Router();
myRouter.use(bodyParser.json());

// This function is a bit simpler...
http.createServer(function (request, response) {
  myRouter(request, response, finalHandler(request, response))
}).listen(3001, () => {
  //Load dummy data into server memory for serving
  goals = JSON.parse(fs.readFileSync("goals.json","utf-8"));
  
  users = JSON.parse(fs.readFileSync("users.json","utf-8"));
  user = users[0];
  
  categories = JSON.parse(fs.readFileSync("categories.json","utf-8"));
});

// Notice how much cleaner these endpoint handlers are...
myRouter.get('/v1/goals', function(request,response) {
  return response.end(JSON.stringify(goals));
});

// See how i'm not having to build up the raw data in the body... body parser just gives me the whole thing as an object.
// See how the router automatically handled the path value and extracted the value for me to use?  How nice!
myRouter.post('/v1/me/goals/:goalId/accept', function(request,response) {
  let goal = goals.find((goal)=> {
    return goal.id == request.params.goalId
  })
  user.acceptedGoals.push(goal); 
  return response.end();
});

myRouter.post('/v1/me/goals/:goalId/challenge/:userId', function(request,response) {
  let goal = goals.find((goal)=> {
    return goal.id == request.params.goalId
  })
  let challengedUser = users.find((user)=> {
    return user.id == request.params.userId
  })
  if (!goal) {
    response.statusCode = 400
    return response.end("No goal with that ID found.")
  }
  challengedUser.challengedGoals.push(goal); 
  return response.end();
});