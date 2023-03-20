import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket is already running'); // eslint-disable-line no-console
    } else {
        console.log('Socket is initializing'); // eslint-disable-line no-console
        const io = new Server(res.socket.server);

        res.socket.server.io = io;
    }
    res.end();
};

export default SocketHandler;
