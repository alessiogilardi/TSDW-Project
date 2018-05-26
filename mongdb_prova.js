var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";

var count = 0;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db('mydb');
  /*
  dbo.createCollection('customers', function(err, res) {
  	if (err) throw err;
  	console.log("Collection created!");
  	db.close();	
  });*/
/*
  var myobj = [
  	{ name: 'Chocolate Heaven'},
    { name: 'Tasty Lemon'},
    { name: 'Vanilla Dream'}
   ];

   dbo.collection('products').insertMany(myobj, function(err, res) {
   	if (err) throw err;
   	db.close();
   });
*/
   dbo.collection("customers").findOne({}, function(err, result) {
    if (err) throw err;
    console.log(result.address);
    db.close();
   });
});

function foo() {
	console.log('Th coount is: ' + count);
}