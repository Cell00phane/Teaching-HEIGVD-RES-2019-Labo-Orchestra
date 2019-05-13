/*
 * We use a standard Node.js module to work with UDP
 */
const dgram = require('dgram');

const uuidv1 = require('uuid/v1');

const protocol = require('./musician-protocol');

/*
 * Let's create a datagram socket. We will use it to send our UDP datagrams
 */
const s = dgram.createSocket('udp4');

const instruments = new Map();
instruments.set('piano', 'ti-ta-ti');
instruments.set('trumpet', 'pouet');
instruments.set('flute', 'trulu');
instruments.set('violin', 'gzi-gzi');
instruments.set('drum', 'boum-boum');

/*
 * Musician class
 */
function Musician(instrument) {
  if (!instruments.has(instrument)) {
    throw new Error('No such instrument');
  }
  this.instrument = instrument;
  this.uuid = uuidv1();

  Musician.prototype.update = function update() {
    const packet = {
      uuid: this.uuid,
      sound: instruments.get(instrument),
    };
    const payload = JSON.stringify(packet);

    const message = new Buffer(payload);
    s.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, (_err, _bytes) => {
      console.log(`Sending payload: ${payload} via port ${s.address().port}`);
    });
  };

  setInterval(this.update.bind(this), 1000);
}

const instrument = process.argv[2];

const m = new Musician(instrument);
