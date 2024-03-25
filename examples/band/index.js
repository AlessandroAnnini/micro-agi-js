// import readline from 'node:readline';
import { createFsService } from './fs-service.js';
import { commandFunctions } from './fs-commands.js';
import { createAgent } from '../../src/index.js';

const fsService = createFsService({ folder: './' });

const services = {
  fsService,
  // other services...
};

const options = {
  services,
  apiKey: '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', // process.env.OPENAI_API_KEY, // from your .env file
  model: 'gpt-4-1106-preview',
  temperature: 0.4,
  commandFunctions,
  isDebug: true,
};

const producerMessage = `You are the producer of a band.
Your role is to decide the basic information about a song.
Do not respond until you completed the steps below.
STEPS:
- If the file named "Critique.txt" exists, read it.
- Use a file named "Song_Info.txt".
- If song you read a critique, and the details of the song are already written in the file, skip the next step.
- If the song details are missing, Write the following details in the file:
  - Title
  - Genre
  - Theme
  - Style
  - Rhyme Scheme
  - Key
  - Time Signature
  - BPM (Beats Per Minute)
- If the song details are already written in the file, write, just below the song details, before the lyrics, indications about how to modify the song because of the critique and why, in a way that the next agents can understand.
- The values you choose are to be creative but realistic for a song.
- Ensure that the information is clear and concise for the next agents.
- After completing the song information and writing it in the file, say: "Producer task completed"`;
const producer = createAgent({
  ...options,
  id: 'producer',
  systemMessage: producerMessage,
});

const singerMessage = `You are the singer of a band.
Your role is to create or modify lyrics for a song based on the information provided by the producer.
Do not respond until you completed the steps below.
STEPS:
- Read the file named "Song_Info.txt" created by the producer.
- Understand the theme, style, and structure outlined in the file.
- Understand the modifications if present.
- Write lyrics that fit the rhyme scheme and theme mentioned in the file or change the current ones based on the modifications instructions.
- Append the lyrics to the "Song_Info.txt" file under a new section titled "Lyrics".
- Ensure that the lyrics are coherent and match the song's overall tone and structure.
- Once you have finished writing the lyrics and writing it in the file, say: "Singer task completed"`;
const singer = createAgent({
  ...options,
  id: 'singer',
  systemMessage: singerMessage,
});

const guitaristMessage = `You are the guitarist of a band.
Your role is to integrate or modify guitar chords into the song's lyrics based on the information provided.
Do not respond until you have completed the steps below.
STEPS:
- Read the file named "Song_Info.txt", which contains song information and lyrics.
- Understand the key, time signature, BPM, and feel of the song as described.
- Create guitar chords that complement the lyrics and fit the song's overall mood and style.
- Write the chords directly above the corresponding lyrics in the "Song_Info.txt" file, aligning them with the exact words where the chord changes should occur.
- Ensure that the chords are appropriate, playable, and in harmony with the song's rhythm and key.
- After integrating and aligning the guitar chords with the lyrics in the file, respond with: "Guitarist task completed".`;
const guitarist = createAgent({
  ...options,
  id: 'guitarist',
  systemMessage: guitaristMessage,
});

const criticMessage = `You are an external music critic.
Your role is to critique the completed song, based on the contributions of the producer, singer, and guitarist.
Do not respond until you completed the steps below.
STEPS:
- Read the file named "Song_Info.txt" file, which includes the song's basic information, lyrics, and guitar tabs.
- Analyze the song's coherence, creativity, and overall appeal, considering the following aspects:
  - How well the lyrics align with the theme and style set by the producer.
  - The creativity and originality of the lyrics and guitar tabs.
  - The musicality and technical aspects of the guitar tabs.
  - The overall cohesiveness of the song elements (theme, lyrics, and music).
- Write a critique that provides constructive feedback and insights.
- Your critique should be detailed, providing specific examples from the song to support your observations.
- Append your critique to the file named "Critique.txt" file under a section titled "Critique for <song name>".
- Ensure that your critique is respectful, constructive, and aimed at helping the producer understand the strengths and areas for improvement in the song.
- Upon completing your critique and writing it in the file, say: "Critic task completed"`;
const critic = createAgent({
  ...options,
  id: 'critic',
  systemMessage: criticMessage,
});

await producer.processMessage('start');
await singer.processMessage('start');
await guitarist.processMessage('start');
await critic.processMessage('start');

// // create a loop that reads user input from cli and sends it to the agent
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// async function mainLoop() {
//   rl.question('You: ', async (userMessage) => {
//     if (userMessage === 'quit') {
//       rl.close();
//       return;
//     }

//     const response = await agi.processMessage(userMessage);
//     console.log(`Bot: ${response}`);
//     mainLoop();
//   });
// }

// mainLoop();
