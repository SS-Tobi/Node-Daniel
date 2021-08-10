//mongodb+srv://db:teamOxioRocks@mean-test-2gucu.mongodb.net/test?retryWrites=true&w=majority

const http = require("http");

const app = require("./backend/app");

const server = http.createServer(app);

server.listen(3000,()=>{
    console.log("listening");
});



