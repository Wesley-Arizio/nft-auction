const { expect } = require("chai");

const getTime = async () => {
  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  return block.timestamp
}

describe("Auction", () => {
  let auction, minty, owner, addr1, addr2;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Minty = await ethers.getContractFactory("Minty");
    minty = await Minty.deploy("Name", "NAM");

    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy();

    await minty.deployed();
    await auction.deployed();

    await minty.mintToken(owner.address, "uri");
  })

  describe("Listing", () => {
    it("Should revert if not approved to list", async () => {
      await expect(auction.list(minty.address, 1, 10, 1)).to.be.reverted;
    })
    it("Should revert if not owner of the nft", async () => {
      await expect(auction.connect(addr1).list(minty.address, 1, 10, 1)).to.be.reverted;
    })
    it("Should allow listing nft", async () => {
      await minty.approve(auction.address, 1);
      await expect(auction.list(minty.address, 1, 10, 1)).to.emit(
        auction,
        "List"
      )
    })
    it("Should allow listing nft", async () => {
      await minty.mintToken(owner.address, "uri2");
      await minty.approve(auction.address, 2);
      await expect(auction.list(minty.address, 2, 10, 2)).to.emit(
        auction,
        "List"
      )
    })
  });
  describe("Bid", () => {
    it("Should not allow bid below min price", async () => {
      await expect(auction.connect(addr1).bid(0, { value: 9 })).to.be.reverted;
    })
    it("Should not allow bid on auction that does not exist", async () => {
      await expect(auction.connect(addr1).bid(9, { value: 100 })).to.be.reverted;
    })
    it("Should allow valid bid", async () => {
      await expect(auction.connect(addr1).bid(0, { value: 15 })).to.emit(
        auction,
        "Bid"
      );
      const [nftContract, nftId, highestBid1, minPrice] = await auction.getListing(0);
      expect(nftContract).to.equal(minty.address);
      expect(nftId).to.equal(1);
      expect(highestBid1).to.equal(15);
      expect(minPrice).to.equal(10);

      await expect(auction.connect(addr2).bid(0, { value: 17 })).to.emit(
        auction,
        "Bid"
      );
      const [nftContract2, nftId2, highestBid2, minPrice2] = await auction.getListing(0);
      expect(nftContract2).to.equal(minty.address);
      expect(nftId2).to.equal(1);
      expect(highestBid2).to.equal(17);
      expect(minPrice2).to.equal(10);
    })
    it("Should not allow bid below highestBid", async () => {
      await expect(auction.connect(addr2).bid(0, { value: 16 })).to.be.reverted;
    })

    it("Should not allow bid on auction that is completed", async () => {
      // Advance block to be mined in a certain amount of time
      await ethers.provider.send("evm_mine", [(await getTime() + 3600)]);
      await expect(auction.connect(addr1).bid(0, { value: 10000 })).to.be.reverted;
    })
  });
  describe("Withdraw Funds", () => {
    it("Should allow previous bidders withdraw their funds", async () => {
      await expect(
        await auction.connect(addr1).withdrawFunds()
      ).to.changeEtherBalances([addr1, auction], [15, -15]);
    });
    it("Should not allow highest bidder withdraw his funds", async () => {
      await expect(
        await auction.connect(addr2).withdrawFunds()
      ).to.changeEtherBalances([addr2, auction], [0, 0]);
    });
    it("Should not allow owner withdraw his funds until end() is called", async () => {
      await expect(
        await auction.connect(owner).withdrawFunds()
      ).to.changeEtherBalances([owner, auction], [0, 0]);
    });
  });
  describe("End", () => {
    it("Should not allow call end() if auction is not completed", async () => {
      await expect(auction.end(1)).to.be.reverted;
    })
    it("Should transfer nft when call end()", async () => {
      await auction.end(0);
      expect(await minty.ownerOf(1)).to.equal(addr2.address);
    })
    it("Should not be able to call end() twice", async () => {
      await expect(auction.end(0)).to.be.reverted;
    })
    it("Should not allow auction winner withdraw his funds once the auction is done", async () => {
      await expect(
        await auction.connect(addr2).withdrawFunds()
      ).to.changeEtherBalances([addr2, auction], [0,0]);
    })
    it("Should not allow auction owner to withdraw funds once the auctions is done", async () => {
      await expect(
        await auction.connect(owner).withdrawFunds()
      ).to.changeEtherBalances([owner, auction], [17,-17]);
    })
  });
});