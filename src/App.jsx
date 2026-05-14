import { useState } from 'react';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';

function App() {
  const [kit, setKit] = useState(null);
  const [adapter, setAdapter] = useState(null);
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const adapterInstance = await createViemAdapterFromProvider({
        provider: window.ethereum,
      });
      const kitInstance = new AppKit();
      setAdapter(adapterInstance);
      setKit(kitInstance);
      setConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBridge = async () => {
    if (!kit || !adapter) return;
    try {
      const result = await kit.bridge({
        from: { adapter, chain: 'Ethereum_Sepolia' },
        to: { adapter, chain: 'Arc_Testnet' },
        amount: '1.00',
      });
      console.log('Bridge result:', result);
      alert('Bridge successful!');
    } catch (error) {
      console.error(error);
      alert('Bridge failed');
    }
  };

  const handleSwap = async () => {
    if (!kit || !adapter) return;
    try {
      const result = await kit.swap({
        from: { adapter, chain: 'Arc_Testnet' },
        tokenIn: 'EURC',
        tokenOut: 'USDC',
        amountIn: '1.00',
        config: {
          kitKey: 'YOUR_KIT_KEY', // Replace with actual kit key
        },
      });
      console.log('Swap result:', result);
      alert('Swap successful!');
    } catch (error) {
      console.error(error);
      alert('Swap failed');
    }
  };

  const handleUnifiedDeposit = async () => {
    if (!kit || !adapter) return;
    try {
      const result = await kit.unifiedBalance.deposit({
        from: { adapter, chain: 'Base_Sepolia' },
        amount: '1.00',
        token: 'USDC',
      });
      console.log('Deposit result:', result);
      alert('Deposit successful!');
    } catch (error) {
      console.error(error);
      alert('Deposit failed');
    }
  };

  const handleUnifiedSpend = async () => {
    if (!kit || !adapter) return;
    try {
      const result = await kit.unifiedBalance.spend({
        amount: '1.00',
        from: { adapter },
        to: {
          adapter,
          chain: 'Arc_Testnet',
          recipientAddress: '0xYourRecipientAddress', // Replace with actual address
        },
      });
      console.log('Spend result:', result);
      alert('Spend successful!');
    } catch (error) {
      console.error(error);
      alert('Spend failed');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>DeFi Aggregator with Arc App Kit</h1>
      {!connected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <h2>Connected</h2>
          <div style={{ marginBottom: '20px' }}>
            <h3>Bridge</h3>
            <p>Bridge 1.00 USDC from Ethereum Sepolia to Arc Testnet</p>
            <button onClick={handleBridge}>Bridge</button>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Swap</h3>
            <p>Swap 1.00 EURC for USDC on Arc Testnet</p>
            <button onClick={handleSwap}>Swap</button>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Unified Balance</h3>
            <p>Deposit 1.00 USDC from Base Sepolia</p>
            <button onClick={handleUnifiedDeposit}>Deposit</button>
            <p>Spend 1.00 USDC to Arc Testnet</p>
            <button onClick={handleUnifiedSpend}>Spend</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;