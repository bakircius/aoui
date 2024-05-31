const _DEFAULT_MODULE = "1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0";
const _DEFAULT_SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA";

import { connect, createDataItemSigner } from "@permaweb/aoconnect";

const { result, results, message, spawn, monitor, unmonitor, dryrun } = connect(
    {
      MU_URL: "https://mu.ao-testnet.xyz",
      CU_URL: "https://cu.ao-testnet.xyz",
      GATEWAY_URL: "https://arweave.net",
    },
  );

  async function getMessageFromAO(messageId) {

    
    console.log(messageId);

    let resultsOut = await result({
      // the arweave TXID of the message
      message: messageId,
      process: localStorage.getItem("connectedPid")
  
    });
  
    return resultsOut;
  
  }
  
  async function getProcessResults(process, limit) {

      // fetching the first page of results
      let resultsOut = await results({
        process: process,
        sort: "DESC",
        limit: limit,
      });
  
  console.log(resultsOut);
  
  return resultsOut;
  
  }
  
  async function sendToComputerUnit(process, owner, processTx, type) {
  
   //todo
  
  }
  
  async function sendMessageToAO(Process, Msg) {

    let Tags = [
      { name: "Type", value: "Message" },
    { name: "Variant", value: "ao.TN.1" }
    ];
  
    const response = await message({
      /*
        The arweave TXID of the process, this will become the "target".
        This is the process the message is ultimately sent to.
      */
      process: Process,
      // Tags that the process will use as input.
      tags: Tags,
      // A signer function used to build the message "signature"
      signer: createDataItemSigner(globalThis.arweaveWallet),
      /*
        The "data" portion of the message.
        If not specified a random string will be generated
      */
      data: Msg,
    }).catch(console.error);

    return response;
  
  }
  
  export {sendMessageToAO, getMessageFromAO, sendToComputerUnit, getProcessResults}