const NeDB = require('nedb-promise');
const {
  micro,
  json,
  send,
  sendError
} = require('micro');
const cors = require('micro-cors');
const parseDomain = require('parse-domain');
const url = require('url');

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
  let res = await db.update(
    { host: clapUrl.host, path: clapUrl.path },
    { $inc: { count: 1 } },
    { upsert: true, returnUpdatedDocs: true }
  );

  return {
    clap: res[0] === 1,
    count: res[1].count
  }
}

/**
 * handle GET requests
 */
async function getHandler(request, clapUrl) {
  let docs = await db.find({ host: clapUrl.host, path: clapUrl.path });
  if (docs.length === 0) {
    return { count: 0 };
  } else {
    return { count: docs[0].count }
  }
}

// This method will process the requests
async function methodHandler(request, response) {
  // Extract common data
  const originDomain = parseDomain(request.headers.origin || '');
  const clapDomain = parseDomain(request.url.slice(1) || '');
  const clapUrl = url.parse(request.url.slice(1) || '');

  if (!clapDomain) {
    return send(response, 401, { clap: false, error: "The URL to clap is not valid" });
  }

  if (!originDomain || originDomain.domain !== clapDomain.domain || originDomain.tld !== clapDomain.tld) {
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
