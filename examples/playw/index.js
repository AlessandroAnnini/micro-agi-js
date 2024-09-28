// import readline from 'node:readline';
import { createPlaywrightService } from './playwright-service.js';
import { commandFunctions } from './playwright-commands.js';
import { createAgent } from '../../src/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

const playwrightService = createPlaywrightService({
  browserType: 'chromium',
  headless: false,
});

const services = {
  playwrightService,
  // other services...
};

const options = {
  services,
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  temperature: 0.7,
  commandFunctions,
  maximumRecursionDepth: 20,
  isDebug: true,
};

const searcher = createAgent({
  ...options,
  id: 'searcher',
  systemMessage: `You are a useful assistant that can help with web searches using a browser.
Use DuckDuckGo at https://ddg.gg. Befor clicking on any link or button or before submitting any form always look at the html source code to find what you need.
Close the browser when you are done.`,
});

const answer = await searcher.processMessage(
  'What was the PIL of france and Italy in 2023?',
);

console.log('ANSWER', answer);
