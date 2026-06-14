import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'

export const app = express()
export const httpServer = createServer(app)
export const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173','https://routeflow-nu.vercel.app'],
    credentials: true
  }
})