import { useState } from 'react'

export default function SearchBar({ initialValue = '', onSearch, onUseCurrentLocation, onReset }) {
  const [input, setInput] = useState(initialValue)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch(input)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Search Dhaka area like Gulshan, Dhanmondi, Uttara"
      />
      <button type="submit" className="primary-btn">Search Location</button>
      <button type="button" className="secondary-btn" onClick={() => onUseCurrentLocation()}>
        Use Current Location
      </button>
      <button type="button" className="secondary-btn" onClick={() => { setInput(''); onReset() }}>
        Reset Map
      </button>
    </form>
  )
}
