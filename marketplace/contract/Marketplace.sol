pragma solidity ^0.4.11;

contract Marketplace {
  event CreateClassifiedAd(uint indexed id, uint time, uint expires, uint indexed area, uint indexed category, string data);
  event RemoveClassifiedAd(uint indexed id, uint time);
  event ExtraClassifiedAdData(uint indexed id, string contentType, string data);

  uint public numberOfClassifiedAds = 0;
  mapping (uint => address) public ownersOfClassifiedAds;

  function Marketplace() public {
  }

  modifier isOwnerOfClassifiedAd(uint _id) {
    address owner = ownersOfClassifiedAds[_id];
    if (owner == msg.sender) {
      _;
    }
  }

  function createClassifiedAd(uint16 _area, uint16 _category, string _data) public {
    numberOfClassifiedAds += 1;
    uint id = numberOfClassifiedAds;
    ownersOfClassifiedAds[id] = msg.sender;
    CreateClassifiedAd(id, block.timestamp, block.timestamp + 3 days, _area, _category, _data);
  }

  function extraClassifiedAdData(uint _id, string _contentType, string _data) isOwnerOfClassifiedAd(_id) public {
    ExtraClassifiedAdData(_id, _contentType, _data);
  }

  function removeClassifiedAd(uint _id) isOwnerOfClassifiedAd(_id) public {
    ownersOfClassifiedAds[_id] = 0;
    RemoveClassifiedAd(_id, block.timestamp);
  }
}
