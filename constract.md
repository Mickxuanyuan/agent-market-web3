仓库地址：https://github.com/agent-flow5/agent-flow-contract
一、MockUSDT
合约地址：0xbac7d7AAE206282201E83b31005fF2651565fc2C
需要自己操作的：
1. 给自己mintUSDT：
https://sepolia.etherscan.io/address/0xbac7d7AAE206282201E83b31005fF2651565fc2C#writeContract
2. 在MetaMask添加代币USDT

二、PlatformToken
符号：APT
合约地址：0xdea48b60cc5bCC6170d6CD81964dE443a8015456
etherscan：https://sepolia.etherscan.io/address/0xdea48b60cc5bCC6170d6CD81964dE443a8015456#code
需要自己操作的：
1. 在MetaMask添加代币 APT
2. 在咱们平台通过USDT 去充值 APT
三、PlatformTreasury
合约地址：0x44b5dd766B90156A08e449CD3049B2267A7bDD65
etherscan：https://sepolia.etherscan.io/address/0x44b5dd766B90156A08e449CD3049B2267A7bDD65#code
四、ABI 与 types
clone 代码 编译：
pnpm compile
ABI文件：
artifacts/
└── contracts/
    ├── MockUSDT.sol/
    │   └── MockUSDT.json          ← MockUSDT 的 ABI
    ├── PlatformToken.sol/
    │   └── PlatformToken.json     ← PlatformToken 的 ABI
    └── PlatformTreasury.sol/
        ├── PlatformTreasury.json  ← PlatformTreasury 的 ABI
        └── IPlatformToken.json    ← 接口的 ABI
types：
typechain-types/
├── contracts/
│   ├── MockUSDT.ts
│   ├── PlatformToken.ts
│   └── PlatformTreasury.ts
└── factories/
    └── contracts/
        ├── MockUSDT__factory.ts
        ├── PlatformToken__factory.ts
        └── PlatformTreasury__factory.ts

四、权限
1. TREASURY_ROLE 已自动授予 Treasury 合约
2. 需要使用独立脚本授予 SYSTEM_ROLE 给后端服务
3. 需要使用独立脚本授予 PAUSER_ROLE 给安全团队
后续步骤:
# 授予 SYSTEM_ROLE (后端服务)
npx hardhat run scripts/roles/grant-system-role.ts --network <network> <backend-address>
权限清单：
执行账单结算 (settle 函数)
从付款方（payer）销毁指定数量的 APT 代币
给 agent 铸造相同数量的 APT 代币
标记账单为已结算（防止重复结算）
触发 Settled 事件
实际使用示例
import { ethers } from 'ethers';
import { PlatformTreasury__factory } from './typechain-types';

// 连接到合约
const treasury = PlatformTreasury__factory.connect(
  treasuryAddress,
  backendWallet // 这个钱包需要有 SYSTEM_ROLE
);

// 结算账单
const billId = ethers.keccak256(ethers.toUtf8Bytes('order-12345'));
await treasury.settle(
  billId,
  payerAddress,      // 用户地址
  agentAddress,      // Agent 地址
  ethers.parseUnits('50', 6)  // 50 APT
);

团队钱包测试地址：
姓名	地址
zack	0xD21A83c6a3De65bD3f5af7FEBCFDF70827B9ccF3
	
	
	
	
# 授予 PAUSER_ROLE (安全团队)
npx hardhat run scripts/roles/grant-pauser-role.ts --network <network> <pauser-address>