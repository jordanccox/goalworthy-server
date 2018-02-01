import React, { Component } from 'react';
import PostForm from './post-form';
import PostsList from './posts-list';

class App extends Component {
  constructor () {
    super()

    this.state = {
      posts: []
    }

    this.addPost = this.addPost.bind(this)
  }

  addPost (post) {
    this.setState({posts: this.state.posts.concat([post])});
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-6 col-md-offset-3">
          <div className="page-header">
            <h1>Project Reddit</h1>
          </div>

          <div className="posts">
          </div>

          <PostsList posts={this.state.posts} />

          <PostForm addPost={this.addPost} />
        </div>
      </div>
    );
  }
}

export default App;
