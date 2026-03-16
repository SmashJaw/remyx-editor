import { useState } from 'react'
import { RemyxEditor } from '@remyx/react'
import '@remyx/core/style.css'
import '@remyx/react/style.css'

function App() {
  const [content, setContent] = useState('')

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Remyx Editor</h1>
      <RemyxEditor
        value={content}
        onChange={setContent}
        placeholder="Start typing..."
        height={400}
        theme="light"
      />
    </div>
  )
}

export default App
