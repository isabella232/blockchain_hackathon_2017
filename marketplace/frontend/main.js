// Globals
var ipfsHost    = "localhost";
var ipfsAPIPort = "5001";
var ipfsWebPort = "8080";
var IMAGES = [];

// Helpers
function byId (id) {
  return document.getElementById(id);
}

function isZeroAddress (addr) {
  return addr === "0x0000000000000000000000000000000000000000";
}

function formatDate (date) {
  var d = date.getDate();
  var m = date.getMonth() + 1;
  var y = date.getFullYear();
  var h = date.getHours();
  var i = date.getMinutes();

  function pad (n) {
    return n < 10 ? "0" + n : n;
  }

  return "" + y + "-" + pad(m) + "-" + pad(d) + " " + pad(h) + ":" + pad(i);
}

function waitOnTX (txHash, cb) {
  var latestFilter = web3.eth.filter("latest");

  function done (err) {
    latestFilter.stopWatching(function () {
      cb(err);
    });
  }

  latestFilter.watch(function (err, blockHash) {
    if (err) { return done(err); }
    web3.eth.getBlock(blockHash, true, function (err, block) {
      if (err) { return done(err); }
      block.transactions.forEach(function (tx) {
        if (txHash === tx.hash) { done(null); }
      });
    });
  });
}

function findArea (areaId) {
  return AREAS.find(function (area) {
    return area.AreaID === areaId;
  });
}

function findCategory (categoryId) {
  return CATEGORIES.find(function (cat) {
    return cat.CategoryID === categoryId;
  });
}

// Page Load
window.onload = function () {
  if (typeof web3 !== "undefined") {
    web3 = new Web3(web3.currentProvider); // eslint-disable-line
  } else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // eslint-disable-line
  }

  if (web3.isConnected()) {
    web3.eth.getAccounts(function (err, accounts) {
      if (err) { return showError(err); }

      window.contract = web3.eth.contract(ABI).at(ADDRESS);
      window.account = accounts[0];
      window.storage = makeStorage(ipfsHost, ipfsAPIPort, ipfsWebPort);

      startup();
    });
  }
};

function startup () {
  wireCreateAdForm();
  loadEvents();
}

// Modals
function blockScreen (cb) {
  var node = byId("block");
  node.style.display = "block";

  function done () {
    node.style.display = "none";
  }

  cb(byId("block-content"), done);
}

function showError (err) {
  var node = byId("error");
  var content = byId("error-content");
  var msg = err instanceof Error ? err.message : err;
  content.textContent = msg;

  node.style.display = "block";

  function done () {
    node.style.display = "none";
  }

  setTimeout(done, 3000);
}

// Events
function loadEvents () {
  var events = contract.allEvents({fromBlock: 0, toBlock: "latest"});
  events.watch(function (err, res) {
    if (err) { return showError(err); }
    if (res.event === "CreateClassifiedAd") { return createEvent(res); }
    if (res.event === "RemoveClassifiedAd") { return removeEvent(res); }
    if (res.event === "ExtraClassifiedAdData") { return extraDataEvent(res); }
  });
}

function createEvent (res) {
  var node = byId("ads");

  contract.ownersOfClassifiedAds(res.args.id, function (err, owner) {
    if (err) { return showError(err); }
    if (isZeroAddress(owner)) { return; }

    var area = findArea(res.args.area.toNumber()).ShortDescription;
    var category = findCategory(res.args.category.toNumber()).Description;
    var data = res.args.data;
    var id = res.args.id;
    var time = res.args.time;
    var date = new Date(time.toNumber() * 1000);

    var div = document.createElement("div");
    div.className = "ad";
    div.id = "id-" + id.toNumber();
    var h4 = document.createElement("h4");
    h4.className = "ad-title";
    var pre = document.createElement("pre");
    pre.className = "ad-data";
    var imgs = document.createElement("div");
    imgs.className = "ad-imgs";
    imgs.id = "imgs-" + id.toNumber();
    var addr = document.createElement("div");
    addr.className = "ad-addr";
    var buttons = document.createElement("div");
    buttons.className = "ad-buttons";

    node.insertBefore(div, node.firstChild);
    div.appendChild(h4);
    div.appendChild(pre);
    div.appendChild(imgs);
    div.appendChild(addr);
    div.appendChild(buttons);

    h4.textContent = [area, category, formatDate(date)].join(" - ");

    pre.textContent = "Loading ...";
    storage.get(data, function (err, content) {
      if (err) {
        pre.textContent = data;
      } else {
        pre.textContent = content;
      }
    });

    addr.textContent = owner;

    IMAGES.forEach(function (obj) {
      if (obj.id.equals(id)) { maybeAddImage(obj); }
    });

    if (owner === account) {
      var remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.onclick = function (e) { handleRemove(e, id); };
      buttons.appendChild(remove);

      var extra = document.createElement("input");
      extra.type = "file";
      extra.onchange = function (e) { handleExtraData(e, id); };
      buttons.appendChild(extra);
    }
  });
}

