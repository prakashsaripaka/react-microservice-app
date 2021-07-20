import axios from 'axios';

export const axiosInstance = axios.create({
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  config.headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    rand_key: document.querySelector('body').getAttribute('user_rand'),
    NITRO_WEB_APPLICATION: 'true',

  };

  return config;
}, (error) => {
  console.error('AxiosInstance Error => ', error);
  return Promise.reject(error);
});
