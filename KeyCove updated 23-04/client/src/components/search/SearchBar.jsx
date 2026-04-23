import { useEffect, useState } from 'react'

export default function SearchBar({ initialValue = '', onSearch, compact = false }) {
  const [input, setInput] = useState(initialValue)

  useEffect(() => {
    setInput(initialValue)
  }, [initialValue])

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch(input.trim())
  }

  return (
    <form className={`search-bar ${compact ? 'compact' : ''}`} onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Panel / area / title / amenity"
        aria-label="Search by area or keyword"
      />
      <button type="submit" className="primary-btn">Go</button>
    </form>
  )
}
