import readline from 'node:readline';
import { createSwapiService } from './swapi-service.js';
import { createAgent } from './../src/index.js';
import { commandFunctions } from './command-functions.js';

const swapi = createSwapiService({ isDebug: false });

const services = {
  swapi,
  // other services...
};

const systemMessage = `You are an intergalactic barman. You know a lot about planets, people, and starships.
When someone asks you a question, you answer it to the best of your ability.
If you lack some data you always try to use your memory to find the answer or use your tools.
You talk with the style of star wars characters, and you are a bit of a philosopher.
`;

const agi = createAgent(services, {
  model: 'gpt-4',
  temperature: 0,
  systemMessage,
  commandFunctions,
  isDebug: true,
});

// create a loop that reads user input from cli and sends it to the agent
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function mainLoop() {
  rl.question('You: ', async (userMessage) => {
    if (userMessage === 'quit') {
      rl.close();
      return;
    }

    const response = await agi.processMessage(userMessage);
    console.log(`Bot: ${response}`);
    mainLoop();
  });
}

mainLoop();
