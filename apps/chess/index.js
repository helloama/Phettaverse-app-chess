import React, { useMemo, useEffect, useState } from 'react'
import { useWorld, useSyncState, DEG2RAD } from 'hyperfy'
import { Chess } from 'chess.js'

export default function App() {
  const world = useWorld()
  const [pgn, dispatch] = useSyncState(state => state.pgn)
  const chess = useMemo(() => {
    const value = new Chess()
    if (pgn) value.load_pgn(pgn)
    return value
  }, [])
  const [active, setActive] = useState(null)
  const [moves, setMoves] = useState([])

  useEffect(() => {
    return world.onAction((name, props) => {
      if (name === 'move') {
        const { from, to, pgn } = props
        chess.move({ from, to })
        setActive(null)
        setMoves([])
      }
      if (name === 'reset') {
        chess.reset()
        setActive(null)
        setMoves([])
      }
    })
  }, [])

  function showMoves(item) {
    const moves = chess.moves({ square: item.square, verbose: true })
    setMoves(moves.map(move => move.to))
    setActive(item.square)
  }

  function move(from, to) {
    chess.move({ from, to })
    const pgn = chess.pgn()
    chess.undo()
    dispatch('move', { from, to, pgn })
  }

  // console.log('board', chess.board())
  // console.log('active', active)
  // console.log('moves', moves)

  const items = []
  chess.board().forEach(row => {
    row.forEach(item => {
      if (item) {
        items.push(item)
      }
    })
  })

  // console.log(items)

  let text
  if (chess.in_checkmate()) {
    const side = chess.turn() === 'b' ? 'Black' : 'White'
    text = `Checkmate. ${side} loses!`
  } else {
    text = chess.turn() === 'b' ? 'Blacks move!' : 'Whites move!'
  }

  return (
    <app>
      <text
        value={text}
        fontSize={0.3}
        position={[-5, 2.1, 0]}
        rotation={[0, 90 * DEG2RAD, 0, 'YXZ']}
        color="white"
      />
      <text
        value="Restart Game"
        position={[-5, 1.5, 0]}
        rotation={[0, 90 * DEG2RAD, 0, 'YXZ']}
        onClick={() => dispatch('reset')}
        color="white"
      />
      <rigidbody>
        <model src="board.glb" collision="trimesh" />
      </rigidbody>
      {items.map(item => (
        <Piece
          key={item.square}
          square={item.square}
          type={item.type}
          color={item.color}
          onClick={() => showMoves(item)}
        />
      ))}
      {moves.map(square => (
        <box
          key={square}
          size={[0.8, 0.4, 0.8]}
          color="#13c649"
          opacity={0.4}
          position={positions[square]}
          onClick={() => move(active, square)}
        />
      ))}
    </app>
  )
}

const initialState = {
  pgn: null,
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      move(state, { from, to, pgn }) {
        state.pgn = pgn
      },
      reset(state) {
        state.pgn = null
      },
    },
  }
}

const models = {
  w: {
    r: 'w-rook.glb',
    n: 'w-knight.glb',
    b: 'w-bishop.glb',
    q: 'w-queen.glb',
    k: 'w-king.glb',
    p: 'w-pawn.glb',
  },
  b: {
    r: 'b-rook.glb',
    n: 'b-knight.glb',
    b: 'b-bishop.glb',
    q: 'b-queen.glb',
    k: 'b-king.glb',
    p: 'b-pawn.glb',
  },
}

const positions = {
  /* a8: [x,y,z] */
}
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const a8 = [-3.3261, 0.208, -3.3261] // matches blender board coordinates
const gap = 0.952
for (let i = 0; i < 8; i++) {
  const letter = letters[i]
  for (let y = 0; y < 8; y++) {
    const number = 8 - y
    const square = `${letter}${number}`
    positions[square] = [a8[0] + i * gap, a8[1], a8[2] + y * gap]
  }
}

function Piece({ color, type, square, onClick }) {
  const src = models[color][type]
  return <model src={src} position={positions[square]} onClick={onClick} />
}
