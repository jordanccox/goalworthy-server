import React, { Component } from 'react';

class PostForm extends Component {
  constructor () {
    super()

    this.state = {
      user: '',
      text: ''
    }

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick () {
    const post = {
      user: this.state.user,
      text: this.state.text
    }

    this.props.addPost(post);
  }

  render() {
    return (
      <form className="beer-form">
        <h3>Add a New Post</h3>

        <div className="form-group">
          <input
            className="form-control"
            placeholder="Post Text"
            value={this.state.user}
            onChange={event => this.setState({user: event.target.value})}
             />

          <br/>

          <input
            className="form-control"
            placeholder="Post User"
            value={this.state.text}
            onChange={event => this.setState({text: event.target.value})}
            />
        </div>

        <button onClick={this.handleClick} type="button" className="btn btn-primary add-post">Post</button>
      </form>
    );
  }
}

export default PostForm;
