var http = require('http');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser   = require('body-parser');

// State holding variables
var goals = [];
var user = {};
var categories = [];

// Setup router
var myRouter = Router();
myRouter.use(bodyParser.json());

// This function is a bit simpler...
http.createServer(function (request, response) {
  myRouter(request, response, finalHandler(request, response))
}).listen(3001);

// Notice how much cleaner these endpoint handlers are...
myRouter.get('/v1/goals', function(request,response) {
  response.end(JSON.stringify(goals));
});

// See how i'm not having to build up the raw data in the body... body parser just gives me the whole thing as an object.
// See how the router automatically handled the path value and extracted the value for me to use?  How nice!
myRouter.post('/v1/me/goals/:goalId/accept', function(request,response) {
  let goal = goals.find((goal)=> {
    return goal.id == request.params.goalId
  })
  user.acceptedGoals.push(goal); 
  response.end();
});