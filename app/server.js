const http = require("http");
const finalHandler = require("finalhandler");
const queryString = require("querystring");
const url = require("url");
const Router = require("router");
const bodyParser = require("body-parser");
const fs = require("fs");
const _ = require("lodash");
// State holding variables
let goals = [];
let user = {};
let users = [];
let categories = [];

// Setup router
let myRouter = Router();
myRouter.use(bodyParser.json());

// This function is a bit simpler...
http
  .createServer(function (request, response) {
    myRouter(request, response, finalHandler(request, response));
  })
  .listen(3001, () => {
    // Load dummy data into server memory for serving
    goals = JSON.parse(fs.readFileSync("goals.json", "utf-8"));

    // Load all users into users array and for now hardcode the first user to be "logged in"
    users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
    user = users[0];

    // Load all categories from file
    categories = JSON.parse(fs.readFileSync("categories.json", "utf-8"));
  });

// Notice how much cleaner these endpoint handlers are...
myRouter.get("/v1/goals", function (request, response) {
  // Get our query params from the query string
  const queryParams = queryString.parse(url.parse(request.url).query);

  // Copy goals immutably
  const goalsCopy = goals.map((goal) => Object.assign({}, goal));

  // Sort goals
  if (queryParams.sort === "upVotes") {
    goalsCopy.sort((a, b) => a.upVotes - b.upVotes);
  }

  if (queryParams.sort === "dateCreated") {
    goalsCopy.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
  }

  // Return goals matching query
  if (queryParams.query) {
    const filteredGoals = goalsCopy.filter((goal) => {
      const query = queryParams.query.toLowerCase();
      const description = goal.description.toLowerCase();
      const match = description.toLowerCase().match(query);

      if (match !== null) {
        return true;
      }

      return false;
    });

    // Handle empty goals array
    if (filteredGoals.length < 1) {
      response.statusCode = 404;
      return response.end(`No goals match query "${queryParams.query}"`);
    }

    return response.end(JSON.stringify(filteredGoals));
  }

  // Return all our current goals by default
  return response.end(JSON.stringify(goalsCopy));
});

// See how i'm not having to build up the raw data in the body... body parser just gives me the whole thing as an object.
// See how the router automatically handled the path value and extracted the value for me to use?  How nice!

// User profile
myRouter.get("/v1/me", function (request, response) {
  // 200 success
  if (!_.isEmpty(user)) {
    return response.end(JSON.stringify(user));
  }

  // Default error
  response.statusCode = 404;
  return response.end(`Error ${response.statusCode}: User profile not found`);
});

// Accept a goal challenge
myRouter.post("/v1/me/goals/:goalId/accept", function (request, response) {
  // Find goal from id in url in list of goals
  let goal = goals.find((goal) => {
    return goal.id == request.params.goalId;
  });

  // Handle goalId not found
  if (!goal) {
    response.statusCode = 400;
    return response.end(
      `Error ${response.statusCode}: No goal found with id of ${request.params.goalId}`
    );
  }

  // Check for duplicates
  if (user.acceptedGoals.find((goal) => goal.id == request.params.goalId)) {
    return response.end("User has already accepted this goal.");
  }

  // Add it to our logged in user's accepted goals
  user.acceptedGoals.push(goal);
  const usersOverwrite = users.map((user) => {
    return { ...user };
  });
  usersOverwrite.shift();
  usersOverwrite.unshift(user);
  fs.writeFile("users.json", JSON.stringify(usersOverwrite), (err) => {
    if (err) {
      throw err;
    }
  });

  // No response needed other than a 200 success
  return response.end();
});

myRouter.post("/v1/me/goals/:goalId/achieve", function (request, response) {
  // Find goal id
  const goal = goals.find((goal) => {
    return goal.id == request.params.goalId;
  });

  // Handle goalId not found
  if (!goal) {
    response.statusCode = 400;
    return response.end(
      `Error ${response.statusCode}: No goal found with id of ${request.params.goalId}`
    );
  }

  // User has already achieved goal
  if (user.achievedcurlGoals.find((goal) => goal.id == request.params.goalId)) {
    response.statusCode = 400;
    return response.end(
      `Error ${response.statusCode}: User has already achieved goal with id of ${request.params.goalId}`
    );
  }

  // Check for goal in user's acceptedGoals and add to achievedGoals if found
  if (user.acceptedGoals.find((goal) => goal.id == request.params.goalId)) {
    user.achievedGoals.push(goal);
    const usersOverwrite = users.map((user) => {
      return { ...user };
    });
    usersOverwrite.shift();
    usersOverwrite.unshift(user);
    fs.writeFile("users.json", JSON.stringify(usersOverwrite), (err) => {
      if (err) {
        throw err;
      }
    });

    // 200 success
    return response.end();
  }

  // User does not have goal in acceptedGoals
  response.statusCode = 400;
  return response.end(
    `Error ${response.statusCode}: User has not accepted goal with id of ${request.params.goalId}`
  );
});

