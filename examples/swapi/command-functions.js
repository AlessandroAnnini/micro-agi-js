// OpenAI function calling
// Documentation -> https://platform.openai.com/docs/guides/gpt/function-calling
// API Reference -> https://platform.openai.com/docs/api-reference/chat/create#chat/create-functions

export const commandFunctions = [
  {
    name: 'swapi-getPlanets',
    description: 'Get the list of planets.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'swapi-getPlanet',
    description: 'Get a planet by Id.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the planet to get.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'swapi-getPeople',
    description: 'Get the list of people.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'swapi-getPerson',
    description: 'Get a person by Id.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the person to get.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'swapi-getStarships',
    description: 'Get the list of starships.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'swapi-getStarship',
    description: 'Get a starship by Id.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the starship to get.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'swapi-getVehicles',
    description: 'Get the list of vehicles.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'swapi-getVehicle',
    description: 'Get a vehicle by Id.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the vehicle to get.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'swapi-getSpecies',
    description: 'Get the list of species.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'swapi-getSpecie',
    description: 'Get a specie by Id.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the specie to get.',
        },
      },
      required: ['id'],
    },
  },
];
