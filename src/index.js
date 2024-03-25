import OpenAI from 'openai';
import { customAlphabet } from 'nanoid';

const generateId = customAlphabet('1234567890ABCDEFGH', 5);

/**
 * Generates the properties for the command based on the provided command functions.
 * @param {Object[]} [commandFunctions] - An array of available command functions.
 * @returns {Object} The properties for the command.
 */
function createCommandProperties(commandFunctions) {
  if (!commandFunctions) return {};

  const description = `If you need to execute a command because you miss some data, specify it here.
  Example: { name: 'peopleService-searchUserContact', arguments: '{ "phoneNumber": "391234567890" }' }.
  Here is a list of all the available commands: ${JSON.stringify(
    commandFunctions,
    null,
    2
  )}.
  If you need to use a command it probably means that you are not ready to reply to the user yet.`;

  return {
    command: {
      type: 'object',
      description,
      properties: {
        name: {
          type: 'string',
          description: 'The name of the command to execute.',
        },
        arguments: {
          type: 'string',
          description: 'The arguments of the command to execute.',
        },
      },
    },
  };
}

/**
 * Creates an array of function definitions for the OpenAI API.
 * @param {Object[]} [commandFunctions] - An array of available command functions.
 * @returns {Object[]} An array containing the function definitions.
 */
const createFunctions = (commandFunctions) => [
  {
    name: 'iterate',
    description: `This function is called at each iteration of the conversation.`,
    parameters: {
      type: 'object',
      properties: {
        thought: {
          type: 'string',
          description: 'The thought behind the response',
        },
        description: { type: 'string', description: 'Describe the response' },
        next_steps: {
          type: 'array',
          description:
            'The remaining steps before giving the response, one for each element of the array',
          items: {
            type: 'string',
            description: 'The description of the single next steps',
          },
        },
        respons_buffer: {
          type: 'string',
          description:
            'Use this only if you have at least 1 step. While you still have next steps, store the response here, if you have one, until you run out of next steps.',
        },
        // criticism: {
        //   type: 'string',
        //   description: 'Constructive criticism to the chain of thought',
        // },
        ...createCommandProperties(commandFunctions),
        response: { type: 'string', description: 'The response to the user.' },
      },
      required: ['thought', 'description', 'next_steps', 'respons_buffer'],
    },
  },
];

/**
 * Handles errors by logging them and then re-throwing.
 * @param {Error} e - The error object.
 * @param {string} [customMessage=''] - A custom error message.
 * @throws {Error} Throws the provided error after logging.
 */
function handleError(e, customMessage = '') {
  console.error(`[ERROR] ${customMessage}: ${e.message}\nStack: ${e.stack}`);
  throw e;
}

/**
 * Executes a service command.
 * @async
 * @param {Object} command - The command to execute.
 * @param {Object} service - The service object containing the methods to execute.
 * @returns {Promise<Object>} The result of the executed command.
 * @throws {Error} Throws an error if the service command execution fails.
 */
async function executeServiceCommand(command, service) {
  const [serviceName, funcName] = command.name.split('-');
  const args = JSON.parse(command.arguments);

  try {
    return await service[serviceName][funcName](args);
  } catch (e) {
    handleError(e, `Failed to use service: ${serviceName}.${funcName}`);
  }
}

/**
 * Sends a message to the OpenAI API and retrieves a response.
 * @async
 * @param {Object[]} context - The current context of the conversation.
 * @returns {Promise<Object>} The response from the OpenAI API.
 * @throws {Error} Throws an error if the OpenAI API call fails.
 */
async function fetchOpenAIResponse(openai, params) {
  try {
    const chatCompletion = await openai.chat.completions.create(params);
    if (!chatCompletion.choices.length) {
      throw new Error('No choices returned');
    }

    const response = chatCompletion.choices[0].message;
    const usage = chatCompletion.usage;

    return { response, usage };
  } catch (e) {
    handleError(e, 'Failed to fetch OpenAI response.');
  }
}

