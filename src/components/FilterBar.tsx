import { useState } from 'react';

export type FilterState = {
  category: string;
  sort: string;
  search: string;
  status: string;
};

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

export function FilterBar({ onFilterChange, initialFilters }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: initialFilters?.category || 'all',
    sort: initialFilters?.sort || 'newest',
    search: initialFilters?.search || '',
    status: initialFilters?.status || 'all',
  });

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl shadow-sm border">
      <input
        type="text"
        placeholder="Search videos..."
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
        className="flex-1 min-w-[200px] border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <select
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="all">All Categories</option>
        <option value="utamu">Utamu</option>
        <option value="dadaz">Dadaz</option>
        <option value="groups">Groups</option>
      </select>
      <select
        value={filters.sort}
        onChange={(e) => handleChange('sort', e.target.value)}
        className="border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="popular">Most Viewed</option>
      </select>
      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="all">All</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </select>
    </div>
  );
}