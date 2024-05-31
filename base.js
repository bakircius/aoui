import {term } from "./terminal";

import { sendMessageToAO, getMessageFromAO, sendToComputerUnit, getProcessResults} from "./ao-connect";

let terminalItem = document.getElementById('terminal');
term.open(terminalItem);

// token addresses
const _CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc";
const _ORBIT = "BUhZLMwQ6yZHguLtJYA5lLUa9LQzLXMXRfaq9FVcPJc";
const _EXP = "aYrCboXVSl1AXL9gPFe3tfRxRf0ZmkOXH65mKT0HHZw";
const tokens = [_CRED, _EXP]; //get these token balances from connected wallet

var userAddress = "";

function getRandomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var i = getRandomNumber(1,100)

const MU_URL = "https://mu.ao-testnet.xyz";
const CU_URL = "https://cu"+i+".ao-testnet.xyz";
const GATEWAY_URL = "https://arweave.net";
const DEFAULT_MODULE = "1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0";
const DEFAULT_SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA";

let walletConnectButton = document.getElementById('ConnectArConnect');
let walletDisconnectButton = document.getElementById('DisconnectArConnect');
let walletBalances = document.getElementById('WalletBalances');
let loader = document.getElementById('AOUILoader');
let walletDisconnectCall = false;
let processConnectButton = document.getElementById("ConnectToAos");
var connectedWalletPid = document.getElementById('ConnectedWalletPid');
var sendHello = document.getElementById('SendHello');

checkConnection();

addEventListener("arweaveWalletLoaded", () => {
  console.log(`You are using the ${window.arweaveWallet.walletName} wallet.`);
  console.log(`Wallet version is ${window.arweaveWallet.walletVersion}`);
});

addEventListener("walletSwitch", (e) => {
    // handle wallet switch
  if (!walletDisconnectCall) {
    userAddress = e.detail.address;
    localStorage.setItem('userAddress',userAddress);
    walletConnected(userAddress);
  }
});

processConnectButton.addEventListener('click', async () => {
  term.reset();
  term.write("Connecting...\r\n");
  let success = connectPidtoAos(userAddress, "");
  success.then(function(result) {
    term.write("Connected successfully.\r\n");
    term.write("Process id :" + connectedWalletPid.value + "\r\n");
    term.prompt()
    localStorage.setItem('connectedPid',connectedWalletPid.value);
  });
  
  
});

// connecting to wallet
walletConnectButton.addEventListener('click', async () => {
  if (window.arweaveWallet) {
      try {

          loaderShow();
          // Request connection to ArConnect
          await window.arweaveWallet.connect(
            // request permissions to read the active address
            ["ACCESS_ADDRESS", "SIGNATURE", "SIGN_TRANSACTION"],
            // provide some extra info for our app
            {
              name: "AO-UI by bakircius",
              logo: "https://0.s3.envato.com/files/60211735/bakirciuslogo.png"
            },

          );
          userAddress = await window.arweaveWallet.getActiveAddress();
          localStorage.setItem('userAddress',userAddress);
          walletConnected(userAddress);

      } catch (error) {
          console.error("Failed to connect to ArConnect", error);
          alert("Failed to connect to ArConnect. Please try again.");
      }
  } else {
      alert("ArConnect wallet not installed. Please install it first.");
  }
});

//discconnecting from wallet
walletDisconnectButton.addEventListener('click', async () => {
  if (window.arweaveWallet) {
    try {
      // Request disconnection to ArConnect
      await window.arweaveWallet.disconnect();
      walletDisconnected();


  } catch (error) {
      console.error("Failed to disconnect from ArConnect", error);
      alert("Failed to disconnect from ArConnect. Please try again.");
  }
}
});

//check connection on load
async function checkConnection() {
  // Wait 2 seconds before checking auth for arconnect to load
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (!window.arweaveWallet) {
    alert("install ARConnect wallet first.");
    return;
  } else {
    walletConnectButton.classList.remove("hide");
  }

  try {
    userAddress = await window.arweaveWallet.getActiveAddress();
    if (userAddress) {
      // User is authenticated
      walletConnected(userAddress);
    } else {
      // User is not authenticated
      walletDisconnected();
    }
  } catch (error) {
    walletDisconnected();

  }
}

