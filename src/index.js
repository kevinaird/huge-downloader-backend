'use strict'

const fs = require("fs");

module.exports = params => {
    const sandbox = params.sandbox;
    const defaultChunkSize = params.defaultChunkSize || (10 * 1024 * 1024);

    if(!sandbox) throw new Error("[huge-downloader] sandbox is required");

    return async function (req, res) {
        try {
            if(!req.query.file || typeof req.query.file != "string") 
                throw new Error("file is required");

            const fullPath = path.join(sandbox,req.query.file);
            const chunkSize = req.query.chunkSize?parseInt(req.query.chunkSize):defaultChunkSize;

            console.log("[huge-downloader] Getting file stats for requested chunk download",fullPath);
            const stats = await fs.promises.stat(fullPath);
            const totalChunks = Math.ceil(stats.size / chunkSize);

            console.log("[huge-downloader] totalChunks=",totalChunks,"fileSize=",stats.size,"chunkSize=",chunkSize);
            if(req.query.meta) {    
                return res.apiResponse({ 
                    chunkSize,
                    totalChunks,
                    stats
                });
            }
            
            if(req.query.chunk) {
                const chunkIndex = parseInt(req.query.chunk);
                console.log("[huge-downloader] requesting chunk",chunkIndex,"of",totalChunks-1,"for file",fullPath,"at size",chunkSize);

                if(isNaN(chunkIndex)) throw new Error("chunk is invalid");
                let chunk = Buffer.alloc(chunkSize);

                console.log("[huge-downloader] opening",fullPath);
                const fd = await new Promise((resolve,reject)=>{
                    fs.open(fullPath,'r',(err,fd)=>{
                        if(err) return reject(err);
                        return resolve(fd);
                    });
                });
                
                console.log("[huge-downloader] reading fd",fd,"for chunk",req.query.chunk,"of",fullPath);
                const nread = await new Promise((resolve,reject)=>{
                    
                    fs.read(fd,chunk,0,chunkSize,chunkIndex*chunkSize,(err,nread)=>{
                        if(err) return reject(err);
                        return resolve(nread);
                    })
                });

                console.log("[huge-downloader] closing",fd,"for",fullPath);
                await new Promise((resolve,reject)=>
                    fs.close(fd,err=>err?reject(err):resolve())
                );

                let data = chunk;
                if(nread<chunkSize)
                    data = chunk.slice(0,nread);

                console.log("[huge-downloader] responding with",nread,"bytes for",fullPath);
                res.writeHead(200, [
                    ['Content-Type', 'application/octet-stream'],
                    ['X-Nread',nread]
                ]);
                res.end(Buffer.from(data, 'base64'));
                chunk = null; data = null;

                console.log("[huge-downloader] responded with",nread,"bytes for",fullPath);
                return;
            }
            
            return res.apiError("Must specify chunk or meta");
        }
        catch(err) {
            console.error("[huge-downloader] Error",err);
            return res.apiError("Error", err);
        }
    };
 };