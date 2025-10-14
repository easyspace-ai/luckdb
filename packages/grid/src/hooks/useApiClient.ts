import { useMemo } from 'react';
import { ApiClient } from '@/api/client';
import { useSession } from '@/context/session';

export function useApiClient() {
  const { token } = useSession();

  const apiClient = useMemo(() => {
    const baseURL = process.env.REACT_APP_API_URL || '/api';
    const client = new ApiClient({ baseURL });
    
    if (token) {
      client.setToken(token);
    }
    
    return client;
  }, [token]);

  return apiClient;
}


