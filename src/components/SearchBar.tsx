interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  sticky?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  sticky = false,
}: SearchBarProps) {
  return (
    <div className={`search-bar${sticky ? ' sticky' : ''}`}>
      <span className="search-bar-icon">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
    </div>
  );
}