myRouter.post(
  "/v1/me/goals/:goalId/challenge/:userId",
  function (request, response) {
    // Find goal from id in url in list of goals
    let goal = goals.find((goal) => {
      return goal.id == request.params.goalId;
    });

    // Find the user who is being challenged in our list of users
    let challengedUser = users.find((user) => {
      return user.id == request.params.userId;
    });

    // Make sure the data being changed is valid
    if (!goal) {
      response.statusCode = 400;
      return response.end(
        `Error ${response.statusCode}: No goal found with id of ${request.params.goalId}.`
      );
    }

    // Check for challenged user
    if (!challengedUser) {
      response.statusCode = 400;
      return response.end(
        `Error ${response.statusCode}: No user found with id of ${request.params.userId}`
      );
    }

    // If user has already accepted this goal, achieved this goal, or been challenged to do this goal, do nothing
    if (
      challengedUser.challengedGoals.find(
        (goal) => goal.id == request.params.goalId
      ) ||
      challengedUser.acceptedGoals.find(
        (goal) => goal.id == request.params.goalId
      ) ||
      challengedUser.achievedGoals.find(
        (goal) => goal.id == request.params.goalId
      )
    ) {
      // 200 response, but nohing happens because user has already been challenged to do this goal, accepted this goal, or achieved this goal
      return response.end();
    }

    // Add the goal to the challenged user
    challengedUser.challengedGoals.push(goal);
    const usersOverwrite = users.map((user) => {
      return { ...user };
    });
    usersOverwrite.filter((user) => user.id !== challengedUser.id);
    fs.writeFile("users.json", JSON.stringify(usersOverwrite), (err) => {
      if (err) {
        throw err;
      }
    });

    // No response needed other than a 200 success
    return response.end();
  }
);

// Gift a goal
myRouter.post(
  "/v1/me/goals/:goalId/gift/:userId",
  function (request, response) {
    // Find goal from id in url in list of goals
    const goal = goals.find((goal) => goal.id == request.params.goalId);

    // Check that goal exists
    if (!goal) {
      response.statusCode = 400;
      return response.end(
        `Error ${response.statusCode}: No goal found with id of ${request.params.goalId}.`
      );
    }

    // Find gifted user from userId and list of users
    const giftedUser = users.find((user) => user.id == request.params.userId);

    // Check gifted user exists
    if (!giftedUser) {
      response.statusCode = 400;
      return response.end(
        `Error ${response.statusCode}: No user found with id of ${request.params.userId}`
      );
    }

    // If user has already accepted this goal, achieved this goal, or been gifted this goal, do nothing
    if (
      giftedUser.giftedGoals.find((goal) => goal.id == request.params.goalId) ||
      giftedUser.acceptedGoals.find(
        (goal) => goal.id == request.params.goalId
      ) ||
      giftedUser.achievedGoals.find((goal) => goal.id == request.params.goalId)
    ) {
      // 200 response, but nohing happens because user has already been gifted this goal, accepted this goal, or achieved this goal
      return response.end();
    }

    // Add the goal to the gifted user
    giftedUser.giftedGoals.push(goal);
    const usersOverwrite = users.map((user) => {
      return { ...user };
    });
    usersOverwrite.filter((user) => user.id !== giftedUser.id);
    fs.writeFile("users.json", JSON.stringify(usersOverwrite), (err) => {
      if (err) {
        throw err;
      }
    });

    // No response needed other than a 200 success
    return response.end();
  }
);

// GET categories
myRouter.get("/v1/categories", function (request, response) {
  const queryParams = queryString.parse(url.parse(request.url).query);

  // Check categories exist
  if (categories.length <= 0 || !categories) {
    response.statusCode = 404;
    return response.end(`Error ${response.statusCode}: No categories found.`)
  }
  
  if (queryParams.limit) {
    const limitedCategories = [];

    const maxCategories = Math.min(queryParams.limit, categories.length)

    for (let i = 0; i < maxCategories; i++) {
      limitedCategories.push(categories[i]);
    }

    // Check limitedCategories is not empty
    if (limitedCategories.length <= 0) {
      response.statusCode = 400;
      return response.end(`Error ${response.statusCode}: Limit is less than or equal to 0.`)
    }

    // 200 success
    return response.end(JSON.stringify(limitedCategories));
  }

  // 200 success - return list of categories
  return response.end(JSON.stringify(categories));
});

// GET Goals in category
myRouter.get("/v1/categories/:categoryId/goals", function(request, response) {
  // Check categories exist
  if (categories.length <= 0 || !categories) {
    response.statusCode = 404;
    return response.end(`Error ${response.statusCode}: No categories found.`)
  }

  // Check goals exist
  if (goals.length <= 0 || !goals) {
    response.statusCode = 404;
    return response.end(`Error ${response.statusCode}: No goals found.`)
  }

  // Find category by id
  const category = categories.find((category) => category.id == request.params.categoryId);

  // Check category exists
  if (!category) {
    response.statusCode = 400;
    return response.end(`Error ${response.statusCode}: Category with id ${request.params.categoryId} does not exist.`);
  }

  // Find goals in category
  const categoryGoals = goals.filter((goal) => goal.categoryId == category.id);

  // Check category has goals
  if (!categoryGoals <= 0) {
    response.statusCode = 400;
    return response.end(`Error ${response.statusCode}: No goals exist in this category.`);
  }

  // 200 success
  return response.end(JSON.stringify(categoryGoals));
});
