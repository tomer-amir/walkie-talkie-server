'use strict';

// Load the TCP Library
const net = require('net');
const client = require('./client');

const clients = client.clients;

function Response(request, response, data, notification) {
    this.request        = request || '';
    this.response       = response || '';
    this.data           = data || '';
    this.notification   = notification || '';
}

function Tcp(port) {

    // Start a TCP Server
    net.createServer(function (socket) {

        // Identify this client
        socket.name = socket.remoteAddress + ":" + socket.remotePort;

        // Put this new client in the list
        // clients.push(new Client(socket = socket));

        // broadcast(socket.name + " joined the chat\n", socket);

        // Handle incoming messages from clients.
        socket.on('data', function (data) {
            let request;
            try {
                request = JSON.parse(data);
            } catch (err) {
                console.error('could not parse client message:', err);
                socket.write(JSON.stringify(new Response('', 'error', 'Request - \'' + data + '\' is not a valid JSON')));

                return;
            }

            switch (request.request) {
                case 'login':
                    if (!request.uuid) {
                        console.error('missing field - uuid in: ' + data);
                        socket.write(JSON.stringify(new Response('login', 'error', 'missing field \'uuid\' in: ' + data)));
                        return;
                    }

                    if (!request.name) {
                        console.error('missing field - name in: ' + data);
                        socket.write(JSON.stringify(new Response('login', 'error', 'missing field \'name\' in: ' + data)));
                        return;
                    }

                    client.createClient(request.uuid, request.name, 'tcp', socket);

                    // Send a nice welcome message and announce
                    socket.write(JSON.stringify(new Response('login', 'ok', 'Welcome ' + request.name)));
                    break;
                case 'broadcast':
                    broadcast(data, client.getBySocket(socket));
                    break;
                default:
                    break;
            }
        });

        // Remove the client from the list when it leaves
        socket.on('end', function () {
            client.removeClient(socket);
            // broadcast(socket.name + " left the chat.\n");
        });

        // Send a message to all clients
        function broadcast(message, sender) {
            console.log(sender.name + " > " + message);

            clients.forEach(function (curr) {
                // Don't want to send it to sender
                if (curr.compare(sender)) return;
                curr.tcp.write(message);
            });

            // Log it to the server output too
            process.stdout.write(message)
        }

    }).listen(port);

    // Put a friendly message on the terminal of the server.
    console.log(`TCP server listening on port ${port}`);
}

module.exports = Tcp;
