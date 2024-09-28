export const commandFunctions = [
  {
    name: 'playwrightService-openBrowser',
    description: 'Opens a new browser instance.',
    parameters: {
      type: 'object',
      properties: {
        browserType: {
          type: 'string',
          description: 'Type of browser to launch (chromium, firefox, webkit).',
          enum: ['chromium', 'firefox', 'webkit'],
        },
        headless: {
          type: 'boolean',
          description: 'Whether to launch the browser in headless mode.',
          default: false,
        },
      },
      required: ['browserType'],
    },
  },
  {
    name: 'playwrightService-closeBrowser',
    description: 'Closes the current browser instance.',
  },
  {
    name: 'playwrightService-navigateToUrl',
    description: 'Navigates to a specified URL.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'playwrightService-searchElement',
    description: 'Searches for an element specified by a selector.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'The selector of the element to search for.',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwrightService-clickElement',
    description: 'Clicks an element specified by a selector.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'The selector of the element to click.',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwrightService-fillInput',
    description: 'Fills an input field with specified text.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'The selector of the input field.',
        },
        text: {
          type: 'string',
          description: 'The text to fill into the input field.',
        },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'playwrightService-getText',
    description: 'Gets the text content of an element specified by a selector.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'The selector of the element.',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwrightService-getHtml',
    description: 'Gets the HTML content from a selector.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description:
            'The selector of the element to get the HTML content from.',
        },
      },
      required: ['selector'],
    },
  },
  // {
  //   name: 'playwrightService-screenshot',
  //   description: 'Takes a screenshot of the current page.',
  //   parameters: {
  //     type: 'object',
  //     properties: {
  //       path: {
  //         type: 'string',
  //         description: 'The file path to save the screenshot to.',
  //       },
  //     },
  //     required: ['path'],
  //   },
  // },
];
