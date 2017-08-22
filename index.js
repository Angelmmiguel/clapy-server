const NeDB = require('nedb');
const {
  micro,
  json,
  send,
  sendError
} = require('micro');
const cors = require('micro-cors');
const qs = require('querystring');
const url = require('url')

// Constants
const ENV = process.env.NODE_ENV || 'development';
const RESTRICTED_DOMAINS = (process.env.RESTRICTED_DOMAINS || '').split(',');

// Initialize the database
const db = new NeDB({ filename: `data/clapy.${ENV}.json`, autoload: true });

/**
 * handle POST requests
 */
async function postHandler(request, clapUrl) {
  return {
    clap: true,
    path: clapUrl.path,
    count: 1000
  }
}

/**
 * handle GET requests
 */
async function getHandler(request, clapUrl) {
  return {
    path: clapUrl.path,
    count: 1000
  };
}

// This method will process the requests
async function methodHandler(request, response) {
  // Extract common data
  const originUrl = url.parse(request.headers.origin);
  const clapUrl = url.parse(request.url.slice(1));

  if (originUrl.host !== clapUrl.host) {
    return send(response, 401, "The host and the URL doesn't match");
  }

  try {
    switch (request.method) {
    case 'POST':
      return await postHandler(request, clapUrl);
    case 'GET':
      return await getHandler(request, clapUrl);
    default:
      send(response, 405, 'Invalid method');
      break;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * our micro service, run methodHandler and send result as a response (or an error)
 */
module.exports = cors()(async (request, response) => {
  let result = await methodHandler(request, response);
  return result;
});
