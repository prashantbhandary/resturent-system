export default function MenuItemCard({ item, onAdd }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="aspect-square bg-slate-100 flex items-center justify-center text-5xl">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span>🍽️</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-bold text-brand-600">₹{item.price}</span>
          <button onClick={onAdd} className="btn-primary py-1 px-3 text-sm">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
