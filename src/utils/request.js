import axios from "axios";
// 创建 axios 实例
const requests = axios.create({
  baseURL: "http://cloud.miaokeli.vip:8081", // 基础url,如果是多环境配置这样写，也可以像下面一行的写死。 // baseURL: 'http://168.192.0.123',
  timeout: 6000, // 请求超时时间
});

// 错误处理函数
const err = (error) => {
  return Promise.reject(error);
};

// request interceptor(请求拦截器)
requests.interceptors.request.use((config) => {
  return config;
}, err);

// response interceptor（接收拦截器）
requests.interceptors.response.use((response) => {
  return response.data;
}, err);

export default requests;

export function upload(file, strategy_id) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("strategy_id", strategy_id);

  return axios.post("http://cloud.miaokeli.vip:5080/api/v1/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer 1|D3raRHcGdL5jQ2NmSTakARv6UkAD3sIvW3GQkBOB",
      Accept: "application/json",
    },
  });
}