//after successful wallet connection works
const walletConnected = async function(user) {
  
  walletDisconnectCall = false;
  walletBalances.innerHTML = "";
  ConnectedWalletPid.innerHTML = "";
  addItemToWalletBalances("wallet", user);
  
  walletDisconnectButton.classList.remove("hide");
  walletConnectButton.classList.add("hide");
  loaderShow();
  const res = await axios.get("https://arweave.net/wallet/"+user+"/balance");
  let ARbalance = res.data / 1000000000000;
  ARbalance = Math.round((ARbalance + Number.EPSILON) * 100) / 100
  addItemToWalletBalances("AR", ARbalance);
  loaderHide();
  let balance = null;
  let ticker = null;

  tokens.forEach(token => {
    
    let tokenInfo = checkTokenBalance(token, user);
    let denomination = 3;

    tokenInfo.then(function(result){
      
      result.Messages[0].Tags.forEach(tag => {
        if (tag.name === "Balance") {
            balance = tag.value;
        }
        if (tag.name === "Ticker") {
            ticker = tag.value;
        }
        if (tag.name === "Denomination") {
          denomination = tag.value;
        }
      });
      
      balance = balance / 10**denomination;
      balance = Math.round((balance + Number.EPSILON) * 100) / 100
      addItemToWalletBalances(ticker, balance)
      loaderHide();
    });

  });

  let walletInstances = getConnectedWalletMainProcessAndTransactions(user);
  let defaultPid = "";
  walletInstances.then(function(result) {
    let transactions = result.data.transactions;
    let edges = result.data.transactions.edges;
    edges.forEach(edge => {
      let tags = edge.node.tags;
        tags.forEach(tag=> {
          if (tag.name === "Name" && tag.value === "default") {
            defaultPid = edge;
            addPidToSelectBox("default pid : " + defaultPid.node.id.substring(0,8) + " ...", defaultPid.node.id);
            term.reset();
            term.write("Connect your Process");
          }

        });
    });
    addItemToWalletBalances("default pid", defaultPid.node.id);
    loaderHide();
  });

};

//after successful wallet disconnection works
const walletDisconnected = function() {

  walletDisconnectCall = true;
  walletBalances.innerHTML = "";
  connectedWalletPid.innerHTML = ""
  walletBalances.appendChild(document.createElement("p")).innerHTML = "<span>Connect Wallet</span>";
  walletDisconnectButton.classList.add("hide");
  walletConnectButton.classList.remove("hide");
  term.reset()
  term.write("Connect your wallet!")
  loaderHide();
}

//check token balance by active wallet address
async function checkTokenBalance(aotoken, userWalletAddress) {
  loaderShow();
  const response = await axios.post(CU_URL+"/dry-run?process-id="+aotoken, {
  "Target":aotoken,
  "Owner":userWalletAddress,
  "Data":null,
  "Tags":[{"name":"Action","value":"Balance"},
  {"name":"Target","value":userWalletAddress},
  {"name":"Type","value":"Message"},
  {"name":"Variant","value":"ao.TN.1"},
  {"name":"Protocol","value":"ao"}]
  });
  return response.data;
}

async function addItemToWalletBalances(ticker,balance) {
  walletBalances.appendChild(document.createElement("p")).innerHTML = ticker + " <span>" + balance + "</span>";
}

const loaderHide = function() {
    AOUILoader.classList.add("hide");
}

const loaderShow = function() {
  AOUILoader.classList.remove("hide");
}

async function getConnectedWalletMainProcessAndTransactions(activeAddress) {

  loaderShow();
  const response = await axios.post("https://arweave.net/graphql", {
      "query": "query { transactions( first: 100 owners: [\""+activeAddress+"\"] tags: [ { name: \"Data-Protocol\", values: [\"ao\"] } { name: \"Type\", values: [\"Process\"] } { name: \"App-Name\", values: [\"aos\"] } ] ) { edges { node { id tags { name value } } } }}"
    });
  return response.data;

}

async function addPidToSelectBox(name, value) {
    let opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = name;
    connectedWalletPid.appendChild(opt);
}

async function connectPidtoAos(address, name="") {

      // todo

      loaderShow(); 
      const response = await axios.get("https://cu"+ getRandomNumber(1,100) +".ao-testnet.xyz/results/"+ connectedWalletPid.value +"?sort=DESC&limit=1");
      getProcessResults(connectedWalletPid.value, 2).then(function(response) {
          response.edges.forEach(edge=> {
            
              if (typeof(edge.node.Output.data) === "string") {
                if (edge.node.Output.data !== "" || edge.node.Output.data !== null) {
                  term.write(edge.node.Output.data+"\r\n");
                  term.write(edge.node.Output.prompt);
                }
            } else if (typeof(edge.node.Output.data) === "object") {
                term.write(edge.node.Output.data.json+"\r\n");
                term.write(edge.node.Output.data.prompt);
            }

          });
      });
      loaderHide();
      return response.data;

}

