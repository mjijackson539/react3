const API_URL = 'http://localhost:3001/api';
export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка запроса к API');
  return data;
}
export const getServices = () => request('/services');
export const getCategories = () => request('/categories');
export const login = (email, password) => request('/login', {method:'POST',body:JSON.stringify({email,password})});
export const adminRequest = (path, method='GET', body) => request(`/admin${path}`, {method,headers:{Authorization:`Bearer ${sessionStorage.getItem('token')||''}`},...(body ? {body:JSON.stringify(body)} : {})});

export const getMyCoupons = () =>
  request('/my-coupons', {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
    }
  });
