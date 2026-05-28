import { io } from 'socket.io-client';

const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
