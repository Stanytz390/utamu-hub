import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FilterOptions = {
  category?: 'all' | 'utamu' | 'dadaz' | 'groups';
  sort: 'newest' | 'oldest' | 'popular';
  search: string;
  status?: 'all' | 'free' | 'paid';
};

export function useVideos(filters: FilterOptions) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('videos').select('*');

    if (filters.search.trim()) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.status === 'free') {
      query = query.eq('price_sq', 0);
    } else if (filters.status === 'paid') {
      query = query.gt('price_sq', 0);
    }

    if (filters.sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (filters.sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (filters.sort === 'popular') {
      query = query.order('views', { ascending: false });
    }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await query;
      if (!error) setVideos(data || []);
      setLoading(false);
    };
    fetch();
  }, [filters]);

  return { videos, loading };
}