var ProjectReddit = function () {
  var posts = Collection();

  var $posts = $('.posts');

  var refreshPosts = function () {
    $.get( "/api/posts", function( data ) {
      posts.models = [];
      for (var i = 0; i < data.length; i += 1) {
        posts.models.push(Model(data[i]));
      }
      app.renderPosts();
      app.renderComments();
    });
  };

  var createPost = function (text, user) {
    var postModel = Model({ text: text, name: user, comments: []});

    postModel.change(function () {
      app.renderComments();
    });

    posts.add(postModel);
    $.post( "/api/posts", JSON.stringify({text:text, name:user, comments:[]}), function( error,data ) {
      alert( "Post was saved to server" );
    });
    // this should be triggered when you add something to `posts`
    app.renderPosts();
    app.renderComments();
  };

  // Empty all the posts, then add them from the posts array along with our
  // new comments HTML
  var renderPosts = function () {
    $posts.empty();
    for (var i = 0; i < posts.models.length; i += 1) {
      var post = posts.models[i];

      var commentsContainer = '<div class="comments-container">' + '<div class=comments-list></div>' +
      '<input type="text" class="comment-name" placeholder="Comment Text">' + '<input type="text" class="comment-user" placeholder="User Name"><button class="btn btn-primary add-comment">Post Comment</button> </div>';

      $posts.append('<div class="post">'
        + '<a href="#" class="remove">remove</a> ' + '<a href="#" class="show-comments">comments</a> ' + post.get('text') +
        commentsContainer + ' <div> Posted By: <strong>' + post.get('name') + '</strong></div></div>');
    }
  }

  var renderComments = function () {
    $('.comments-list').empty();

    for (var i = 0; i < posts.models.length; i += 1) {
      // the current post in the iteration
      var post = posts.models[i];

      // index of the current post in the posts array
      var index = posts.models.indexOf(post);

      // finding the "post" element in the page that is equal to the
      // current post we're iterating on
      var $post = $('.posts').find('.post').eq(index);

      // iterate through each comment in our post's comments array
      for (var j = 0; j < post.get('comments').length; j += 1) {
        // the current comment in the iteration
        var comment = post.get('comments')[j];

        // append the comment to the post we wanted to comment on
        $post.find('.comments-list').append(
          '<div class="comment">' + comment.text +
          'Posted By: <strong>' + comment.name + '</strong><a class="remove-comment"><i class="fa fa-times" aria-hidden="true"></i></a>' +
          '</div>'
        );
      };
    };
  };

  var removePost = function (currentPost) {
    var $clickedPost = $(currentPost).closest('.post');

    var index = $clickedPost.index();
    $.ajax({
      url: "/api/posts/"+index,
      type: "DELETE",
      success: function( data ) {
        alert( "Post was deleted from server" );
      }
    });

    posts.models.splice(index, 1);
    $clickedPost.remove();

  }

  var toggleComments = function (currentPost) {
    var $clickedPost = $(currentPost).closest('.post');
    $clickedPost.find('.comments-container').toggleClass('show');
  }

  var createComment = function (text, name, postIndex) {
    var comment = { text: text, name: name };

    var currentComments = posts.models[postIndex].get('comments');

    var tempComments = [];

    tempComments.push(comment);

    var comments = currentComments.concat(tempComments)

    posts.models[postIndex].set('comments', comments)

    $.post( "/api/posts/"+postIndex+"/comments", JSON.stringify(comment), function( data ) {
      alert( "Comment was saved to server" );
    });
    app.renderComments();
  }

  var removeComment = function (commentButton) {
    // the comment element that we're wanting to remove
    var $clickedComment = $(commentButton).closest('.comment');

    // index of the comment element on the page
    var commentIndex = $clickedComment.index();

    // index of the post in the posts div that the comment belongs to
    var postIndex = $clickedComment.closest('.post').index();

    // removing the comment from the page
    $clickedComment.remove();

    // remove the comment from the comments array on the correct post object
    posts.models[postIndex].get('comments').splice(commentIndex, 1);
    $.ajax({
      url: "/api/posts/"+postIndex+"/comments/"+commentIndex,
      type: "DELETE",
      success: function( data ) {
        alert( "Comment was deleted from server" );
      }
    });
  }

  return {
    posts: posts,
    refreshPosts: refreshPosts,
    createPost: createPost,
    renderPosts: renderPosts,
    removePost: removePost,

    createComment: createComment,
    renderComments: renderComments,
    removeComment: removeComment,
    toggleComments: toggleComments
  }
}
$.ajaxSetup({contentType:"application/json"})
var app = ProjectReddit();

app.posts.change(function () {
  app.renderPosts();
});

app.refreshPosts();
app.renderPosts();
app.renderComments();

// Events
$('.add-post').on('click', function (e) {
  e.preventDefault();

  var text = $('#post-name').val();
  var user = $('#post-user').val();
  app.createPost(text, user);
});

$('.posts').on('click', '.remove', function () {
  app.removePost(this);
});

$('.posts').on('click', '.show-comments', function () {
  app.toggleComments(this);
});

$('.posts').on('click', '.add-comment', function () {
  var text = $(this).siblings('.comment-name').val();
  var name = $(this).siblings('.comment-user').val();

  // finding the index of the post in the page... will use it in #createComment
  var postIndex = $(this).closest('.post').index();

  app.createComment(text, name, postIndex);
});

$('.posts').on('click', '.remove-comment', function () {
  app.removeComment(this);
});
