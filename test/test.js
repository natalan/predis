var assert = require('assert');
var predis = require('../predis');

describe("client", function(){
	var client = predis.createClient();

	it("#set('key', 'value') should be 'OK'", function(done){
		client.set("key", "value")
			.then(function(result){
				assert.equal(result, 'OK');
				done();
			})
			.then(reject);
	});

	it("#get('key') shoule be 'value'", function(done){
		client.get("key")
			.then(function(result){
				assert.equal(result, 'value');
				done();
			})
			.then(reject);	
	});

	//client.quit();
});

function reject(error){
	assert(false, error && error.toString());
}
