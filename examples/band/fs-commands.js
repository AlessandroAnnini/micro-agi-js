export const commandFunctions = [
  {
    name: 'fsService-fileExists',
    description: 'Check if a file exists.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to check.',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'fsService-createFile',
    description: 'Create a file.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to create.',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'fsService-readFile',
    description: 'Read content from a file.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to read.',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'fsService-appendFile',
    description: 'Append a file.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to append content to.',
        },
        content: {
          type: 'string',
          description: 'The content of the file to append.',
        },
      },
      required: ['filename', 'content'],
    },
  },
  {
    name: 'fsService-deleteFile',
    description: 'Delete a file.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to delete.',
        },
      },
      required: ['filename'],
    },
  },
];
