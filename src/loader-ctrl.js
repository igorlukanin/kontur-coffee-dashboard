const childProcess = require('child_process');
const config = require('config');

const restartInterval = config.get('loader.restart_interval_ms');


process.on('uncaughtException', err => console.error(err.stack));


var children = [];

var restartChild = () => {
    // Start new child
    children.push(childProcess.fork(__dirname + '/loader'));

    console.log('loader-ctrl: child spawned, now ' + children.length + ' child(ren)');

    // Stop old child
    if (children.length > 1) {
        children.shift().kill();

        console.log('loader-ctrl: child stopped, now ' + children.length + ' child');
    }
};

restartChild();
setInterval(restartChild, restartInterval);