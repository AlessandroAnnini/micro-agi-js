import OpenAI from 'openai';

/**
 * Generates the properties for the command based on the provided command functions.
 * @param {Object[]} [commandFunctions] - An array of available command functions.
 * @returns {Object} The properties for the command.
 */
function createCommandProperties(commandFunctions) {
  if (!commandFunctions) return {};

  return {
    command: {
      type: 'object',
      description: `If you need to execute a command because you miss some data, specify it here. Example: { name: 'peopleService-searchUserContact', arguments: '{ "phoneNumber": "393381481934" }' }. Here is a list of all the available commands: ${JSON.stringify(
        commandFunctions,
        null,
        2
      )}. If you need to use a command it probably means that you are not ready to reply to the user yet.`,
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
    description:
      'Use this to create a new user contact with the specified parameters if it was not found previously. Try to guess display name, family name, and given name from the info provided by the user.',
    parameters: {
      type: 'object',
      properties: {
        thought: {
          type: 'string',
          description: 'The thought behind the response',
        },
        description: { type: 'string', description: 'Describe the response' },
        criticism: {
          type: 'string',
          description: 'Constructive criticism for the response',
        },
        ...createCommandProperties(commandFunctions),
        response: { type: 'string', description: 'The response to the user.' },
      },
      required: ['thought', 'description', 'criticism'],
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
  console.error(`[ERROR] ${customMessage}`, {
    message: e.message,
    stack: e.stack,
  });
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
 * Creates an agent that can process messages using the OpenAI API.
 * @param {Object} [options={}] - Configuration options for the agent.
 * @param {Object} [options.services] - The services available for the agent to use.
 * @param {string} [options.apiKey] - The API key for the OpenAI API.
 * @param {string} [options.model='gpt-4'] - The model to use with the OpenAI API.
 * @param {number} [options.temperature=0] - The temperature setting for the OpenAI API.
 * @param {string} [options.systemMessage] - An initial system message.
 * @param {Object[]} [options.commandFunctions] - An array of available command functions.
 * @returns {Object} An agent object with methods to process messages and get messages.
 */
export function createAgent(options = {}) {
  const {
    apiKey,
    services,
    systemMessage,
    commandFunctions,
    model = 'gpt-4',
    temperature = 0,
    isDebug = false,
  } = options;

  const openai = new OpenAI({ apiKey });

  const FUNCTIONS = createFunctions(commandFunctions);
  let context = systemMessage
    ? [{ role: 'system', content: systemMessage }]
    : [];

  /**
   * Sends a message to the OpenAI API and retrieves a response.
   * @async
   * @param {Object[]} context - The current context of the conversation.
   * @returns {Promise<Object>} The response from the OpenAI API.
   * @throws {Error} Throws an error if the OpenAI API call fails.
   */
  async function fetchOpenAIResponse(context) {
    const params = {
      model,
      temperature,
      messages: context,
      functions: FUNCTIONS,
      function_call: { name: 'iterate' },
    };

    try {
      const chatCompletion = await openai.chat.completions.create(params);
      if (!chatCompletion.choices.length) {
        throw new Error('No choices returned');
      }
      return chatCompletion.choices[0].message;
    } catch (e) {
      handleError(e, 'Failed to fetch OpenAI response.');
    }
  }

  /**
   * Loops through the conversation until a final response is obtained.
   * @async
   * @param {Object[]} context - The current context of the conversation.
   * @returns {Promise<string|null>} The final response or null if an error occurs.
   */
  async function recurseUntilResponse(context) {
    const response = await fetchOpenAIResponse(context);
    const { command, response: waResponse } = JSON.parse(
      response.function_call.arguments
    );

    const args = JSON.parse(response.function_call.arguments);
    const responseContent = Object.entries(args).reduce((res, curr) => {
      const [key, value] = curr;
      return `${res}\n\t${key.toUpperCase()}: ${JSON.stringify(value)};`;
    }, '');
    isDebug && console.log(`\n\n${responseContent}\n\n`);

    if (command) {
      if (isDebug) {
        console.log('\n\n------ USE FUNCTION ------');
        console.log(`${JSON.stringify(command, null, 2)}\n\n`);
      }

      try {
        const serviceResult = await executeServiceCommand(command, services);
        const [, funcName] = command.name.split('-');
        context = [
          ...context,
          {
            role: 'function',
            name: funcName,
            content: JSON.stringify(serviceResult),
          },
        ];
        return await recurseUntilResponse(context);
      } catch (e) {
        handleError(e, `Failed to use tool: ${command.name.replace('-', '.')}`);
        return null;
      }
    } else {
      context = [...context, { role: 'assistant', content: waResponse }];
      return waResponse;
    }
  }

  /**
   * Processes a user message and returns a response.
   * @async
   * @param {string} userMessage - The user's message.
   * @returns {Promise<string>} The agent's response.
   */
  async function processMessage(userMessage) {
    context = [...context, { role: 'user', content: userMessage }];

    return await recurseUntilResponse(context);
  }

  /**
   * Retrieves the current messages from the conversation context.
   * @returns {Object[]} An array of messages from the conversation.
   */
  function getMessages() {
    return context[0].role === 'system' ? context.slice(1) : context;
  }

  return {
    processMessage,
    getMessages,
  };
}
