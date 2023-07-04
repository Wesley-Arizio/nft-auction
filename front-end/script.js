const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
const nftABI = [
    "constructor(string tokenName, string symbol)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function approve(address to, uint256 tokenId) @8500000",
    "function balanceOf(address owner) view returns (uint256) @8500000",
    "function baseURI() view returns (string) @8500000",
    "function getApproved(uint256 tokenId) view returns (address) @8500000",
    "function isApprovedForAll(address owner, address operator) view returns (bool) @8500000",
    "function mintToken(address owner, string metadataURI) returns (uint256) @8500000",
    "function name() view returns (string) @8500000",
    "function ownerOf(uint256 tokenId) view returns (address) @8500000",
    "function safeTransferFrom(address from, address to, uint256 tokenId) @8500000",
    "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) @8500000",
    "function setApprovalForAll(address operator, bool approved) @8500000",
    "function supportsInterface(bytes4 interfaceId) view returns (bool) @8500000",
    "function symbol() view returns (string) @8500000",
    "function tokenByIndex(uint256 index) view returns (uint256) @8500000",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256) @8500000",
    "function tokenURI(uint256 tokenId) view returns (string) @8500000",
    "function totalSupply() view returns (uint256) @8500000",
    "function transferFrom(address from, address to, uint256 tokenId) @8500000"
];
const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let nftContract = null;
const auctionABI = [
    "event Bid(address indexed bidder, uint256 indexed listingId, uint256 amount, uint256 timestamp)",
    "event List(address indexed lister, address indexed nft, uint256 indexed nftId, uint256 listingId, uint256 minPrice, uint256 endTime, uint256 timestamp)",
    "function bid(uint256 listingId) payable @8500000",
    "function end(uint256 listingId) @8500000",
    "function getListing(uint256 listingId) view returns (address, uint256, uint256, uint256, uint256) @8500000",
    "function list(address nft, uint256 nftId, uint256 minPrice, uint256 numHours) @8500000",
    "function onERC721Received(address operator, address from, uint256 tokenId, bytes data) returns (bytes4) @8500000",
    "function withdrawFunds() @8500000"
];
let auctionAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
let auctionContract = null;

const getAccess = async () => {
    if (nftContract) return;

    // Metamask request access to the ethereum accounts
    await provider.send("eth_requestAccounts", []);

    // Metamask allows signing transactions, charging ethers to perform operations
    signer = provider.getSigner();

    nftContract = new ethers.Contract(nftAddress, nftABI, signer);
    auctionContract = new ethers.Contract(auctionAddress, auctionABI, signer);
}

const list = async () => {
    await getAccess();
    const id = document.getElementById("token-id").value;
    const minPrice = document.getElementById("min-price-list").value;
    const duration = document.getElementById("list-duration").value;

    await auctionContract
        .list(nftAddress, id, minPrice, duration)
        .then(() => alert("success"))
        .catch((err) => {
            if (err?.data) alert(err.data.message);
            else alert(err);
        });
}

const end = async () => {
    try {
        await getAccess();
        const id = document.getElementById("listing-id-end").value;
        await auctionContract.end(id);
        alert("success");
    } catch (e) {
        if (e?.data) alert(e.data.message);
        else alert(e);
    }
}

const bid = async () => {
    try {
        await getAccess();
        const id = document.getElementById("listing-id-bid").value;
        const value = document.getElementById("amount").value;
        await auctionContract.bid(id, { value });
        alert("success")
    } catch (e) {
        if (e?.data) alert(e.data.message);
        else alert(e);
    }
}

const approve = async () => {
    try {
        await getAccess();
        const id = document.getElementById("token-id-approve").value;
        await nftContract.approve(auctionAddress, id);
        alert("success")
    } catch (e) {
        if (e?.data) alert(e.data.message);
        else alert(e);
    }
}

const withdrawFunds = async () => {
    try {
        await getAccess();
        await auctionContract.withdrawFunds();
        alert("success")
    } catch (e) {
        if (e?.data) alert(e.data.message);
        else alert(e);
    }
}

const view = async () => {
    try {
        await getAccess();
        const id = document.getElementById("listing-id-view").value;
        const result = await auctionContract.getListing(id);
        if (!result) return;

        document.getElementById("contract-address").innerHTML = result[0];
        document.getElementById("nft-id").innerHTML = result[1];
        document.getElementById("current-bid").innerHTML = result[2];
        document.getElementById("min-price-view").innerHTML = result[3];
        document.getElementById("end-time-view").innerHTML = new Date(result[4].toNumber() * 1000);
    } catch (e) {
        if (e.data) {
            alert(e.data.message)
        } else {
            alert(e);
        }
    }
}
