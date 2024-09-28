import OpenAI from 'openai';
import { customAlphabet } from 'nanoid';
import pino from 'pino';

const generateId = customAlphabet('1234567890ABCDEFGH', 5);

/**
 * Generates the properties for the command based on the provided command functions.
 * @param {Object[]} commandFunctions - An array of available command functions.
 * @returns {Object} The properties for the command.
 */
function createCommandProperties(commandFunctions = []) {
  const description = `If you need to execute a command or suggest a new function to handle an abstract task, specify it here.
Example: { name: 'generatePlan', arguments: '{ "goal": "increase sales by 20%" }' }.
You can use existing commands or suggest new ones if necessary. Available commands: ${JSON.stringify(
    commandFunctions,
    null,
    2,
  )}.
If you need to use a command or suggest a new function, it means you are not ready to reply to the user yet.`;

  return {
    command: {
      type: 'object',
      description,
      properties: {
        name: {
          type: 'string',
          description:
            'The name of the command or function to execute or suggest.',
        },
        arguments: {
          type: 'string',
          description:
            'The arguments of the command to execute in JSON format.',
        },
      },
    },
  };
}

/**
 * Creates an array of function definitions for the OpenAI API.
 * @param {Object[]} commandFunctions - An array of available command functions.
 * @returns {Object[]} An array containing the function definitions.
 */
function createFunctions(commandFunctions = []) {
  return [
    {
      name: 'iterate',
      description:
        'This function is called at each iteration of the conversation.',
      parameters: {
        type: 'object',
        properties: {
          thought: {
            type: 'string',
            description: 'The thought behind the response.',
          },
          analysis: {
            type: 'string',
            description: 'Detailed analysis or reasoning about the task.',
          },
          next_steps: {
            type: 'array',
            description: 'The remaining steps before giving the response.',
            items: {
              type: 'string',
              description: 'A description of a single next step.',
            },
          },
          response_buffer: {
            type: 'string',
            description:
              'Store the response here while there are still next steps.',
          },
          ...createCommandProperties(commandFunctions),
          response: {
            type: 'string',
            description: 'The final response to the user.',
          },
        },
        required: ['thought', 'analysis', 'next_steps', 'response_buffer'],
      },
    },
  ];
}

/**
 * Handles errors by logging them and then re-throwing.
 * @param {Error} error - The error object.
 * @param {string} customMessage - A custom error message.
 * @throws {Error} Throws the provided error after logging.
 */
function handleError(error, customMessage = '') {
  logger.error({ err: error }, customMessage);
  throw error;
}

/**
 * Creates an agent that can process messages using the OpenAI API.
 * @param {Object} options - Configuration options for the agent.
 * @returns {Object} An agent object with methods to process messages and get messages.
 */
