import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:7909',
  withCredentials: true,
})

export default api