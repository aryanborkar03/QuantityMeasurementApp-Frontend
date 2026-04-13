export default function Toast({ msg, type }) {
  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800';
  
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 transition-all`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span className="font-medium text-sm">{msg}</span>
    </div>
  );
}