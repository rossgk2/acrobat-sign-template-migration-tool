const
	https = require('https'),
	fs = require('fs'),
	axios = require('axios'),
	open = require('open'), // for viewing URLs
	FormData = require('form-data'), // https://maximorlov.com/send-a-file-with-axios-in-nodejs/
	FileSaver = require('file-saver'); // https://github.com/eligrey/FileSaver.js/

const gmailBearerToken = '(This sensitive info has been removed by BFG repo cleaner)';
const headersConfig = {'Authorization' : `Bearer ${gmailBearerToken}`}
const requestConfig = { 'headers' : headersConfig };

async function getBaseUri()
{
	let response = await axios.get('https://api.na1.adobesign.com:443/api/rest/v6/baseUris', requestConfig);
	let baseUri = response.data['apiAccessPoint'];
	baseUri = baseUri.substring(0, baseUri.length - 1) + "/api/rest/v6";
	return baseUri;
}

/* 
	Downloads the content located at url and stores it at the relative path (with the root directory
	being the one that contains this file) that is dest.

	Inspired by https://github.com/axios/axios/issues/3971#issuecomment-1159556428.
*/
async function download(url: string, dest: string, cb: () => (void))
{
	let file = fs.createWriteStream(dest);
	file.on('finish', function() { file.close(cb); });	
	let {data} = await axios.get(url, {'responseType': 'stream'});
	data.pipe(file);
}

async function main(libraryDocumentId: string, debug: boolean)
{
	let baseUri = await getBaseUri();

	/* GET the values the user has entered into the document's fields. */
	let formFields = await axios.get(`${baseUri}/libraryDocuments/${libraryDocumentId}/formFields`, requestConfig);
	formFields = formFields.data;

	/* GET the PDF on which the custom form fields that the user field out were placed.*/
	let combinedDocumentUrl = await axios.get(`${baseUri}/libraryDocuments/${libraryDocumentId}/combinedDocument/url`,
		{ 'headers' : headersConfig, 'responseType' : 'blob' });
	combinedDocumentUrl = JSON.parse(combinedDocumentUrl.data).url;
	console.log(combinedDocumentUrl);

	// Save the PDF to the folder this script resides in.
	const savedFileName = 'combined_document.pdf';
	let cb = function() { console.log("Download completed."); };
	await download(combinedDocumentUrl, savedFileName, cb);

	/* If debugging, print the form fields and inspect the combined document PDF. */
	if (debug)
	{
		console.log(formFields);
		open(combinedDocumentUrl);	
	}

	/* POST the same document, but without any custom form fields. */
	// https://stackoverflow.com/questions/53038900/nodejs-axios-post-file-from-local-server-to-another-server
	// let form = new FormData();
	// form.append('combined_document', fs.createReadStream(savedFileName));
	// let config =
	// 	{
	// 		method: "post",
	// 		url: `${baseUri}/transientDocuments`,
	// 		'headers' : 
	// 		{
	// 			'Authorization' : `Bearer ${gmailBearerToken}`,
	// 			'Content-Type' : 'multipart/form-data',
	// 			'boundary' : form.getHeaders().boundary
	// 		},
	// 		data: form
	// 	};

	// let response = await axios(config);

	// "data: { code: 'NO_FILE_CONTENT', message: 'Must provide file body' }" is debug output produced by the above
	
	/* Use a PUT request to add the custom form fields and the values entered earlier to the document. */
	
	// TO-DO: PUT /libraryDocuments/{libraryDocumentId}/formFields
}

main("CBJCHBCAABAA7V0riaWVDHwrLaSkRddihs_aqME4QQuz", false);

