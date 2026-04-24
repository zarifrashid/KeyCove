import BoardItemCard from './BoardItemCard'

export default function BoardItemsTab({ items, onVote, onComment, onRemove, busy }) {
  return (
    <div className="shared-board-item-list">
      {items.map((item) => (
        <BoardItemCard key={item._id} item={item} onVote={onVote} onComment={onComment} onRemove={onRemove} busy={busy} />
      ))}
      {!items.length ? (
        <section className="card shared-board-tab-card">
          <h2>No properties saved yet</h2>
          <p>Add a property from the Property Details page using the Shared Search button beside Open in Map.</p>
        </section>
      ) : null}
    </div>
  )
}
