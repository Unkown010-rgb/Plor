import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  '#FFCBA4', '#F4A460', '#D2691E', '#8B4513', '#4A2C0A',
  '#FFD700', '#FFA500', '#FF6B35', '#E74C3C', '#C0392B',
  '#9B59B6', '#3498DB', '#2ECC71', '#1ABC9C', '#F39C12',
  '#FFFFFF', '#ECF0F1', '#BDC3C7', '#95A5A6', '#2C3E50',
]

const SKIN_TONES = [
  { name: 'Light',  color: '#FFDBB4' },
  { name: 'Tan',    color: '#D4A576' },
  { name: 'Medium', color: '#C68642' },
  { name: 'Olive',  color: '#8D5524' },
  { name: 'Dark',   color: '#4A2710' },
]

const HAT_OPTIONS   = ['None', 'Cap', 'Crown', 'Top Hat', 'Bucket Hat']
const FACE_OPTIONS  = ['Classic', 'Surprised', 'Cool', 'Sad', 'Angry']
const HAIR_OPTIONS  = ['None', 'Short', 'Long', 'Spiky', 'Curly']
const SHIRT_STYLES  = ['Solid', 'Striped', 'Checkered']

const CATEGORY_TABS = ['Body', 'Face', 'Hair', 'Accessories', 'Clothing']

const PRESETS = {
  Classic: {
    headColor: '#FFCBA4', torsoColor: '#3498DB', leftArmColor: '#FFCBA4',
    rightArmColor: '#FFCBA4', leftLegColor: '#2C3E50', rightLegColor: '#2C3E50',
    hat: 'None', face: 'Classic', hair: 'Short', shirtStyle: 'Solid',
    shirtColor: '#3498DB', pantsColor: '#2C3E50',
  },
  Cool: {
    headColor: '#D4A576', torsoColor: '#2C3E50', leftArmColor: '#D4A576',
    rightArmColor: '#D4A576', leftLegColor: '#1A252F', rightLegColor: '#1A252F',
    hat: 'Cap', face: 'Cool', hair: 'Spiky', shirtStyle: 'Solid',
    shirtColor: '#2C3E50', pantsColor: '#1A252F',
  },
  Sporty: {
    headColor: '#FFCBA4', torsoColor: '#E74C3C', leftArmColor: '#FFCBA4',
    rightArmColor: '#FFCBA4', leftLegColor: '#ECF0F1', rightLegColor: '#ECF0F1',
    hat: 'Cap', face: 'Classic', hair: 'Short', shirtStyle: 'Striped',
    shirtColor: '#E74C3C', pantsColor: '#ECF0F1',
  },
  Fantasy: {
    headColor: '#C68642', torsoColor: '#9B59B6', leftArmColor: '#C68642',
    rightArmColor: '#C68642', leftLegColor: '#6C3483', rightLegColor: '#6C3483',
    hat: 'Crown', face: 'Surprised', hair: 'Long', shirtStyle: 'Checkered',
    shirtColor: '#9B59B6', pantsColor: '#6C3483',
  },
}

const DEFAULT_AVATAR = { ...PRESETS.Classic }

// ─── Canvas Drawing ────────────────────────────────────────────────────────────

