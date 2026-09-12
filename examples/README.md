# Examples

Each directory is a complete starter app: its own frontend, contracts and deploy
script. Copy one out and it runs on its own. They share the Foundry libraries in
`../contracts/lib` through relative remappings, so there is a single pin per
dependency.

| Example | What it shows | Status |
|---|---|---|
| [`pingpong`](./pingpong) | Sending ETH and a message to another chain and back | Working |
| [`xchain-eth-multitransfer`](./xchain-eth-multitransfer) | Paying many recipients on another chain in one transaction | Working |
| [`superchainerc20`](./superchainerc20) | A token with an initial supply on one chain | Needs a token bridge |
| [`xchain-flash-loan`](./xchain-flash-loan) | Borrowing on one chain and repaying on another | Needs a token bridge |

The last two depend on the `SuperchainTokenBridge` predeploy, removed in
[optimism#19999](https://github.com/ethereum-optimism/optimism/pull/19999) with no
replacement. `0.1.0-alpha.59` is the last supersim release that deploys it, so they
will not run locally on anything newer. Their READMEs explain what that means and
when they will be revisited.

Run any example the same way as the root template:

```bash
cd examples/<name>
pnpm install
pnpm dev
```
