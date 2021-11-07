const request = require('request');
const fs = require('fs');
var path = require('path'); 



let options = {
	url: '',
	json: true,
	method: 'GET',
	headers: {
    'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiVGVzdGluZyBUb2tlbiIsImdyb3VwIjoiSU1DIiwidXNlciI6IjVmYzY3OTlmZjM0MzllMDAxMjBkMmUxNCIsImRvbWFpbiI6WyIqIl0sInBlcm1pc3Npb25zIjpbImNhdGFsb2ciLCJzY2hlZHVsZSIsImJ1aWxkaW5ncyIsIm5scCJdLCJ0b2tlbl9pZCI6IjVmYzY4MDQ3YWU0ODFjMDAxMmU5ZDA4NCIsImlhdCI6MTYwNjg0NDQ4N30.EWQyQ-4f32zmjCC0IuhnjPAniOAyQnoE52vcHrur1yY"
  }
};

let courses = {};

let dpt = process.argv[2];
console.log("Investigating department: ", dpt);
let fileOutputPath = "./departments/_"+dpt+".json";

try{
	if(fs.statSync(fileOutputPath)) {
		console.log('File exists\r\n');
		process.exit(1);
	}
}catch {}


let pendingRequests = 0;

for(let num = 101; num<500; num++){
	console.log(`Requesting ${dpt} ${num}`);
	pendingRequests++;
	options.url = `https://imc-apis.webapps.buffalo.edu/schedule/courses/spring?abbr=${dpt}&num=${num}`;
	
	console.log("Requesting: ", options);
	
	request(options, function (error, response, body) {
		if(error) console.error('error:', error);
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		if(response && response.statusCode){
			courses[dpt + num] = body;
			pendingRequests--;
		}
		console.log('body:', body);
	});

}


function logJsonExit(){
	if(pendingRequests){
		return setTimeout(logJsonExit,500);
	}
	fs.writeFileSync(fileOutputPath, JSON.stringify(courses));
	process.exit(0);
}


logJsonExit();