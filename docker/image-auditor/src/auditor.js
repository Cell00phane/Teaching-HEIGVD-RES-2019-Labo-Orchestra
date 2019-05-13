/**
 * We use a standard module to work with date formatting
 */
const moment = require('moment');

/*
 * We use a standard Node.js module to work with UDP
 */
const dgram = require('dgram');

/*
 * We use a standard Node.js module to work with TCP
 */
const net = require('net');

/*
 * We have defined the multicast address and port in a file.
 */
const protocol = require('./auditor-protocol');

/**
 * Same map as used in musicians, but here the keys and values are vice-versa.
 * We get the instruments corresponding to the sound.
 */
const instruments = new Map();
instruments.set('ti-ta-ti', 'piano');
instruments.set('pouet', 'trumpet');
instruments.set('trulu', 'flute');
instruments.set('gzi-gzi', 'violin');
instruments.set('boum-boum', 'drum');

/**
 * Map mapping active musicians to their instruments
 */
const active = new Map();

/**
 * Map mapping musicians to their last active time
 */
const lastActive = new Map();

/*
 * Let's create a datagram socket. We will use it to listen for datagrams published in the
 * multicast group by thermometers and containing measures
 */
const s = dgram.createSocket('udp4');
s.bind(protocol.PROTOCOL_PORT, () => {
  console.log('Joining multicast group');
  s.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
});

/*
 * This call back is invoked when a new datagram has arrived.
 */
s.on('message', (msg, source) => {
  // console.log(`Data has arrived: ${msg}. Source port: ${source.port}`);
  const json = JSON.parse(msg);
  active.set(json.uuid, instruments.get(json.sound));
  lastActive.set(json.uuid, moment().format());
});

function update() {
  lastActive.forEach((value, key) => {
    if (moment().diff(value, 'seconds') > 5) {
      lastActive.delete(key);
      active.delete(key);
    }
  });
}
setInterval(update, 2500);

function onClientConnected(conn) {
  // const remoteAddress = `${conn.remoteAddress}:${conn.remotePort}`;
  // console.log('new client connection from %s', remoteAddress);

  conn.setEncoding('utf8');

  function preparePackage() {
    /* lastActive.forEach((value, key) => {
      if (moment().diff(value, 'seconds') > 5) {
        lastActive.delete(key);
        active.delete(key);
      }
    }); */

    const activeJSONArray = [];
    active.forEach((value, key) => {
      const activeJSON = {
        uuid: key,
        instrument: value,
        activeSince: lastActive.get(key),
      };
      activeJSONArray.push(activeJSON);
    });
    return JSON.stringify(activeJSONArray);
  }
  conn.write(preparePackage());
  conn.end();
}

const server = net.createServer();
server.on('connection', onClientConnected);

server.listen(protocol.PROTOCOL_TCP_PORT, () => {
  // console.log('server listening to %j', server.address());
});


/* function handleConnection(conn) {
  const remoteAddress = `${conn.remoteAddress}:${conn.remotePort}`;
  console.log('new client connection from %s', remoteAddress);

  conn.setEncoding('utf8');

  function preparePackage() {
    const activeJSONArray = [];
    active.forEach((value, key) => {
      const activeJSON = {
        uuid: key,
        instrument: value,
        activeSince: lastActive.get(key),
      };
      activeJSONArray.push(activeJSON);
    });
    //console.log(JSON.stringify(activeJSONArray));
    return activeJSONArray;
  }

  function onConnData(d) {
    console.log('connection data from %s: %j', remoteAddress, d);

    conn.write(preparePackage());
  }

  function onConnClose() {
    console.log('connection from %s closed', remoteAddress);
  }

  function onConnError(err) {
    console.log('Connection %s error: %s', remoteAddress, err.message);
  }

  conn.on('data', onConnData);
  conn.once('close', onConnClose);
  conn.on('error', onConnError);
} */