package main

import (
	"bytes"
	"encoding/hex"
	"flag"
	"log"
	"math/big"
	"net/url"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/chaincfg/chainhash"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/btcsuite/btcd/txscript"
	"github.com/btcsuite/btcd/wire"
)

const CONFIRMATION = 3

func main() {

	pv := flag.String("pv", "", "harcoded private key")
	to := flag.String("to", "", "send satoshi to")
	amount := flag.Int64("amount", 0, "satoshi amount to send")
	hash := flag.String("hash", "", "unspent tx hash")
	i := flag.Uint("i", 0, "unspent index")
	left := flag.Int64("left", 0, "left money (should deduct miner fee)")
	rpcUrl := flag.String("rpcurl", "", "rpc url")
	flag.Parse()

	pvBytes, err := hex.DecodeString(*pv)
	if err != nil {
		panic(err)
	}
	bPrivKey, bPubKey := btcec.PrivKeyFromBytes(pvBytes)

	// create redeem script for 1 of 1 multi-sig
	builder := txscript.NewScriptBuilder()
	builder.AddOp(txscript.OP_1)
	builder.AddData(bPubKey.SerializeCompressed())
	builder.AddOp(txscript.OP_1)
	builder.AddOp(txscript.OP_CHECKMULTISIG)
	redeemScript, err := builder.Script()
	if err != nil {
		log.Fatal(err)
	}

	var chainParams = &chaincfg.TestNet3Params
	userAddress, err := btcutil.NewAddressScriptHash(
		redeemScript, chainParams,
	)
	if err != nil {
		log.Fatal(err)
	}

	decUserAddress, err := btcutil.DecodeAddress(userAddress.String(), chainParams)
	if err != nil {
		log.Fatal(err)
	}

	parsedRpcUrl, err := url.Parse(*rpcUrl)
	password, _ := parsedRpcUrl.User.Password()

	// create client
	connCfg := &rpcclient.ConnConfig{
		Host:         parsedRpcUrl.Host,
		Endpoint:     parsedRpcUrl.Scheme,
		HTTPPostMode: true,
		User:         parsedRpcUrl.User.Username(),
		Pass:         password,
		DisableTLS:   true,
		// Certificates: certs,
	}
	client, err := rpcclient.New(connCfg, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Shutdown()

	unspents, err := client.ListUnspentMinMaxAddresses(1, 999999, []btcutil.Address{decUserAddress})
	if err != nil {
		log.Fatal(err)
	}
	if len(unspents) == 0 {
		log.Fatalln("no unspent found")
	}
	for _, unspent := range unspents {
		if unspent.TxID == *hash {
			unspentAmount := big.NewFloat(0)
			unspentAmount.Mul(big.NewFloat(unspent.Amount), big.NewFloat(100000000))
			outputAmount := big.NewFloat(0)
			outputAmount.Add(big.NewFloat(float64(*amount)), big.NewFloat(float64(*left)))
			if unspentAmount.Cmp(outputAmount) < 0 {
				log.Fatalf("unspent amount %s is less than amount + left %s", unspentAmount.String(), outputAmount.String())
			}
			if unspent.Confirmations < CONFIRMATION {
				log.Fatalf("confirmations %d of %s is below %d", unspent.Confirmations, *hash, CONFIRMATION)
			}
			if unspent.Vout != uint32(*i) {
				log.Fatalf("vout %d is not %d", unspent.Vout, *i)
			}
		}
	}

	// prepare transaction
	tx := wire.NewMsgTx(wire.TxVersion)
	utxoHash, err := chainhash.NewHashFromStr(*hash)
	if err != nil {
		log.Fatal(err)
	}

	// and add the index of the UTXO
	inPoint := wire.NewOutPoint(utxoHash, uint32(*i))
	txIn := wire.NewTxIn(inPoint, nil, nil)

	tx.AddTxIn(txIn)

	// adding the output to tx
	targetAddress, err := btcutil.DecodeAddress(*to, chainParams)
	if err != nil {
		log.Fatal(err)
	}
	destinationAddrByte, err := txscript.PayToAddrScript(targetAddress)
	if err != nil {
		log.Fatal(err)
	}
	txOut := wire.NewTxOut(*amount, destinationAddrByte)
	tx.AddTxOut(txOut)
	txOut2 := wire.NewTxOut(*left, userAddress.ScriptAddress())
	tx.AddTxOut(txOut2)

	log.Printf("sending %d satoshi from %s to %s...\n", *amount, decUserAddress.String(), targetAddress.String())
	// signing the tx
	sig1, err := txscript.RawTxInSignature(tx, 0, redeemScript, txscript.SigHashAll, bPrivKey)
	if err != nil {
		log.Fatal(err)
	}

	signature := txscript.NewScriptBuilder()
	signature.AddOp(txscript.OP_FALSE).AddData(sig1)
	signature.AddData(redeemScript)
	signatureScript, err := signature.Script()
	if err != nil {
		log.Fatal(err)
	}

	tx.TxIn[0].SignatureScript = signatureScript

	var signedTx bytes.Buffer
	tx.Serialize(&signedTx)

	hexSignedTx := hex.EncodeToString(signedTx.Bytes())
	log.Println(hexSignedTx)

	// send signed tx
	result, err := client.SendRawTransaction(tx, false)
	if err != nil {
		panic(err)
	}
	log.Printf("tx sent, hash: %s", result.String())
}
