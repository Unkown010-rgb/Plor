import React from 'react'
import { useParams } from 'react-router-dom'

export default function Profile() {
  const { username } = useParams()

  return (
    <div>
      <h1>Profile</h1>
      <p>Viewing profile for: {username} — coming soon</p>
    </div>
  )
}
