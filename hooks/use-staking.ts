import { useCallback } from 'react';
import { ethers } from 'ethers';

const useStaking = () => {
    const stake = useCallback(async (amount) => {
        const signer = ... // Get the signer
        const contract = ... // Get the staking contract

        const infiniteApprove = ethers.constants.MaxUint256;

        try {
            const allowance = await contract.allowance(signer.getAddress(), contractAddress);
            if (allowance.lt(infiniteApprove)) {
                const approveTx = await contract.approve(contractAddress, infiniteApprove);
                await approveTx.wait();
                console.log('Infinite approve successful');
            }
            console.log(`Allowances checked: ${allowance.toString()}`);

            const response = await contract.stake(amount);
            console.log(`Stake successful: ${response.transactionHash}`);
        } catch (error) {
            console.error('Stake failed:', error);
        }
    }, []);

    const claim = useCallback(async () => {
        const signer = ... // Get the signer
        const contract = ... // Get the staking contract

        try {
            const response = await contract.claim();
            console.log(`Claim successful: ${response.transactionHash}`);
        } catch (error) {
            console.error('Claim failed:', error);
        }
    }, []);

    const showPreSignMessage = (amount, type) => {
        const message = `You are about to ${type} ${amount}`;
        if (window.ethereum && window.ethereum.request) {
            window.ethereum.request({
                method: 'personal_sign',
                params: [message, signer.getAddress()],
            }).then((result) => {
                console.log('SignMessage result:', result);
            }).catch((error) => {
                console.error('SignMessage failed:', error);
            });
        } else {
            console.log(message); // Fallback
        }
    };

    return { stake, claim, showPreSignMessage };
};

export default useStaking;