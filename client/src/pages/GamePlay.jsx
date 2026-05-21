import React from 'react'
import { useParams } from 'react-router-dom'

export default function GamePlay() {
  const { id } = useParams()

  return (
    <div>
      <h1>Playing Game</h1>
      <p>Game ID: {id} — gameplay coming soon</p>
    </div>
  )
}
