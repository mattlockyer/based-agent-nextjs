# Shade Agents

## Shade Agent Template

This is a monorepo template for the Shade Agent Stack with all the code and tools for deploying a Shade Agent on NEAR and Phala Cloud.

The template has 2 main components:

1. Worker Agent - NextJS docker app with API and UI for interactive demo. Fetches data from TEE environment, creates a unique account for the instance of the TEE and interacts with the Smart Contract.
1. Smart Contract - Verifies the Worker Agent's TEE environment and codehash. Provides example methods for Worker Agent access control based on codehash.

## Walkthough for Devs

[![Workshop Video](https://img.youtube.com/vi/MCUWLUZuqJc/0.jpg)](https://youtu.be/MCUWLUZuqJc)

# Shade Agents

Shade Agents are multichain crypto AI agents, verifiable from source code through to their transactions across any blockchain.

Shade Agents can:

-   Verifiably access off-chain LLMs, APIs and data
-   Sign transactions for any chain
-   Custody cryptoassets
-   Preserve privacy

<img width="1400" alt="1 (3)" src="https://github.com/user-attachments/assets/d3f9bb36-2832-4690-aa88-005b4c67a224" />

Components of a Shade Agent are:

1. Worker Agent deployment in a TEE
1. Smart Contract to verify a TEE's remote attestation and stack
1. NEAR Intents and Chain Signatures for multichain swaps and key management

## 1. Worker Agent Deployment in a TEE on Phala Cloud

### Worker Agent

Worker Agents act as a bridge between the LLMs and the Smart Contracts that open them up to any blockchains.

The template includes the following code for the Worker Agent:

1. Account derivation - derives a unique key (a NEAR Account) in the TEE instance. This key is in memory and inside the TEE, unable to be exfiltrated, verifiable by code inspection and the SHA256 hash of the docker image.
1. `register_worker` - a TEE's remote attestation, including the Phala checksum and Docker image codehash are submitted to the Smart Contract from the TEE's derived account and verified by the contract.
1. `get_worker` - a convenience method to return the checksum for the Phala attestation explorer and the codehash of the docker image the Worker Agent is running.
1. `is_verified_by_codehash(codehash)` - an example method which checks a Worker Agent is registered in the contract with the provided codehash matching the argument. **One example of how we can protect smart contract methods by only allowing access to registered Worker Agents with the correct code.**

Subsequent Worker Agent code and calls to the NEAR Contract are left to the developer and their custom smart contract development for their projects using Shade Agents.

### Availability and Key Management

<img width="1400" alt="3 (3)" src="https://github.com/user-attachments/assets/c1655bc5-c8ed-496c-9396-58a009e675f8" />

Worker Agents can go offline. However, anyone with access to the same docker image can boot their own instance inside a TEE and register in the smart contract. This provides the new instance of the Worker Agent with access to the same methods as a previous instance.

Since keys are managed by the Smart Contract and not the agent, as long as a new Worker Agent is verified and can reach the protected part of the code, it can continue to contribute to the protocol.

With a NEAR Smart Contract, we have keys managed by Chain Signatures, NEAR's MPC Key Management service. This service generates signatures, without ever revealing the private key. By using Chain Signatures, even malicious agents cannot exfiltrate the keys associated with the protocol or user's funds.

### What can be include in the Worker Agent? (remember it's verified!):

Worker agents are stateless and ephemeral.

-   Deterministic or stochastic rules
-   Pre/post process LLM prompts/inference for smart contract method calls
-   Arbitrary offchain compute, VMs, LLMs
-   Access APIs and the web

## 2. Smart Contract

The template provides a NEAR Smart Contract for the following:

1. Registration - verify a TEE's remote attestation and store the checksum and codehash.
1. Example Method Access Control - a few helper methods demonstrating protected methods by the registered worker's codehash.

## 3. NEAR Intents and Chain Signatures

[NEAR Intents](https://docs.near.org/chain-abstraction/intents/overview)

In NEAR, an intent is a high level declaration of what a user wants to achieve. Think of it as telling the blockchain "what" you want to do, not "how" to do it.

[NEAR Chain Signatures](https://docs.near.org/concepts/abstraction/chain-signatures)

Chain signatures enable NEAR accounts, including smart contracts, to sign and execute transactions across many blockchain protocols.

This unlocks the next level of blockchain interoperability by giving ownership of diverse assets, cross-chain accounts, and data to every single NEAR account.

# What can be built with Shade Agents?

Pretty much anything...

## A few ideas

1. Mindshare Index Fund - Tracks mindshare metrics like Kaito. Rebalances pool of assets between any chain: BTC, XRP, SOL, ETH, HYPE.
1. Decentralized Solvers - Accepts asset deposits on any chain. Utilizes off-chain data to fulfill user intents. Rebalances across all major DEXs, bridges, etc.
1. Prediction Market for Anything - Market creators define resolution criteria and sources. Worker agents query sources, vote on resolution. Resolves immediately, no need for challenge periods.
1. Lending Optimizers - Accepts asset deposits on any chain. Matches borrow requests instantly, at better rate than any pool-based lender (by using midpoint rate between borrow and lend rates on pool-based protocols). Rebalances between various pool-based products to optimize both borrow and lend rates.
1. Twitter Bet Escrow - User can propose a bet to another user with odds. Worker agents create a market, define resolution criteria. Both users deposit funds into contract, worker agents resolve market.

## How to leverage LLMs

_LLMs running in TEEs with the Shade Agent stack = verifiable inference_

LLMs deployed as docker images can easily be leveraged by other applications deployed in the same docker stack. With Shade Agents, an LLM deployed as a docker image is used by the Worker Agent in the same docker stack on the Trusted Execution Environment (TEE). Shade Agents can use 1 or more LLMs to provide the inference for the Worker Agent.

LLMs could be used to:

-   interpret API calls and provide reasoning and inference that translates these to more specific smart contract method calls
-   digest sentiment from realtime data and provide higher order actions
-   reason about multiple sources and provide summary insights, for example Shade Agent price oracle vs. multi party computation

# How a Shade Agent is Verified?

Shade Agents have a Worker Agent that is running inside a trusted execution environment (TEE) and a NEAR Smart Contract deployed onchain. Here are the following steps that the Worker Agent takes to verify itself onchain, so that subsequent calls from the Worker Agent can be trusted.

<img width="1400" alt="2 (2)" src="https://github.com/user-attachments/assets/02bfcc61-776b-44da-8ce9-37908e7ccc98" />

## 1. Ephemeral key for a NEAR Account

The Worker Agent has an API route (`/pages/api/derive`) that creates a key derived from the TEE's hardware KMS and additional entropy. _If the TEE is rebooted, or redeployed a new account would be created and need to be funded_. Loss of funds from these accounts which are only used to pay gas for transactions can be mitigated by periodically deploying minimal funds or using NEAR's Meta Transactions to fund the smart contract calls.

A new instanct of the Worker Agent deployed with the same code will have access to the same methods in the Smart Contract, this is by design. The worker agent registration (described above) verifies the TEE and the codehash of the Worker Agent.

The Shade Agent stack design pattern protects the Smart Contract methods by registered Worker Agent's with the correct codehash.

## 2. Remote Attestation (RA) quote, quote collateral and docker image hashes

The Worker Agent's register route (`/pages/api/register`) gets the remote attestation quote in hex, gets the necessary quote collateral through a Phala API call that is verified through a PCCS_URL from Intel, and lastly the `docker_compose.yaml` data for the TEE's deployment returned.

All arguments are made to the NEAR Contract's `register_worker` method. The contract checks the quote using Phala's [dcap-qvl](https://github.com/Phala-Network/dcap-qvl) Rust crate and a verified report about the TEE is returned.

Once a Worker Agent is verified, the NEAR Account of the Worker Agent is registered in the contract for future calls.

Also stored for each Worker Agent is:

-   the SHA256 hash of the Worker Agent docker image so that the code running is verifiable
-   the checksum of the RA quote which can be verified on Phala Cloud's [TEE Attesation Explorer](https://proof.t16z.com/)

# Deployment to Phala Cloud

Phala Cloud is a TEE as a service provider to deploy multiple docker images inside a trusted execution environment. This environment exposes their dStack SDK to access the remote attestation of the TEE, derive entropy from a decentralized Key Management Service (KMS). dStack also provides the docker image codehash of the code running in the TEE.

Shade Agents gather the following data from the TEE Deployment on Phala Cloud:

1. Remote attestation quote
1. Unique key derived from entropy and the TEE's KMS
1. docker-compose.yaml data which contains the SHA256 hash of the docker image

## Building and Pushing Docker Image

In order to deploy a Worker Agent you will need to build and push a docker image to Docker Hub.

Create a Docker Hub account and login on the command line with `docker login`.

Check the scripts in `package.json` and update `docker:build` and `docker:push` to reflect your docker hub repository name and account.

You can then use these scripts to build and push a docker image.

## Deployment .yaml for Phala

The `docker-compose.yaml` contains all of the information necessary to deploy a Worker Agent to Phala Cloud.

You will need to update this file to reflect your docker hub account, repository name and the sha256 hash of your docker image (this is visible in the CLI after you push your build to docker hub).

On Phala Cloud, click on `deploy` then select `from docker compose` and click the `advanced` tab. Paste in the `yaml` and give the instance a name. Check resources (defaults `prod5`, `dstack-dev-0.3.5`, and `tdx.small` work) and deploy.

That's it!

Some tips for Phala Cloud:

-   Click on the instance name to view details
-   In details click `network` tab to get the address of the live instance
-   In details click `containers` tab to pull up live logs

# Local Development and Example UI

The Worker Agent template is a NextJS application that offers both an API via the `/pages/api` routes and an optional UI under `/pages`.

The UI found at `index.js` is intended to guide through the first steps of verifying the worker agent running in the TEE against the NEAR Contract. _Note: this is only possible when deployed on Phala Cloud._ In order to pass the verification in the NEAR Contract, the API Layer must be deployed on Phala Cloud and running on TEE hardware to get a valid remote attestation (RA) quote, that can be verified by the NEAR Contract.

However, this does not stop one from developing the Worker Agent. Add API routes, call external APIs, work with data, and prepare the NEAR Contract calls. In fact, skip the verification step in the NEAR Contract, and make calls with the assumption that the Worker Agent will add in the proper logic to "allow list" these calls only by verified shade agents when the NEAR Contract is deployed live.

To develop locally, use:

-   `yarn`
-   `yarn dev`

For making calls to the NEAR Contract, create a local `.env.development.local` file with the following fields:

```bash
NEXT_PUBLIC_accountId=[YOUR_NEAR_DEV_ACCOUNT_ID]
NEXT_PUBLIC_secretKey=[YOUR_NEAR_DEV_ACCOUNT_SECRET_KEY]
NEXT_PUBLIC_contractId=[YOUR_PROTOCOL_NAME].[YOUR_NEAR_DEV_ACCOUNT_ID]
```

This dev account will be used to call the NEAR Contract. It won't be used when you deploy to Phala Cloud. The template will create an ephemeral NEAR Account and in the UI example will ask for funds before verification and subsequent calls to the contract can be made.

# NEAR Contract & Local Development

Local development of the NEAR Contract has a few dependencies. You will need to have Rust installed and you will also need [cargo near](https://github.com/near/cargo-near).

The contract provides only the basic methods to verify the Worker Agent's remote attesation (RA) quote coming from the TEE deployed on Phala Cloud.

This is handled by the `register_worker` method in `lib.rs`. See the Worker Agent route `pages/api/verify` for more information on where the data is gathered for this call.

## Futher Development

The NEAR Contract stores the Worker Agent's SHA256 of the docker image, and the checksum (Phala Cloud Attestation Explorer link can be generated from this).

Using the SHA256 code hash as the Worker Agent's main identifier, you can create the following:

1. `require!(worker.hash === protocol.hash)` - method calls can only be called by verified Worker Agent
1. Worker Agent group policy - multiple agents from multiple different TEE deployments can register with the same code hash
1. Upgrade a Worker Agent - create a proposal for a new code hash, cooldown period for previous code hash (withdraw window)

## Running the Smart Contract test

An e2e JavaScript test with `yarn test` is provided that will build and redeploy the contract to the sub account of your dev account.

**Quirk: add `"type":"module"` to `package.json` before running tests. You will need to remove this before using NextJS `dev` or `build` again.**

## Building the Worker Agent with YOUR Smart Contract

In the `.env` file at the root:

```bash
NEXT_PUBLIC_contractId=dcap.magical-part.testnet
```

Your docker build of your NextJS app can target this contract by including the contractId in the Dockerfile.

# Design Patterns for Method Access Control

One of the biggest features of the Shade Agent Stack is method access control of the Smart Contract.

## What is Method Access Control?

Coming from the EVM space, you might have seen something like this before:

```rust
import "@openzeppelin/contracts/access/Ownable.sol";
contract MyContract is Ownable {
    function protectedMethod() public onlyOwner {
        // only the owner can call protectedMethod()
    }
}
```

And if you were to dive into the code for `@openzeppelin/contracts/access/Ownable.sol` you would find a short contract that handles the ownership of the `onlyOwner` modifier.

In most cases this boils down to a simple `if` statement that can be paraphrased as: "does the owner stored in the contract state, equal the transaction sender".

## How is Access Control Done on NEAR?

In NEAR, the transaction caller is referred to as the `predecessor` and we can get the AccountId from `env::predecessor_account_id()`.

Typically we would have a statement like this at the top of a NEAR Smart Contract method:

```rust
require!(self.owner_id === env::predecessor_account_id())
```

## Manage Access Control by Verified Worker Agent and Codehash?

In the Shade Agent stack, we're looking to register a Worker Agent in the smart contract that can verify they are running in a TEE.

We've explained above about how this is done and can register the Worker Agent, but how do we control access to different methods?

As mentioned above, the transaction caller in NEAR is the `predecessor_account_id`, and we register Worker Agents by their AccountId in an IterableMap (a hash table) of type `<AccountId, Worker>`.

So if we wanted to restrict a method access to a Worker Agent with only a specific codehash, we could do the following:

```rust
pub fn protected_by_codehash_a(&mut self) {
	let worker = self.get_worker(env::predecessor_account_id());
	require!(CODEHASH_A == worker.codehash);
	...
	// amazing worker agent code
}
```

Where `CODEHASH_A` is a const in the Smart Contract.

<img width="1400" alt="4" src="https://github.com/user-attachments/assets/62eeb31d-41c7-4193-952b-1ad972889b81" />

## Managing a List of Codehashes

Using a const hardcoded in the contract can be a brittle approach. For this reason we can build in a list of approved codehashes that can be managed by devs or upgraded by a DAO process.

Example:

```rust
pub struct Contract {
    ...
	pub approved_codehashes: IterableSet<String>,
	...
}

pub fn approve_codehash(&mut self, codehash: String) {
	// !!! REQUIRES ONLY OWNER OR SOME MORE RIGOR  !!!
	self.approved_codehashes.insert(codehash);
}

pub fn has_approved_codehash(&mut self, account_id: AccountId) {
	let worker = self.get_worker(account_id);
	require!(self.approved_codehashes.contains(&worker.codehash));
}

/// will throw on client if worker agent is not registered with a codehash in self.approved_codehashes
pub fn protected_by_approved_codehashes(&mut self) {
	require!(self.has_approved_codehash(env::predecessor_account_id()));
	...
	// amazing worker agent code
}
```

## Managing Different Workers for Different Methods

<img width="1400" alt="5" src="https://github.com/user-attachments/assets/2d313b50-5259-44d2-b443-736d55705338" />

In order to accomplish this we would simply extend the example above to maintain different lists of codehashes, grouped by the Worker Agents for our methods.

Example:

```rust
pub struct Contract {
    ...
	pub codehashes_a: IterableSet<String>,
	pub codehashes_b: IterableSet<String>,
	...
}

pub fn approve_codehash(&mut self, codehash: String) {
	// !!! REQUIRES ONLY OWNER OR SOME MORE RIGOR  !!!
	self.approved_codehashes.insert(codehash);
}

pub fn has_approved_codehash(&mut self, account_id: AccountId, group: &str) {
	let worker = self.get_worker(account_id);
	match group {
		"a" => require!(self.codehashes_a.contains(&worker.codehash)),
		"b" => require!(self.codehashes_b.contains(&worker.codehash)),
		_ => require!(false)
	}
	;
}

/// will throw on client if worker agent is not registered with a codehash in self.approved_codehashes
pub fn protected_by_codehashes_b(&mut self) {
	require!(self.has_approved_codehash(env::predecessor_account_id(), "b"));
	...
	// amazing worker agent code
}
```