/**
 * Creates an agent that can process messages using the OpenAI API.
 * @param {Object} [options={}] - Configuration options for the agent.
 * @param {string} [options.apiKey] - The API key for the OpenAI API.
 * @param {Object} [options.services] - The services available for the agent to use.
 * @param {string} [options.systemMessage] - An initial system message.
 * @param {Object[]} [options.commandFunctions] - An array of available command functions.
 * @param {string} [options.model='gpt-4'] - The model to use with the OpenAI API.
 * @param {number} [options.temperature=0] - The temperature setting for the OpenAI API.
 * @param {number} [options.price1KTokens=0] - The price per 1000 tokens.
 * @returns {Object} An agent object with methods to process messages and get messages.
 */
export function createAgent(options = {}) {
  const {
    id = generateId(),
    apiKey,
    services,
    systemMessage,
    commandFunctions,
    model = 'gpt-4',
    temperature = 0.2,
    price1KTokens = 0,
    isDebug = false,
  } = options;

  const openai = new OpenAI({ apiKey });

  const FUNCTIONS = createFunctions(commandFunctions);

  let context = systemMessage
    ? [{ role: 'system', content: systemMessage }]
    : [];
  let tokens = 0;

  function consolelog(...args) {
    if (isDebug) {
      console.log(`  >>> ${id} >>>`);
      console.log(...args);
      console.log('\n\n');
    }
  }

  /**
   * Loops through the conversation until a final response is obtained.
   * @async
   * @returns {Promise<string|null>} The final response or null if an error occurs.
   */
  async function recurseUntilResponse() {
    const params = {
      model,
      temperature,
      messages: context,
      functions: FUNCTIONS,
      function_call: { name: 'iterate' },
    };
    const { response, usage } = await fetchOpenAIResponse(openai, params);

    context = [
      ...context,
      { role: 'assistant', content: response.function_call.arguments },
    ];
    tokens += usage.total_tokens;

    const args = JSON.parse(response.function_call.arguments);

    if (isDebug) {
      const responseContent = Object.entries(args).reduce((res, curr) => {
        const [key, value] = curr;
        return `${res}\n\t${key.toUpperCase()}: ${JSON.stringify(value)};`;
      }, '');
      consolelog(responseContent);
    }

    const { command, response: llmResponse } = args;

    if (command) {
      const [serviceName, funcName] = command.name.split('-');

      try {
        const serviceResult = await executeServiceCommand(command, services);

        context = [
          ...context,
          {
            role: 'function',
            name: funcName,
            content: JSON.stringify(serviceResult),
          },
        ];

        consolelog(
          `||-------- FUNCTION RESULT --------||\n\n${JSON.stringify(
            serviceResult
          )}`
        );

        return await recurseUntilResponse();
      } catch (e) {
        handleError(e, `Failed to use tool: ${serviceName}.${funcName}`);
        return null;
      }
    } else if (llmResponse) {
      // a response was returned, add it to the context and return it
      context = [...context, { role: 'assistant', content: llmResponse }];

      consolelog(`||-------- RESPONSE --------||\n\n${llmResponse}`);

      return llmResponse;
    }

    consolelog(`||-------- NO FN & NO RSP --------||`);

    return await recurseUntilResponse();
  }

  /**
   * Processes a user message and returns a response.
   * @async
   * @param {string} userMessage - The user's message.
   * @returns {Promise<string>} The agent's response.
   */
  async function processMessage(userMessage) {
    context = [...context, { role: 'user', content: userMessage }];

    return await recurseUntilResponse();
  }

  /**
   * Retrieves the current messages from the conversation context.
   * @returns {Object[]} An array of messages from the conversation.
   */
  function getMessages() {
    return context[0].role === 'system' ? context.slice(1) : context;
  }

  function getPrice() {
    return (tokens / 1000) * price1KTokens;
  }

  function getTotalTokens() {
    return tokens;
  }

  return {
    processMessage,
    getMessages,
    getPrice,
    getTotalTokens,
  };
}
