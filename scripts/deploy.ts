import {ethers} from 'hardhat';

const main = async () => {
    const [
        address1,
        address2,
        address3,
        address4,
        address5,
        address6,
        address7,
        address8,
        address9,
        address10,
        address11,
        address12,
        address13,
        address14,
        address15,
        address16,
        address17,
        address18,
        address19,
        address20,
    ] = await ethers.getSigners();

    const multiSigFactory = await ethers.getContractFactory("Multisig");
    console.log("Deploying Multisig Contract...");  
    const multiSig = await multiSigFactory.deploy(
        [address1.address, address2.address, address3.address, address4.address, address5.address, address6.address, address7.address, address8.address, address9.address, address10.address, address11.address, address12.address, address13.address, address14.address, address15.address, address16.address, address17.address, address18.address, address19.address, address20.address] // owners
    );

    console.log("Multisig Contract deployed to:", multiSig.target );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});