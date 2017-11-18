function showError (err) {
  console.error(err);
}

function byId (id) {
  return document.getElementById(id);
}

function isZeroAddress (addr) {
  return addr === "0x0000000000000000000000000000000000000000";
}

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

      handleLoad();
    });
  }
};

function loadEvents () {
  var events = contract.allEvents({fromBlock: 0, toBlock: "latest"});
  events.watch(function (err, res) {
    if (err) { return showError(err); }
    if (res.event === "CreateClassifiedAd") { createEvent(res); }
    if (res.event === "RemoveClassifiedAd") { removeEvent(res); }
  });
}

function createEvent (res) {
  var node = byId("output");

  contract.ownersOfClassifiedAds(res.args.id, function (err, owner) {
    if (err) { return showError(err); }
    if (isZeroAddress(owner)) { return; }

    var area = findArea(res.args.area).ShortDescription;
    var category = findCategory(res.args.category).Description;
    var content = res.args.data;
    var id = res.args.id;

    var tr = document.createElement("tr");
    tr.id = "id-" + id.toNumber();

    node.appendChild(tr);

    function td (text) {
      var td = document.createElement("td");

      if (typeof text === "string") {
        td.textContent = text;
      } else if (text instanceof Element) {
        td.appendChild(text);
      }

      return td;
    }

    var button = document.createElement("button");
    button.textContent = "Remove";

    button.onclick = function () {
      contract.removeClassifiedAd(id, {from: account}, function (err) {
        if (err) { return showError(err); }
      });
    };

    tr.appendChild(td(id.toNumber()));
    tr.appendChild(td(area));
    tr.appendChild(td(category));
    tr.appendChild(td(content));

    if (owner === account) {
      tr.appendChild(td(button));
    }
  });
}

function removeEvent (res) {
  var id = res.args.id;
  var node = byId("id-" + id.toNumber());
  console.log("remove");
  if (node) {
    node.parentNode.removeChild(node);
  }
}

function findArea (areaId) {
  console.log(areaId, areaId.toNumber());
  return AREAS.find(function (area) {
    return area.AreaID === areaId.toNumber();
  });
}

function findCategory (categoryId) {
  return CATEGORIES.find(function (cat) {
    return cat.CategoryID === categoryId.toNumber();
  });
}

function fillSelect (id, arr, fn) {
  arr.forEach(function (value) {
    var option = document.createElement("option");
    fn(option, value);
    byId(id).appendChild(option);
  });
}

function fillAreas () {
  fillSelect("area", AREAS, function (option, area) {
    option.value = area.AreaID;
    option.textContent = area.ShortDescription;
  });
}

function fillCategories () {
  fillSelect("category", CATEGORIES, function (option, cat) {
    option.value = cat.CategoryID;
    option.textContent = cat.Description;
  });
}

function contentToHash (content, cb) {
  return cb(null, content);
}

function handleLoad () {
  var button = byId("create");

  button.onclick = function (e) {
    e.preventDefault();

    var content = byId("content").value;
    var area = byId("area").value;
    var category = byId("category").value;

    contentToHash(content, function (err, hash) {
      if (err) { return showError(err); }
      contract.createClassifiedAd(area, category, hash, {from: account}, function (err) {
        if (err) { return showError(err); }
        console.log("done.");
      });
    });
  };

  loadEvents();
  fillAreas();
  fillCategories();
}
