const express = require('express');
const app = express();
const path = require(`path`);
const bodyParser = require('body-parser');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.enable('trust proxy');

const BOAT = "boat"
const LOAD = "load"
var address = "";
let date= new Date();

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
	
}



/* ------------- Begin Boat Model Functions ------------- */
function post_Boat(name, type, length){
    var key = datastore.key(BOAT);
	const new_Boat = {"name": name, "type": type, "length": length};
	return datastore.save({"key":key, "data":new_Boat}).then(() => {return key});
}

async function get_Boat(key){
	var [boat] = await datastore.get(key);
	if(boat == null){
		return null;
	}
	boat.id = key.id;
	boat = boatSelf(boat);
	return boat;
}

async function delete_Boat(id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
	var [boat] = await datastore.get(key);
    return datastore.delete(key);
}

function patch_Boat(id,name, type, length){
    const key = datastore.key([BOAT, parseInt(id,10)]);
	var [boat] = await datastore.get(key);
	if(name){
		boat.name = name;
	}
	if(type){
		boat.type = type;
	}
	if(length){
		boat.length = length;
	}
	return datastore.update({"key":key, "data":boat}).then(() => {return key});
}

function update_Boat(id,name, type, length){
    const key = datastore.key([BOAT, parseInt(id,10)]);
	const new_Boat = {"name": name, "type": type, "length": length};
	return datastore.update({"key":key, "data":new_Boat}).then(() => {return key});
}

function boatSelf(item){
	 item.self = address +"/boats/" + item.id;
	 return item;
}

function verifyName(name){
	const q = datastore.createQuery(BOAT);
	entities = await datastore.runQuery(q);
	boats = entities[0];
	foundName = false;
	boats.forEach(function(boat) {
		if(boat.name == name){
			uniqueName = true;
		}
	});
	return uniqueName;
}

/* ------------- End Boat Model Functions ------------- */


/* ------------- Boat Routes -------------------------- */

app.post('/boats', async (req, res) => {
	address = req.protocol + req.get("host");
	contentType = req.header('Content-type');
	if(contentType != "application/json"){
		error = {"Error": "only json accepted"}
		res.status(415).send(error);
		return;
	}
	acceptType = req.header('Accept');
	if(acceptType != "application/json"){
		error = {"Error": "only json returned"}
		res.status(406).send(error);
		return;
	}
	if(!req.body.name || !req.body.type || !req.body.length){
		error = {"Error": "The request object is missing at least one of the required attributes"}
		res.status(400).send(error);
		return;
	}
	if(verifyName(req.body.name)){
		error = {"Error": "The name is not unique"}
		res.status(403).send(error);
		return;
	}
	if(isNaN(req.body.length)){
		error = {"Error": "The length attribute is not a number"}
		res.status(400).send(error);
		return;
	}
	if(req.body.name.length > 30){
		error = {"Error": "Name to long"}
		res.status(400).send(error);
		return;
	}
	if(req.body.type.length > 30){
		error = {"Error": "Type to long"}
		res.status(400).send(error);
		return;
	}
	else{
	post_Boat(req.body.name, req.body.type, req.body.length)
    .then( key => {get_Boat(key).then(data => {res.status(201).send(data)});
		});
	}
});

app.delete('/boats/:id', async (req, res) => {
	address = req.protocol + req.get("host");
	const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
	boat = await get_Boat(key);
	if(boat == null){
		error = {"Error": "No boat with this boat_id exists"  }
		res.status(404).send(error);
		return;
	}
	else{
		delete_Boat(req.params.id).then(res.status(204).end());
	}
});

app.put('/boats/:id', async (req, res) => {
	address = req.protocol + req.get("host");
	contentType = req.header('Content-type');
	if(contentType != "application/json"){
		error = {"Error": "only json accepted"}
		res.status(415).send(error);
		return;
	}
	acceptType = req.header('Accept');
	if(acceptType != "application/json"){
		error = {"Error": "only json returned"}
		res.status(406).send(error);
		return;
	}
	if(!req.body.name || !req.body.type || !req.body.length){
		error = {"Error": "The request object is missing at least one of the required attributes"}
		res.status(400).send(error);
		return;
	}
	if(verifyName(req.body.name)){
		error = {"Error": "The name is not unique"}
		res.status(403).send(error);
		return;
	}
	if(isNaN(req.body.length)){
		error = {"Error": "The length attribute is not a number"}
		res.status(400).send(error);
		return;
	}
	if(req.body.name.length > 30){
		error = {"Error": "Name to long"}
		res.status(400).send(error);
		return;
	}
	if(req.body.type.length > 30){
		error = {"Error": "Type to long"}
		res.status(400).send(error);
		return;
	}
	else{
		const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
		boat = await get_Boat(key);
		if(boat == null){
			error = {"Error": "No boat with this boat_id exists"}
			res.status(404).send(error);
			return;
		}else{
			await update_Boat(req.params.id,req.body.name, req.body.type, req.body.length);
			boat = await get_Boat(key);
			res.set("Location", boat.self);
			res.status(303).end();
			
			});
		}
	}
});

app.patch('/boats/:id', async (req, res) => {
	address = req.protocol + req.get("host");
	contentType = req.header('Content-type');
	if(contentType != "application/json"){
		error = {"Error": "only json accepted"}
		res.status(415).send(error);
		return;
	}
	acceptType = req.header('Accept');
	if(acceptType != "application/json"){
		error = {"Error": "only json returned"}
		res.status(406).send(error);
		return;
	}
	if(!req.body.name && !req.body.type && !req.body.length){
		error = {"Error": "The request object has no boat values to change"}
		res.status(400).send(error);
		return;
	}
	if(req.body.name){
		if(verifyName(req.body.name)){
			error = {"Error": "The name is not unique"}
			res.status(403).send(error);
			return;
		}
	}
	if(req.body.length){
		if(isNaN(req.body.length)){
			error = {"Error": "The length attribute is not a number"}
			res.status(400).send(error);
			return;
		}
	}
	if(req.body.name){
		if(req.body.name.length > 30){
			error = {"Error": "Name to long"}
			res.status(400).send(error);
			return;
		}
	}
	if(req.body.type){
		if(req.body.type.length > 30){
			error = {"Error": "Type to long"}
			res.status(400).send(error);
			return;
		}
	}
	const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
	boat = await get_Boat(key);
	if(boat == null){
		error = {"Error": "No boat with this boat_id exists"}
		res.status(404).send(error);
		return;
	}else{
		patch_Boat(req.params.id,req.body.name, req.body.type, req.body.length).then(key => {get_Boat(key).then(data => {res.status(200).send(data)});
		});
	}
	
});

app.get('/boats/:id', async (req, res) => {
	address = req.protocol + req.get("host");
	acceptType = req.header('Accept');
	if(acceptType != "application/json" && acceptType != "text/html"){
		error = {"Error": "only json or html returned"}
		res.status(406).send(error);
		return;
	}
	const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
	boat = await get_Boat(key);
	if(boat == null){
		error = {"Error": "No boat with this boat_id exists"  }
		res.status(404).send(error);
		return;
	}else if(acceptType=="application/json"){
		res.status(200).send(boat);
	}else{
		output = "<ul><li>Name: " + boat.name + "</li><li>Type: " + boat.type + "</li><li>Length: " + boat.length + "</li></ul>";
		res.status(200).send(output);	
	}
	
});

app.delete('/boats', async (req, res) => {
	res.status(405).end();	
});

app.put('/boats', async (req, res) => {
	res.status(405).end();	
});

app.patch('/boats', async (req, res) => {
	res.status(405).end();	
});



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
var server = app.listen(PORT, () => {
});