import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div>
      <h1>Welcome to Plor</h1>
      <p>Imagine, Create, Play</p>
      <Link to="/login">Login</Link>
      {' | '}
      <Link to="/register">Register</Link>
    </div>
  )
}
