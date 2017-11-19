window.makeStorage = function (ipfsHost, ipfsAPIPort, ipfsWebPort) {
  var Buffer = IpfsApi().Buffer;
  var ipfs = IpfsApi(ipfsHost, ipfsAPIPort);

  function toBuffer (ab) {
    var buf = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);

    for (var i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
    }

    return buf;
  }

  ipfs.swarm.peers(function (err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log("IPFS - connected to " + response.Peers.length + " peers");
    }
  });

  var ipfsDataHost = "http://" + ipfsHost + ":" + ipfsWebPort + "/ipfs";

  function storeData (buf, callback) {
    var data = typeof buf === "string" ? Buffer.from(buf) : toBuffer(buf);
    ipfs.add([data], function (err, result) {
      if (err) {
        console.error("Error sending buffer: ", err);
        callback(err);
      } else if (result && result[0] && result[0].Hash) {
        callback(null, result[0].Hash);
      } else {
        callback(new Error("ipfs error"));
      }
    });
  }

  function getData (hash, callback, binary) {
    var url = ipfsDataHost + "/" + hash;
    var xmlHttp = new XMLHttpRequest();
    if (binary) {
      xmlHttp.responseType = "arraybuffer";
    }

    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        if (binary) {
          return callback(null, xmlHttp.response);
        }

        callback(null, xmlHttp.responseText);
      }
    };

    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
  }

  return {put: storeData, get: getData};
};
