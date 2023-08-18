# tron.misc
Miscellaneous scripts for blockchain

# Requirement
### tron scripts
nodejs

### btc scripts
python-bitcoinlib

# Usage
1. clone repo and install dependencies

```BASH
$ git clone https://github.com/sc0Vu/tron.misc.git
$ cd tron.misc
$ npm install // yarn install
```

2. copy and update `.env`

```BASH
$ cp .env.example .env
$ vim .env
ACCOUNT=
PRIVATE_KEY=
NODE_URI=https://api.shasta.trongrid.io # rpc shasta
EVENT_URI=https://api.shasta.trongrid.io # rpc shasta
USDT=
```

3. execute script

```BASH
$ node sendTrx.js 1
or
$ node sendTrc20.js 1
```

## Scripts

### sendTrx
This script aims transfering tron token to the `ACCOUNT`.

### sendTrc20
This script aims transfering trc20 token to the `ACCOUNT`.

> Remember to deploy trc20 token first and make sure you have enough energy and bandwidth.

### doublespend
```
$ ./doublespend.py --txid xxxx xxxx 0.001 -n
```

### cpfp
```
$ ./cpfp.py --txid xxxx xxxx 0.001 -n
```

# License
MIT