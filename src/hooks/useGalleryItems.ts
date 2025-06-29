
import { useState, useEffect } from 'react';
import { supabaseCustom } from '@/integrations/supabase/client-custom';
import { GalleryItem as GalleryItemType } from '@/data/gallery';
import { useToast } from '@/hooks/use-toast';

interface UseGalleryItemsProps {
  pageSize?: number;
  initialPage?: number;
}

const useGalleryItems = ({ 
  pageSize = 6, 
  initialPage = 0 
}: UseGalleryItemsProps = {}) => {
  const [items, setItems] = useState<GalleryItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const { toast } = useToast();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  const loadFallbackData = async () => {
    try {
      const { galleryItems } = await import('@/data/gallery');
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = galleryItems.slice(startIndex, endIndex);
      
      setItems(paginatedItems);
      setTotalItems(galleryItems.length);
      setError(null);
      console.log('Loaded fallback gallery data:', paginatedItems.length, 'items');
    } catch (fallbackError) {
      console.error('Failed to load fallback data:', fallbackError);
      setError('Não foi possível carregar as imagens da galeria.');
      setItems([]);
    }
  };

  const fetchItems = async (showToast = false, page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      if (showToast) setRefreshing(true);

      console.log('Attempting to fetch gallery items from Supabase...');

      // Try to get items from Supabase first
      const { data, error, count } = await (supabaseCustom as any)
        .from('gallery_items')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page * pageSize) + pageSize - 1);
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Successfully fetched from Supabase:', data?.length || 0, 'items');
      
      setItems(data || []);
      setTotalItems(count || 0);
      setCurrentPage(page);
      
      if (showToast) {
        toast({
          title: 'Galeria atualizada',
          description: 'As imagens foram carregadas com sucesso.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching gallery items:', error);
      
      // Always fall back to local data on any error
      console.log('Falling back to local gallery data...');
      await loadFallbackData();
      
      // Only show error toast if user explicitly refreshed
      if (showToast) {
        toast({
          title: 'Usando dados locais',
          description: 'Conecte-se para ver a galeria completa.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      if (showToast) setRefreshing(false);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      fetchItems(false, currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      fetchItems(false, currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      fetchItems(false, page);
    }
  };

  const handleImageError = (index: number) => {
    setItems(current => {
      const updated = [...current];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          image: "/placeholder.svg"
        };
      }
      return updated;
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    refreshing,
    fetchItems,
    handleImageError,
    pagination: {
      currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      goToNextPage,
      goToPreviousPage,
      goToPage,
      pageSize,
      totalItems
    }
  };
};

export default useGalleryItems;
