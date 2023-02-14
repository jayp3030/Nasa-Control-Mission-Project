const http = require('http');
const mongoose = require('mongoose');

const app = require('./app');

const { loadPlanets } = require('./models/planets.model');

const PORT = process.env.PORT || 8000;

const MONGO_URL = 'mongodb://0.0.0.0:27017/NASA-Control-Mission'; 

const server = http.createServer(app);

    mongoose.connection.once('open' , ()=>{
        console.log('MongoDB connection is ready')
    })

    mongoose.connection.on('error' , (err)=>{
        console.log(err);
    })

async function startServer() {

    mongoose.connect(MONGO_URL , {
        useNewUrlParser : true,
        useUnifiedTopology : true
    })
    await loadPlanets();

    server.listen(PORT, () => {
        console.log(`listening on port ${PORT}...`);
    })
}

startServer();

