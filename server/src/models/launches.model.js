const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const launches = new Map();

const DEFAULT_FLIGHT_NUMBER = 100;

const launch = {
    flightNumber : 100,
    mission : 'Kepler Exploration X',
    rocket : 'Exploration IS1',
    launchDate : new Date('January 31,2030'),
    target : 'Kepler-442 b',
    customers :['NASA' , 'SpaceX'],
    upcoming:true,
    success:true,

}

saveLaunch(launch);

// launches.set(launch.flightNumber , launch);

function existLaunchWithId(launchId){
    return launches.has(launchId);
}

async function getAllLaunches(){
    return await launchesDatabase.find({} , { '_id': 0 , '__v':0});
}

async function getLatestFlighNum(){
    const latestLaunch = await launches.findOne().sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function saveLaunch(launch){

    const planet = await planets.findOne({
        keplerName : launch.target,
    })

    if (!planet) {
        throw new Error('No matching planet found');
    }

    await launchesDatabase.updateOne({
        flightNumber : launch.flightNumber,
    } , launch , {
        upsert : true,
    })
}

function addNewLaunch(launch){

    latestFlightNumber++;
    launches.set(latestFlightNumber, Object.assign(launch , {

        flightNumber : latestFlightNumber,
        customer : ['NASA' , 'SpaceX'],
        upcoming : true,
        success : true
    }));
}

function abortLaunchById(launchId){
    const aborted = launches.get(launchId);
    aborted.upcoming = false;
    aborted.success =false;

    return aborted;
}

module.exports ={
    existLaunchWithId,
    getAllLaunches,
    addNewLaunch,
    abortLaunchById

}