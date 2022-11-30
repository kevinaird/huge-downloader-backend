# Huge Downloader Backend

NodeJS Express Route for the [https://github.com/kevinaird/huge-downloader](huge-downloader) client.

This route will create an endpoint that will be used for retrieving chunks of a large download by the 'huge-downloader` client.

`huge-downloader` is a node module designed to download large files in chunks and reassemble them into the original file once downloaded. It works with a companion module `huge-downloader-backend` which handles chunking the file on the backend.

HTTP and especially HTTP servers have limits and were not designed to transfer large files. In addition, network connection can be unreliable. No one wants an upload to fail after hours… Sometimes we even need to pause the upload, and HTTP doesn't allow that.

The best way to circumvent these issues is to chunk the file and send it in small pieces. If a chunk fails, no worries, it's small and fast to re-send it. Wanna pause? Ok, just start where you left off when ready.

That's what `huge-downloader` does. It:
* chunks the file in pieces of your chosen size (this occurs in `huge-downloader-backend`),
* retries to upload a given chunk when transfer failed,
* auto pauses transfer when device is offline and resumes it when back online,
* allows you to pause and resume the upload,
* obviously allows you to set custom headers and post parameters.

## Installation & usage
```javascript
npm install huge-downloader-backend --save
```

```javascript
const hugeDownloaderBackend = require("huge-downloader-backend");
const hugeDownloaderRoute = hugeDownloaderBackend({
    sandbox: "/path/to/downloadable/files"
});

// With An Express Server
const express = require("express");
const app = express();

app.get("/download", hugeDownloaderRoute);

// With An HTTP server
const http = require('http');
http.createServer((req, res) => {
    if (req.url === '/download' && req.method === 'GET') {
        return hugeDownloaderRoute(req, res);
    }
});

```

### Constructor settings object
The constructor takes a settings object. Available options are:
* `sandbox { String }` – path to a folder containing downloadable files (__required__)
* `defaultChunkSize { Number }` – default size of each chunk in MB (default is 10MB)


## How to set up the Client
This module has a twin [Node.js client module](https://github.com/kevinaird/huge-downlaoder) to handle downloads and reassembly of the chunks with a Node.js client.

