import makeWASocket, { Browsers, useMultiFileAuthState } from "baileys";
import P from "pino";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    const {state, saveCreds} = await useMultiFileAuthState(".auth");

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
    });

    if (!state.creds.registered) {
        await delay(5000);
        const code = await sock.requestPairingCode('62895622331910', 'XIRYUUUU');
        console.log('Pair code > ', code);
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("connection closed due to ", lastDisconnect.error, ", reconnecting ", shouldReconnect);
        } else if (connection === "open") {
            console.log("opened connection");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify") return;
        
        const msg = m.messages[0];
        console.log(msg);
    })
})()