export function createAgent(options = {}) {
  const {
    id = generateId(),
    apiKey,
    services = {},
    systemMessage = `
You are an AI assistant capable of complex reasoning and problem-solving.
When presented with a task, think through the problem step-by-step,
analyze potential solutions, and provide a well-thought-out response.
If you need more information or need to perform an abstract action, plan accordingly and communicate your reasoning.`,
    commandFunctions = [],
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 1500,
    pricePer1KTokens = 0,
    isDebug = false,
  } = options;

  const logger = pino({
    level: isDebug ? 'debug' : 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  });

  function logDebug(message, data = {}) {
    logger.debug({ id, ...data }, message);
  }

  const openai = new OpenAI({ apiKey });

  const FUNCTIONS = createFunctions(commandFunctions);

  let context = systemMessage
    ? [{ role: 'system', content: systemMessage }]
    : [];
  let totalTokens = 0;

  /**
   * Executes a service command.
   * @async
   * @param {Object} command - The command to execute.
   * @param {Object} services - The services object containing the methods to execute.
   * @returns {Promise<Object>} The result of the executed command or an error object.
   */
  async function executeServiceCommand(command, services) {
    const [serviceName, funcName] = command.name.split('-');
    const args = JSON.parse(command.arguments);

    logDebug('Executing service command', { serviceName, funcName, args });

    try {
      const service = services[serviceName];
      if (!service) {
        throw new Error(`Service "${serviceName}" not found.`);
      }
      const func = service[funcName];
      if (!func) {
        throw new Error(
          `Function "${funcName}" not found in service "${serviceName}".`,
        );
      }
      const result = await func(args);

      logDebug('Service command executed successfully', { result });

      return result;
    } catch (error) {
      logDebug('Error executing service command', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Sends a message to the OpenAI API and retrieves a response.
   * @async
   * @param {OpenAI} openai - The OpenAI client instance.
   * @param {Object} params - The parameters for the API call.
   * @returns {Promise<Object>} The response from the OpenAI API.
   * @throws {Error} Throws an error if the OpenAI API call fails.
   */
  async function fetchOpenAIResponse(openai, params) {
    try {
      logDebug('Sending request to OpenAI', { params });

      const chatCompletion = await openai.chat.completions.create(params);
      const [choice] = chatCompletion.choices;
      if (!choice) {
        throw new Error('No choices returned from OpenAI API.');
      }

      const response = choice.message;
      const usage = chatCompletion.usage;

      logDebug('Received response from OpenAI', { response, usage });

      return { response, usage };
    } catch (error) {
      handleError(error, 'Failed to fetch OpenAI response.');
    }
  }

  /**
   * Recursively processes the conversation until a final response is obtained.
   * @async
   * @returns {Promise<string>} The final response.
   */
  async function recurseUntilResponse(recursionDepth = 0) {
    const MAX_RECURSION_DEPTH = 10;
    if (recursionDepth > MAX_RECURSION_DEPTH) {
      throw new Error('Maximum recursion depth reached.');
    }

    const params = {
      model,
      temperature,
      max_tokens: maxTokens,
      messages: context,
      functions: FUNCTIONS,
      function_call: { name: 'iterate' },
    };
    const { response, usage } = await fetchOpenAIResponse(openai, params);

    context.push({
      role: 'assistant',
      content: response.function_call.arguments,
    });
    totalTokens += usage.total_tokens;

    const args = JSON.parse(response.function_call.arguments);

    logDebug('Parsed response arguments', { args });

    const { command, response: assistantResponse, next_steps } = args;

    if (command) {
      logDebug('Processing command', { command });

      const serviceResult = await executeServiceCommand(command, services);

      if (serviceResult.error) {
        context.push({
          role: 'assistant',
          content: `I encountered an error while executing the command "${command.name}": ${serviceResult.error}`,
        });
        logDebug('Error during command execution', {
          error: serviceResult.error,
        });
      } else {
        context.push({
          role: 'function',
          name: command.name,
          content: JSON.stringify(serviceResult),
        });

        logDebug('Command executed successfully', { serviceResult });
      }

      return await recurseUntilResponse(recursionDepth + 1);
    } else if (assistantResponse) {
      context.push({ role: 'assistant', content: assistantResponse });

      logDebug('Assistant provided final response', { assistantResponse });

      return assistantResponse;
    } else {
      // When no command or response is provided, encourage further reasoning or ask for clarification
      const clarificationMessage =
        'Could you please provide more details or clarify your request?';
      context.push({ role: 'assistant', content: clarificationMessage });

      logDebug('Asking for clarification', { clarificationMessage });

      return clarificationMessage;
    }
  }

  /**
   * Processes a user message and returns a response.
   * @async
   * @param {string} userMessage - The user's message.
   * @returns {Promise<string>} The agent's response.
   */
  async function processMessage(userMessage) {
    context.push({ role: 'user', content: userMessage });
    return await recurseUntilResponse();
  }

  /**
   * Retrieves the current messages from the conversation context.
   * @returns {Object[]} An array of messages from the conversation.
   */
  function getMessages() {
    return context.slice(systemMessage ? 1 : 0);
  }

  /**
   * Calculates the total price based on token usage.
   * @returns {number} The total price.
   */
  function getPrice() {
    return (totalTokens / 1000) * pricePer1KTokens;
  }

  /**
   * Retrieves the total number of tokens used.
   * @returns {number} The total number of tokens.
   */
  function getTotalTokens() {
    return totalTokens;
  }

  return {
    processMessage,
    getMessages,
    getPrice,
    getTotalTokens,
  };
}
