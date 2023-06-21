const axios = require("axios");
const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const launches = new Map();

const DEFAULT_FLIGHT_NUMBER = 100;


const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateDB(){
    console.log('downloading data');
    const response =  await axios.post(SPACEX_API_URL , {
        query : {},
        options : {
            pagination : false,
            populate : [
                    {
                      path : 'rocket',
                      select : {
                        name : 1
                      }
                    },            
                    {
                        path : 'payloads',
                        select : {
                            customers:1
                        }
                    }
                ]
            }
    });

    if (response.status !== 200) {
        console.log('Problem while downloading data');
        throw new Error('Launch data downloading failed');
    }

    const launchDocs = response.data.docs;
    
    for(const launchDoc of launchDocs){
        
        const payloads = launchDoc.payloads;
        const customers = payloads.flatMap((payload) => {
            return payload.customers;
        })

        
        const launch = {
            flightNumber : launchDoc.flight_number,
            mission : launchDoc.name,
            rocket : launchDoc.rocket.name,
            launchDate : launchDoc.date_local,
            upcoming : launchDoc.upcoming,
            success : launchDoc.success,
            customers : customers
        }
        // console.log(launch);
        await saveLaunch(launch);
    }
}

async function loadLaunchesData(){
    const firstlaunnch = await findLaunch({
        flightNumber : 1,
        rocket : 'Falcon 1',
        mission : 'FalconSat'
    })

    if (firstlaunnch) {
        console.log('data already exist');
    }
    else{
        await populateDB();
    }
    
}

async function findLaunch(filter){
    return await launchesDatabase.findOne(filter);
}

async function existLaunchWithId(launchId){
    return await findLaunch({
        flightNumber : launchId,
    });
}

async function getAllLaunches(skip , limit){
    return await launchesDatabase.find({} , { '_id': 0 , '__v':0})
    .skip(skip)
    .limit(limit);
}

async function getLatestFlightNum(){
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function saveLaunch(launch){
    await launchesDatabase.findOneAndUpdate({
        flightNumber : launch.flightNumber,
    } , launch , {
        upsert : true,
    })
}

async function scheduleNewLaunch(launch){

    const planet = await planets.findOne({
        keplerName : launch.target,
    })

    if (!planet) {
        throw new Error('No matching planet found');
    }

    const newFlightNum = await getLatestFlightNum()+1;

    const newLauch = Object.assign(launch,{
        upcoming : true,
        success : true,
        customer : ['NASA'],
        flightNumber : newFlightNum,
    })

    await saveLaunch(newLauch);
}

async function abortLaunchById(launchId){

    const aborted =  await launchesDatabase.updateOne({
        flightNumber:launchId,
    },
    {
        upcoming : false,
        success : false
    });

    return aborted.ok === 1 && aborted.nModified === 1;

   
}

module.exports ={
    loadLaunchesData,
    existLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById
}