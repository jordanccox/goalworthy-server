import React, { Component } from 'react';

const Post = ({post}) => {
  return (
    <li>
      <span>{post.user} - {post.text}</span>
    </li>
  )
}

export default Post
