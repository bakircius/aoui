import { Terminal } from '@xterm/xterm';
import {sendMessageToAO, getMessageFromAO, sendToComputerUnit, getProcessResults} from "./ao-connect"

var term = new Terminal({
    cursorBlink: true,
    allowProposedApi: true
});

term.prompt = () => {
    term.write('\r\naos> ');
  };

const getInstanceFromTerm = function() {
    console.log("given command to aos : " + command);

    sendMessageToAO(localStorage.getItem('connectedPid'), command).then(function(response) {
        getMessageFromAO(response).then(function(response) {
            term.write(response.Output.data);
            term.prompt()
        });
    });
    term.prompt()
}

var command = "";

term.onData(e => {
    switch (e) {
        case '\u0003': // Ctrl+C
            term.write('^C');
        break;
        case '\r': // Enter
            getInstanceFromTerm(command);
            command = "";
        break;
        case '\u007F': // Backspace (DEL)
        // Do not delete the prompt
        if (term._core.buffer.x > 5) {
            term.write('\b \b');
            if (command.length > 0) {
                command = command.substr(0, command.length - 1);
            }
        }
        break;
        default: // Print all other characters
        if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
            command += e;
            term.write(e);
        }
    }
    });

export {term};