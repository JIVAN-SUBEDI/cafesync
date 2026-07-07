// app/admin/hotels/[id]/useHotelFromUrl.ts
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useHotelFromUrl() {
  const searchParams = useSearchParams();
  
  const hotelData = useMemo(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        return JSON.parse(dataParam);
      } catch (error) {
        console.error('Failed to parse hotel data from URL:', error);
        return null;
      }
    }
    return null;
  }, [searchParams]);
  
  return hotelData;
}