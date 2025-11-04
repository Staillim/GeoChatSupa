/**
 * Fetcher utility for SWR
 * Handles API requests with proper error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

/**
 * Default fetcher for SWR
 */
export const fetcher = async <T = any>(url: string): Promise<T> => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  const data = await res.json();
  return data;
};

/**
 * POST request helper
 */
export const postData = async <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * PUT request helper
 */
export const putData = async <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * DELETE request helper
 */
export const deleteData = async <T = any>(url: string): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(url, {
      method: 'DELETE',
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
