const NeDB = require('nedb');
const {
  micro,
  json,
  send,
  sendError
} = require('micro');
const cors = require('micro-cors');
const parseDomain = require('parse-domain');

// Constants
const ENV = process.env.NODE_ENV || 'development';
const RESTRICTED_DOMAINS = (process.env.RESTRICTED_DOMAINS || '').split(',');

// Initialize the database
const db = new NeDB({
  //filename: `/tmp/data/clapy.${ENV}.json`,
  autoload: true
});

/**
 * handle POST requests
 */
async function postHandler(request, clapUrl) {
  return {
    clap: true,
    count: 1000
  }
}

/**
 * handle GET requests
 */
async function getHandler(request, clapUrl) {
  return {
    count: 1000
  };
}

// This method will process the requests
async function methodHandler(request, response) {
  // Extract common data
  const originUrl = parseDomain(request.headers.origin || '');
  const clapUrl = parseDomain(request.url.slice(1) || '');

  if (!clapUrl) {
    return send(response, 401, { clap: false, error: "The URL to clap is not valid" });
  }

  if (!originUrl || originUrl.domain !== clapUrl.domain || originUrl.tld !== clapUrl.tld) {
    return send(response, 401, { clap: false, error: "Send requests only from the same domain" });
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
module.exports = cors({
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Access-Control-Allow-Origin', 'Content-Type', 'Accept']
})(async (request, response) => {
  let result = await methodHandler(request, response);
  return result;
});
