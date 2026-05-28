import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, closeSocket } from '../services/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    const onConn = () => setConnected(true);
    const onDisc = () => setConnected(false);
    s.on('connect', onConn);
    s.on('disconnect', onDisc);
    if (s.connected) setConnected(true);
    return () => {
      s.off('connect', onConn);
      s.off('disconnect', onDisc);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