function removeEvent (res) {
  var id = res.args.id;
  var node = byId("id-" + id.toNumber());
  if (node) {
    node.parentNode.removeChild(node);
  }
}

function extraDataEvent (res) {
  var id = res.args.id;
  var hash = res.args.data;
  var type = res.args.contentType;

  storage.get(hash, function (err, buf) {
    if (err) { return showError(err); }
    contract.ownersOfClassifiedAds(res.args.id, function (err, owner) {
      if (err) { return showError(err); }
      if (isZeroAddress(owner)) { return; }
      var data = btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
      var img = document.createElement("img");
      img.className = "ad-img";
      img.src = "data:" + type + ";base64," + data;
      var obj = {id: id, img: img};
      IMAGES.push(obj);
      maybeAddImage(obj);
    });
  }, true);
}

// Misc
function maybeAddImage (obj) {
  var node = byId("imgs-" + obj.id.toNumber());
  if (node) {
    node.appendChild(obj.img);
  }
}

function wireCreateAdForm () {
  function fillSelect (id, arr, fn) {
    arr.forEach(function (value) {
      var option = document.createElement("option");
      fn(option, value);
      byId(id).appendChild(option);
    });
  }

  fillSelect("area", AREAS, function (option, area) {
    option.value = area.AreaID;
    option.textContent = area.ShortDescription;
  });

  fillSelect("category", CATEGORIES, function (option, cat) {
    option.value = cat.CategoryID;
    option.textContent = cat.Description;
  });

  byId("commit").onclick = function (e) {
    handleCreateAd(e);
  };
}


// Buttons
function handleRemove (e, id) {
  e.preventDefault();
  blockScreen(function (blockContent, done) {
    blockContent.textContent = "Waiting for transaction to be mined ...";
    contract.removeClassifiedAd(id, {from: account}, function (err, txHash) {
      if (err) { showError(err); return done(); }
      waitOnTX(txHash, function (err) {
        if (err) { showError(err); return done(); }
        done();
      });
    });
  });
}

function handleExtraData (e, id) {
  e.preventDefault();
  var extra = e.target;
  var file = extra.files[0];
  var fr = new FileReader();
  extra.value = "";

  fr.onload = function () {
    var buff = fr.result;
    var type = file.type;
    blockScreen(function (blockContent, done) {
      blockContent.textContent = "Waiting for transaction to be mined ...";
      storage.put(buff, function (err, hash) {
        if (err) { showError(err); return done(); }
        contract.extraClassifiedAdData(id, type, hash, {from: account}, function (err, txHash) {
          if (err) { showError(err); return done(); }
          waitOnTX(txHash, function (err) {
            if (err) { showError(err); return done(); }
            done();
          });
        });
      });
    });
  };

  fr.readAsArrayBuffer(file);
}


function handleCreateAd (e) {
  e.preventDefault();

  var content = byId("content").value;
  var area = byId("area").value;
  var category = byId("category").value;

  blockScreen(function (blockContent, done) {
    blockContent.textContent = "Uploading to IPFS ...";
    storage.put(content, function (err, hash) {
      if (err) { showError(err); return done(); }
      contract.createClassifiedAd(area, category, hash, {from: account}, function (err, txHash) {
        if (err) { showError(err); return done(); }
        blockContent.textContent = "Waiting on transaction to be mined ...";
        waitOnTX(txHash, function (err) {
          if (err) { showError(err); return done(); }
          done();
        });
      });
    });
  });
}
