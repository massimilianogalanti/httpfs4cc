const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
// Directory from which files will be served (change 'PUBLIC_DIR' to your target folder)
const PUBLIC_DIR = '/var/www/html';

const server = http.createServer((req, res) => {
    console.log(req)

    // Only accept GET requests
    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Securely resolve the file path to prevent directory traversal attacks
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
            return;
        }

        const fileSize = stats.size;

        // Parse offset and len query parameters
        let offset = parseInt(query.offset, 10);
        let len = parseInt(query.len, 10);

        // Fallbacks/defaults if parameters are missing or invalid
        if (isNaN(offset) || offset < 0) {
            offset = 0;
        }
        if (isNaN(len) || len < 0) {
            len = fileSize - offset;
        }

        // Validate offset bounds
        if (offset >= fileSize) {
            res.writeHead(416, { 'Content-Type': 'text/plain' }); // Range Not Satisfiable
            res.end('416 Range Not Satisfiable');
            return;
        }

        // Calculate inclusive end byte for createReadStream
        let end = offset + len - 1;
        if (end >= fileSize) {
            end = fileSize - 1;
        }

        const chunkLength = end - offset + 1;

        // Respond with Partial Content (206)
        res.writeHead(206, {
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${offset}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkLength
        });

        // Stream the exact slice of the file
        const stream = fs.createReadStream(filePath, { start: offset, end: end });
        stream.on('error', (streamErr) => {
            console.error(streamErr);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });

        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
