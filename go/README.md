# Go Scripts for Blockchain

* p2sh.go

You can send p2sh transaction with this file.

```BASH
go run p2sh.go --help

  -amount int
        satoshi amount to send
  -hash string
        unspent tx hash
  -i uint
        unspent index
  -left int
        left money (should deduct miner fee)
  -pv string
        harcoded private key
  -rpcurl string
        rpc url
  -to string
        send satoshi to
```