function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawAvatar(canvas, avatarData, rotation = 0) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#1a1a2e')
  grad.addColorStop(1, '#16213e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Subtle grid dots background
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  for (let gx = 20; gx < W; gx += 30) {
    for (let gy = 20; gy < H; gy += 30) {
      ctx.beginPath()
      ctx.arc(gx, gy, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Apply rotation transform around center
  const cx = W / 2
  const cy = H / 2
  ctx.save()
  ctx.translate(cx, cy)

  // Skew for pseudo-3D rotation effect
  const skew = Math.sin(rotation) * 0.18
  const scaleX = Math.cos(rotation) * 0.12 + 0.88
  ctx.transform(scaleX, 0, skew, 1, 0, 0)
  ctx.translate(-cx, -cy)

  // ── Shadow beneath avatar ──────────────────────────────────────────────────
  const shadowGrad = ctx.createRadialGradient(cx, H - 55, 5, cx, H - 55, 75)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.35)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(cx, H - 55, 75, 20, 0, 0, Math.PI * 2)
  ctx.fill()

  // ── Measurements (all relative to canvas center) ──────────────────────────
  const headW = 72, headH = 72
  const torsoW = 82, torsoH = 96
  const armW = 26, armH = 80
  const legW = 32, legH = 88

  const avatarH = headH + torsoH + legH
  const topY = (H - avatarH) / 2 - 10

  const headX = cx - headW / 2
  const headY = topY

  const torsoX = cx - torsoW / 2
  const torsoY = headY + headH - 4  // slight overlap for seamless look

  const leftArmX  = torsoX - armW - 4
  const rightArmX = torsoX + torsoW + 4
  const armY      = torsoY + 6

  const leftLegX  = cx - legW - 4
  const rightLegX = cx + 4
  const legY      = torsoY + torsoH - 4

  // ── Helper: body part with stroke ─────────────────────────────────────────
  function bodyPart(color, x, y, w, h, radius = 8) {
    roundedRect(ctx, x, y, w, h, radius)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Subtle highlight sheen
    const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.5)
    sheen.addColorStop(0, 'rgba(255,255,255,0.18)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    roundedRect(ctx, x, y, w, h * 0.5, radius)
    ctx.fillStyle = sheen
    ctx.fill()
  }

  // ── Shirt overlay helpers ──────────────────────────────────────────────────
  function drawShirt(x, y, w, h, style, color) {
    // Base torso color already drawn; draw shirt pattern on top
    ctx.save()
    roundedRect(ctx, x, y, w, h, 8)
    ctx.clip()

    if (style === 'Solid') {
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)
    } else if (style === 'Striped') {
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 5
      for (let lx = x - h; lx < x + w + h; lx += 14) {
        ctx.beginPath()
        ctx.moveTo(lx, y)
        ctx.lineTo(lx + h, y + h)
        ctx.stroke()
      }
    } else if (style === 'Checkered') {
      const tileSize = 14
      for (let ty = y; ty < y + h; ty += tileSize) {
        for (let tx = x; tx < x + w; tx += tileSize) {
          const even = ((Math.floor((tx - x) / tileSize) + Math.floor((ty - y) / tileSize)) % 2 === 0)
          ctx.fillStyle = even ? color : shadeColor(color, -40)
          ctx.fillRect(tx, ty, tileSize, tileSize)
        }
      }
    }

    // Stroke on top
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 2
    roundedRect(ctx, x, y, w, h, 8)
    ctx.stroke()

    // Sheen
    const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.5)
    sheen.addColorStop(0, 'rgba(255,255,255,0.15)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    roundedRect(ctx, x, y, w, h * 0.5, 8)
    ctx.fillStyle = sheen
    ctx.fill()

    ctx.restore()
  }

  // ── Pants overlay ─────────────────────────────────────────────────────────
  function drawPants(x, y, w, h, color) {
    roundedRect(ctx, x, y, w, h, 8)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 2
    ctx.stroke()
    const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.5)
    sheen.addColorStop(0, 'rgba(255,255,255,0.12)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    roundedRect(ctx, x, y, w, h * 0.5, 8)
    ctx.fillStyle = sheen
    ctx.fill()
  }

  // ── Draw limbs ────────────────────────────────────────────────────────────
  bodyPart(avatarData.leftArmColor,  leftArmX,  armY, armW, armH, 10)
  bodyPart(avatarData.rightArmColor, rightArmX, armY, armW, armH, 10)

  drawPants(leftLegX,  legY, legW, legH, avatarData.pantsColor)
  drawPants(rightLegX, legY, legW, legH, avatarData.pantsColor)

  // ── Draw torso with shirt ─────────────────────────────────────────────────
  drawShirt(torsoX, torsoY, torsoW, torsoH, avatarData.shirtStyle, avatarData.shirtColor)

  // ── Draw head ─────────────────────────────────────────────────────────────
  bodyPart(avatarData.headColor, headX, headY, headW, headH, 14)

  // Neck
  ctx.fillStyle = avatarData.headColor
  ctx.fillRect(cx - 10, torsoY - 6, 20, 10)

  // ── Draw face ─────────────────────────────────────────────────────────────
  drawFace(ctx, avatarData.face, headX, headY, headW, headH)

  // ── Draw hair ─────────────────────────────────────────────────────────────
  if (avatarData.hair !== 'None') {
    drawHair(ctx, avatarData.hair, headX, headY, headW, headH)
  }

  // ── Draw hat ─────────────────────────────────────────────────────────────
  if (avatarData.hat !== 'None') {
    drawHat(ctx, avatarData.hat, headX, headY, headW, headH)
  }

  ctx.restore()
}

function drawFace(ctx, faceType, hx, hy, hw, hh) {
  const cx = hx + hw / 2
  const eyeY = hy + hh * 0.42
  const eyeSpacing = 14
  const eyeSize = 7

  ctx.fillStyle = '#1a1a2e'

  if (faceType === 'Cool') {
    // Sunglasses
    ctx.fillStyle = '#1a1a2e'
    // Left lens
    roundedRect(ctx, cx - eyeSpacing - eyeSize, eyeY - eyeSize / 2, eyeSize * 2, eyeSize, 3)
    ctx.fill()
    // Right lens
    roundedRect(ctx, cx + eyeSpacing - eyeSize, eyeY - eyeSize / 2, eyeSize * 2, eyeSize, 3)
    ctx.fill()
    // Bridge
    ctx.fillRect(cx - eyeSpacing + eyeSize, eyeY - 1, eyeSpacing * 2 - eyeSize * 2, 2)
    // Frame arms
    ctx.fillRect(cx - eyeSpacing - eyeSize, eyeY - 1, -4, 2)
    ctx.fillRect(cx + eyeSpacing + eyeSize, eyeY - 1, 4, 2)
    ctx.fillStyle = 'rgba(100,180,255,0.5)'
    roundedRect(ctx, cx - eyeSpacing - eyeSize, eyeY - eyeSize / 2, eyeSize * 2, eyeSize, 3)
    ctx.fill()
    roundedRect(ctx, cx + eyeSpacing - eyeSize, eyeY - eyeSize / 2, eyeSize * 2, eyeSize, 3)
    ctx.fill()
  } else {
    // Eyes
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath()
    ctx.arc(cx - eyeSpacing, eyeY, eyeSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + eyeSpacing, eyeY, eyeSize / 2, 0, Math.PI * 2)
    ctx.fill()
    // Eye highlights
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.beginPath()
    ctx.arc(cx - eyeSpacing + 1.5, eyeY - 1.5, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + eyeSpacing + 1.5, eyeY - 1.5, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Mouth
  const mouthY = hy + hh * 0.68
  ctx.strokeStyle = '#1a1a2e'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()

  if (faceType === 'Classic') {
    ctx.arc(cx, mouthY - 4, 10, 0.15, Math.PI - 0.15)
    ctx.stroke()
  } else if (faceType === 'Surprised') {
    ctx.arc(cx, mouthY, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#1a1a2e'
    ctx.fill()
  } else if (faceType === 'Cool') {
    ctx.moveTo(cx - 9, mouthY)
    ctx.arc(cx, mouthY - 2, 9, Math.PI * 0.1, Math.PI * 0.9)
    ctx.stroke()
  } else if (faceType === 'Sad') {
    ctx.arc(cx, mouthY + 8, 10, Math.PI + 0.2, -0.2)
    ctx.stroke()
  } else if (faceType === 'Angry') {
    ctx.moveTo(cx - 9, mouthY + 3)
    ctx.lineTo(cx + 9, mouthY + 3)
    ctx.stroke()
    // Angry eyebrows
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - 16, eyeY - 10)
    ctx.lineTo(cx - 6, eyeY - 6)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + 16, eyeY - 10)
    ctx.lineTo(cx + 6, eyeY - 6)
    ctx.stroke()
  }
}

function drawHair(ctx, hairType, hx, hy, hw, hh) {
  const cx = hx + hw / 2
  ctx.fillStyle = '#4A2C0A'
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 1.5

  if (hairType === 'Short') {
    roundedRect(ctx, hx - 2, hy - 6, hw + 4, hh * 0.38, 10)
    ctx.fill()
    ctx.stroke()
  } else if (hairType === 'Long') {
    // Top
    roundedRect(ctx, hx - 2, hy - 6, hw + 4, hh * 0.35, 10)
    ctx.fill()
    ctx.stroke()
    // Sides flowing down
    roundedRect(ctx, hx - 8, hy + hh * 0.1, 12, hh * 0.7, 6)
    ctx.fill()
    ctx.stroke()
    roundedRect(ctx, hx + hw - 4, hy + hh * 0.1, 12, hh * 0.7, 6)
    ctx.fill()
    ctx.stroke()
  } else if (hairType === 'Spiky') {
    // Base
    roundedRect(ctx, hx - 2, hy - 4, hw + 4, hh * 0.32, 6)
    ctx.fill()
    ctx.stroke()
    // Spikes
    const spikePositions = [cx - 20, cx - 6, cx + 8, cx + 22]
    spikePositions.forEach(sx => {
      ctx.beginPath()
      ctx.moveTo(sx - 7, hy + 4)
      ctx.lineTo(sx, hy - 22)
      ctx.lineTo(sx + 7, hy + 4)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    })
  } else if (hairType === 'Curly') {
    roundedRect(ctx, hx - 4, hy - 8, hw + 8, hh * 0.42, 14)
    ctx.fill()
    ctx.stroke()
    // Curly bumps on top
    for (let i = 0; i < 5; i++) {
      const bx = hx + 6 + i * 13
      ctx.beginPath()
      ctx.arc(bx, hy - 4, 9, Math.PI, 0)
      ctx.fill()
      ctx.stroke()
    }
  }
}

function drawHat(ctx, hatType, hx, hy, hw, hh) {
  const cx = hx + hw / 2
  const brimY = hy + 4

  if (hatType === 'Cap') {
    // Bill / brim
    ctx.fillStyle = '#E74C3C'
    roundedRect(ctx, hx - 10, brimY - 4, hw + 20, 10, 4)
    ctx.fill()
    // Cap dome
    ctx.fillStyle = '#E74C3C'
    ctx.beginPath()
    ctx.arc(cx, brimY - 4, hw / 2 + 2, Math.PI, 0)
    ctx.fill()
    // Bill front extension
    ctx.fillStyle = '#C0392B'
    roundedRect(ctx, cx - 4, brimY - 2, hw / 2 + 14, 8, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1.5
    roundedRect(ctx, hx - 10, brimY - 4, hw + 20, 10, 4)
    ctx.stroke()
  } else if (hatType === 'Crown') {
    const crownBase = brimY - 2
    const crownH = 28
    // Base band
    ctx.fillStyle = '#F4D03F'
    roundedRect(ctx, hx, crownBase - 6, hw, 10, 4)
    ctx.fill()
    // Crown points
    const pts = 5
    const ptW = hw / pts
    for (let i = 0; i < pts; i++) {
      const px = hx + i * ptW
      ctx.beginPath()
      ctx.moveTo(px, crownBase)
      ctx.lineTo(px + ptW / 2, crownBase - crownH)
      ctx.lineTo(px + ptW, crownBase)
      ctx.closePath()
      ctx.fillStyle = '#F4D03F'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    // Gems
    const gemColors = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E74C3C']
    for (let i = 0; i < pts; i++) {
      const px = hx + i * ptW + ptW / 2
      ctx.fillStyle = gemColors[i % gemColors.length]
      ctx.beginPath()
      ctx.arc(px, crownBase - crownH + 5, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (hatType === 'Top Hat') {
    ctx.fillStyle = '#2C3E50'
    // Brim
    roundedRect(ctx, hx - 14, brimY - 6, hw + 28, 14, 5)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Cylinder
    roundedRect(ctx, hx + 4, brimY - 46, hw - 8, 44, 4)
    ctx.fillStyle = '#2C3E50'
    ctx.fill()
    ctx.stroke()
    // Band
    ctx.fillStyle = '#E74C3C'
    ctx.fillRect(hx + 4, brimY - 18, hw - 8, 7)
  } else if (hatType === 'Bucket Hat') {
    ctx.fillStyle = '#F39C12'
    // Top dome
    ctx.beginPath()
    ctx.arc(cx, brimY - 10, hw / 2 - 2, Math.PI, 0)
    ctx.fill()
    // Sides
    ctx.fillRect(hx, brimY - 10, hw, 14)
    // Brim
    roundedRect(ctx, hx - 12, brimY + 2, hw + 24, 10, 5)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 1.5
    roundedRect(ctx, hx - 12, brimY + 2, hw + 24, 10, 5)
    ctx.stroke()
    // Decorative line
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(hx + 4, brimY - 2)
    ctx.lineTo(hx + hw - 4, brimY - 2)
    ctx.stroke()
  }
}

function shadeColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav style={{
      background: 'linear-gradient(90deg, #0f0c29, #302b63, #24243e)',
      borderBottom: '2px solid rgba(99,102,241,0.4)',
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <span
          onClick={() => navigate('/home')}
          style={{ cursor: 'pointer', fontWeight: 900, fontSize: '24px', color: '#a78bfa', letterSpacing: '2px', textShadow: '0 0 12px rgba(167,139,250,0.6)' }}
        >
          PLOR
        </span>
        {['Home', 'Games', 'Avatar'].map(label => (
          <span
            key={label}
            onClick={() => navigate('/' + label.toLowerCase())}
            style={{
              cursor: 'pointer',
              color: label === 'Avatar' ? '#a78bfa' : 'rgba(255,255,255,0.7)',
              fontWeight: label === 'Avatar' ? 700 : 500,
              fontSize: '14px',
              letterSpacing: '0.5px',
              borderBottom: label === 'Avatar' ? '2px solid #a78bfa' : '2px solid transparent',
              paddingBottom: '2px',
              transition: 'color 0.2s',
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
          {user?.username}
        </span>
        <button
          onClick={logout}
          style={{
            background: 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.4)',
            color: '#a78bfa',
            padding: '6px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 4px',
        background: active ? 'rgba(167,139,250,0.2)' : 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #a78bfa' : '2px solid transparent',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.3px',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      color: 'rgba(255,255,255,0.4)',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      marginBottom: '8px',
      marginTop: '4px',
    }}>
      {children}
    </div>
  )
}

function ColorGrid({ selectedColor, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
      {COLOR_PALETTE.map(c => (
        <div
          key={c}
          onClick={() => onSelect(c)}
          title={c}
          style={{
            width: '100%',
            paddingBottom: '100%',
            background: c,
            borderRadius: '6px',
            cursor: 'pointer',
            border: selectedColor === c ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.1)',
            boxShadow: selectedColor === c ? '0 0 8px rgba(167,139,250,0.6)' : 'none',
            transition: 'transform 0.1s, box-shadow 0.1s',
            transform: selectedColor === c ? 'scale(1.12)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}

function OptionPill({ value, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: '20px',
        border: selected ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.1)',
        background: selected ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
        color: selected ? '#a78bfa' : 'rgba(255,255,255,0.65)',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: selected ? 700 : 500,
        transition: 'all 0.15s',
        boxShadow: selected ? '0 0 8px rgba(167,139,250,0.4)' : 'none',
      }}
    >
      {value}
    </button>
  )
}

function BodyPartColorRow({ label, colorKey, avatarData, onColor }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>{label}</span>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '6px',
          background: avatarData[colorKey],
          border: '2px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
        }} />
      </div>
      <ColorGrid selectedColor={avatarData[colorKey]} onSelect={c => onColor(colorKey, c)} />
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Avatar() {
  const { token, user } = useAuth()
  const [avatarData, setAvatarData] = useState(DEFAULT_AVATAR)
  const [activeCategory, setActiveCategory] = useState('Body')
  const [activeBodyPart, setActiveBodyPart] = useState('headColor')
  const [toastMsg, setToastMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotationAngle, setRotationAngle] = useState(0)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const rotStartRef = useRef(null)

  // Load avatar on mount
  useEffect(() => {
    if (!token) return
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.avatar && typeof data.avatar === 'object') {
          setAvatarData(prev => ({ ...DEFAULT_AVATAR, ...data.avatar }))
        }
      })
      .catch(() => {})
  }, [token])

  // Redraw canvas whenever avatarData or rotation changes
  useEffect(() => {
    drawAvatar(canvasRef.current, avatarData, rotationAngle)
  }, [avatarData, rotationAngle])

  // Rotation animation
  const startRotation = useCallback(() => {
    if (rotating) return
    setRotating(true)
    const duration = 1200
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // full 2pi rotation eased
      const angle = progress * Math.PI * 2 * Math.sin(progress * Math.PI)
      setRotationAngle(angle)
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setRotationAngle(0)
        setRotating(false)
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [rotating])

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [])

  const update = (key, value) => setAvatarData(prev => ({ ...prev, [key]: value }))

  const applyPreset = (name) => {
    setAvatarData({ ...DEFAULT_AVATAR, ...PRESETS[name] })
    showToast(`Applied "${name}" preset`)
  }

  const applySkinTone = (color) => {
    setAvatarData(prev => ({
      ...prev,
      headColor: color,
      leftArmColor: color,
      rightArmColor: color,
    }))
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2800)
  }

  const saveAvatar = async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/users/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: avatarData }),
      })
      if (res.ok) {
        showToast('Avatar saved successfully!')
      } else {
        showToast('Failed to save — please try again.')
      }
    } catch {
      showToast('Avatar saved locally (offline mode)')
    }
    setSaving(false)
  }

  // ── Panel content per category ──────────────────────────────────────────────
  const renderLeftPanel = () => {
    if (activeCategory === 'Body') {
      const bodyParts = [
        { label: 'Head', key: 'headColor' },
        { label: 'Torso', key: 'torsoColor' },
        { label: 'Left Arm', key: 'leftArmColor' },
        { label: 'Right Arm', key: 'rightArmColor' },
        { label: 'Left Leg', key: 'leftLegColor' },
        { label: 'Right Leg', key: 'rightLegColor' },
      ]
      return (
        <div>
          <SectionTitle>Skin Tone</SectionTitle>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {SKIN_TONES.map(st => (
              <div
                key={st.name}
                onClick={() => applySkinTone(st.color)}
                title={st.name}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: st.color,
                  border: avatarData.headColor === st.color ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.15)',
                  boxShadow: avatarData.headColor === st.color ? '0 0 8px rgba(167,139,250,0.5)' : 'none',
                }} />
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>{st.name}</span>
              </div>
            ))}
          </div>

          <SectionTitle>Body Part</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {bodyParts.map(bp => (
              <button
                key={bp.key}
                onClick={() => setActiveBodyPart(bp.key)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: activeBodyPart === bp.key ? '1.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.1)',
                  background: activeBodyPart === bp.key ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.04)',
                  color: activeBodyPart === bp.key ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '3px', background: avatarData[bp.key] }} />
                {bp.label}
              </button>
            ))}
          </div>
          <SectionTitle>Color</SectionTitle>
          <ColorGrid
            selectedColor={avatarData[activeBodyPart]}
            onSelect={c => update(activeBodyPart, c)}
          />
        </div>
      )
    }

    if (activeCategory === 'Face') {
      return (
        <div>
          <SectionTitle>Face Expression</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FACE_OPTIONS.map(f => (
              <OptionPill key={f} value={f} selected={avatarData.face === f} onClick={() => update('face', f)} />
            ))}
          </div>
        </div>
      )
    }

    if (activeCategory === 'Hair') {
      return (
        <div>
          <SectionTitle>Hair Style</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {HAIR_OPTIONS.map(h => (
              <OptionPill key={h} value={h} selected={avatarData.hair === h} onClick={() => update('hair', h)} />
            ))}
          </div>
          {avatarData.hair !== 'None' && (
            <>
              <SectionTitle>Hair Color</SectionTitle>
              <ColorGrid selectedColor={avatarData.hairColor || '#4A2C0A'} onSelect={c => update('hairColor', c)} />
            </>
          )}
        </div>
      )
    }

    if (activeCategory === 'Accessories') {
      return (
        <div>
          <SectionTitle>Hat / Headwear</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {HAT_OPTIONS.map(h => (
              <OptionPill key={h} value={h} selected={avatarData.hat === h} onClick={() => update('hat', h)} />
            ))}
          </div>
        </div>
      )
    }

    if (activeCategory === 'Clothing') {
      return (
        <div>
          <SectionTitle>Shirt Style</SectionTitle>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {SHIRT_STYLES.map(s => (
              <OptionPill key={s} value={s} selected={avatarData.shirtStyle === s} onClick={() => update('shirtStyle', s)} />
            ))}
          </div>
          <SectionTitle>Shirt Color</SectionTitle>
          <ColorGrid selectedColor={avatarData.shirtColor} onSelect={c => update('shirtColor', c)} />
          <SectionTitle>Pants Color</SectionTitle>
          <ColorGrid selectedColor={avatarData.pantsColor} onSelect={c => update('pantsColor', c)} />
        </div>
      )
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#fff', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Navbar />

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          border: '1px solid rgba(167,139,250,0.5)',
          color: '#a78bfa',
          padding: '12px 28px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '14px',
          zIndex: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div style={{
        padding: '28px 40px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Avatar Editor
          </h1>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Customize your Plor identity</span>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'flex', gap: '0', minHeight: 'calc(100vh - 130px)' }}>

        {/* ── Left Panel ─────────────────────────────────────────────────────── */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.015)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 4px' }}>
            {CATEGORY_TABS.map(tab => (
              <CategoryTab
                key={tab}
                label={tab}
                active={activeCategory === tab}
                onClick={() => setActiveCategory(tab)}
              />
            ))}
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
            {renderLeftPanel()}
          </div>
        </div>

        {/* ── Center Panel ───────────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.1)',
          gap: '24px',
        }}>
          {/* Canvas Container */}
          <div style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid rgba(167,139,250,0.2)',
            boxShadow: '0 0 40px rgba(167,139,250,0.1), 0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <canvas
              ref={canvasRef}
              width={360}
              height={480}
              style={{ display: 'block' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={startRotation}
              disabled={rotating}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                border: '1.5px solid rgba(167,139,250,0.4)',
                background: rotating ? 'rgba(255,255,255,0.04)' : 'rgba(167,139,250,0.12)',
                color: rotating ? 'rgba(255,255,255,0.3)' : '#a78bfa',
                cursor: rotating ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ display: 'inline-block', animation: rotating ? 'spin 1s linear infinite' : 'none' }}>
                &#8635;
              </span>
              {rotating ? 'Rotating…' : 'Rotate'}
            </button>

            <button
              onClick={saveAvatar}
              disabled={saving}
              style={{
                padding: '12px 36px',
                borderRadius: '12px',
                border: 'none',
                background: saving
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.5px',
                boxShadow: saving ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'Saving…' : 'Save Avatar'}
            </button>
          </div>

          {/* Quick Skin Tone strip */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Quick skin:</span>
            {SKIN_TONES.map(st => (
              <div
                key={st.name}
                onClick={() => applySkinTone(st.color)}
                title={st.name}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: st.color,
                  cursor: 'pointer',
                  border: avatarData.headColor === st.color ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.15)',
                  transition: 'transform 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────────────── */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          overflowY: 'auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          background: 'rgba(255,255,255,0.015)',
        }}>
          {/* User info */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.1))',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: '16px',
            padding: '18px',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>
              Player
            </div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#a78bfa', marginBottom: '4px' }}>
              {user?.username || 'Unknown'}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {user?.email || ''}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <span style={{
                background: 'rgba(167,139,250,0.15)',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '11px',
                color: '#a78bfa',
                fontWeight: 700,
              }}>
                Level {user?.level || 1}
              </span>
              <span style={{
                background: 'rgba(96,165,250,0.15)',
                border: '1px solid rgba(96,165,250,0.3)',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '11px',
                color: '#60a5fa',
                fontWeight: 700,
              }}>
                {user?.plors || 0} Plors
              </span>
            </div>
          </div>

          {/* Current style summary */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Style
            </div>
            {[
              { label: 'Hat', value: avatarData.hat },
              { label: 'Hair', value: avatarData.hair },
              { label: 'Face', value: avatarData.face },
              { label: 'Shirt', value: avatarData.shirtStyle },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
              Recommended Presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(PRESETS).map(([name, preset]) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'
                    e.currentTarget.style.background = 'rgba(167,139,250,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Mini color preview */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[preset.headColor, preset.torsoColor, preset.pantsColor].map((c, i) => (
                      <div key={i} style={{ width: 12, height: 12, borderRadius: '3px', background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{name}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                    {name === 'Classic' && 'Timeless look'}
                    {name === 'Cool'    && 'Street style'}
                    {name === 'Sporty'  && 'Athletic'}
                    {name === 'Fantasy' && 'Magical'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color chips summary */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
              Color Palette
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Head', key: 'headColor' },
                { label: 'Torso', key: 'shirtColor' },
                { label: 'Arms', key: 'leftArmColor' },
                { label: 'Legs', key: 'pantsColor' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '5px', background: avatarData[item.key], border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 4px; }
      `}</style>
    </div>
  )
}
