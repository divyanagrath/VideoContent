var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = 'E:/VideoContentSample' + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

	async function routes (fastify, options) {
		fastify.get('/search',(request, reply) => {
			fs.readFile('client_secret.json', async function processClientSecrets(err, content) {
				if (err) {
					console.log('Error loading client secret file: ' + err);
					return;
				}
				// Authorize a client with the loaded credentials, then call the YouTube API.
				//See full code sample for authorize() function code.
				var resPromise = authorize(JSON.parse(content), {'params': {'maxResults': '25',
                 'part': 'snippet',
                 'q': 'surfing',
                 'type': ''}}, searchListByKeyword);
	  resPromise.then(function(result) {
        console.log("result:::");
		console.log(result);
        // Use user details from here
        return result;
    }, function(err) {
        console.log(err);
    })
			});
		})
	}
async function authorize(credentials, requestData, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, async function(err, token) {
    if (err) {
      getNewToken(oauth2Client, requestData, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
	  return await callback(oauth2Client, requestData);	 
    }
  });
}

function getNewToken(oauth2Client, requestData, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, requestData);
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
	
async function searchListByKeyword(auth, requestData) {
	var youtube = google.youtube('v3');
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = auth;
  
	return new Promise((resolve,reject)=>{
		service.search.list(parameters, function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
				reject(err);
			}else{
				console.log('res:::'+response);
				resolve(response)
			}
		});  
    });
}
function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}

function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}
module.exports = routes