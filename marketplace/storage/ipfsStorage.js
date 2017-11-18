

// Config
var ipfsHost    = 'localhost',
ipfsAPIPort = '5001',
ipfsWebPort = '8080',
web3Host    = 'localhost',
web3Port    = '8545';

// ze buffer
var Buffer = window.buffer.Buffer;

window.makeStorage = function (web3) {
    return {retrieve: getData, store: storeData}
}

// IPFS
var ipfs = window.IpfsApi(ipfsHost, ipfsAPIPort)
ipfs.swarm.peers(function(err, response) {
    if (err) {
        console.error(err);
    } else {
        console.log("IPFS - connected to " + response.Peers.length + " peers");
    }
});

// Globals!
window.ipfs = ipfs;
window.ipfsDataHost = "http://" + ipfsHost + ':' + ipfsWebPort + "/ipfs";

function storeData(data, callback) {
    window.ipfs.add([Buffer.from(data)], function(err, result) {
        if (err) {
            console.error('Error sending buffer: ', err);
            callback(null);
        } else if (result && result[0] && result[0].Hash) {
            callback(window.ipfsDataHost + "/" + result[0].Hash);
        } else {
            console.error('No soup for you...');
            callback(null);
        }
    });
}

function getData(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);
}