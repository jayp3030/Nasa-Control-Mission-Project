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

function existLaunchWithId(launchId){
    return launches.has(launchId);
}

async function getAllLaunches(){
    return await launchesDatabase.find({} , { '_id': 0 , '__v':0});
}

async function getLatestFlightNum(){
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function saveLaunch(launch){
    console.log(launch.target);
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

async function scheduleNewLaunch(launch){

    const newFlightNum = await getLatestFlightNum()+1;

    const newLauch = Object.assign(launch,{
        upcoming : true,
        success : true,
        customer : ['NASA'],
        flightNumber : newFlightNum,
    })

    await saveLaunch(newLauch);
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
    scheduleNewLaunch,
    abortLaunchById

}