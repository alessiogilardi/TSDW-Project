var db = require('./db-connect').connect()
const queries = require('./queries')
/*
queries.Mission.update({_id: "5bc19aa57b92062afcafa30b"}, {date: new Date})
.then(() => console.log('Query eseguita'))
.catch(err => console.log('Query fallita'))
*/

//queries.Mission.Pilot.setAsNotified("5bc19aa57b92062afcafa30b", "5bbe535d2652152130333947")
queries.Mission.Pilot.setAsAccepted("5bc19aa57b92062afcafa30b", "5bbe535d2652152130333947", new Date("2018-11-07T13:47:24.55Z"))
.then(() => console.log("Query eseguita"))
.catch(() => console.log("Query non eseguita"))