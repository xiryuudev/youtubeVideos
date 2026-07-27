import makeWASocket, { Browsers, useMultiFileAuthState } from "baileys";
import P from "pino";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    const configModule = await import("./.config.json", { with: { type: "json" } });
    const config = configModule.default;
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

    sock.ev.on("messages.upsert", async (messages) => {
        if (messages.type !== "notify") return;
        
        const msg = messages.messages[0];
        const m = {
            jid: msg.key.remoteJid || msg.key.remoteJidAlt,
            fromMe: msg.key.fromMe,
            number: msg.key.participantAlt || msg.key.participant || msg.key.remoteJid,
            name: msg.pushName,
            timestamp: msg.messageTimestamp,
            message: msg.message,
            text: msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || msg.message?.documentMessage?.caption || ""
        }
        console.log(m);

        switch (m.text) {
            case 'hi':
            case 'test':
                await sock.sendMessage(m.jid, {text : `Hi... This is ${config.botName}, your personal assistant bot.`}, {quoted: msg})
                break;
            default:
                break;
        }
    })
})()