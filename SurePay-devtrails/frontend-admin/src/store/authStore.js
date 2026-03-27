import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('authToken'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
