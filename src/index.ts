import { Client, Collection, Events } from "discord.js";
import { readdir, stat } from "node:fs/promises";
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startPolling } from "./polling";
import { db } from "./util/Database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

declare module "discord.js" {
    interface Client {
        commands: Collection<string, any>;
        buttons: Collection<string, any>;
    }
}

const client = new Client({
    intents: [
        "Guilds",
    ],
});

async function getFiles(dir: string) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files: any = await Promise.all(
        dirents.map((dirent) => {
            const res = resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : res;
        })
    );
    return Array.prototype.concat(...files);
}

client.commands = new Collection();
client.buttons = new Collection();

(async () => {
    const commands: any = [];
    const commandFiles = await getFiles(join(__dirname, "./commands"));
    for (const path of commandFiles) {
        const stats = await stat(path);
        if (stats.isDirectory()) continue;

        const commandModule = await import(pathToFileURL(path).href);
        const command = commandModule.default;

        if (command === undefined) continue;
        if (command.enabled === false) continue;

        client.commands.set(command.data.name, command);

        if (command.aliases) {
            for (const alias of command.aliases) {
                const aliasCommand = command.data.toJSON();
                aliasCommand.name = alias;
                client.commands.set(alias, command);
                commands.push(aliasCommand);
            }
        }
        commands.push(command.data.toJSON());
    }

    const eventFiles = await getFiles(join(__dirname, "./events"));
    for (const path of eventFiles) {
        const stats = await stat(join(path));
        if (stats.isDirectory()) continue;

        const eventModule = await import(pathToFileURL(path).href);
        const event = eventModule.default;

        if (event === undefined) continue;
        if (event.enabled === false) continue;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
    
    client.on(Events.ClientReady, async () => {
        await client.application?.commands.set(commands);

        const guildIds = Array.from(client.guilds.cache.keys());
        guildIds.forEach((guildId) => {
            startPolling(guildId);
        })

        console.log("Ready!")
    });

    client.login(process.env.BOT_TOKEN as string);   
})();

export { client, db };