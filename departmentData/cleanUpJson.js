const fs = require('fs');
rootPath = "./departments/";

let ignoreRoomTerms = ["Arr","Remote","Unknown", "Off Ca", "To Be Det", "Future", "Coe", "Mai", "Squire", "Ec_Med", "Studen","Dorshe", "Clark"];

let allCourseJsonBase = [];
let activeThreads = 1;
fs.readdir(rootPath, (err, files) => {
  if (err)
    console.log(err);
  else {
    console.log("\nCurrent directory filenames:");
    files.forEach(file => {
		cleanUpJson(file);
    })
  }
  activeThreads--;
});



function cleanUpJson(filePath){
	activeThreads++;
	let fileData = fs.readFileSync(rootPath+filePath).toString();
	console.log(fileData.substring(0,200));
	let departmentJSon = JSON.parse(fileData);
	for(let key in departmentJSon){
		if(departmentJSon[key].total === 0) {
			delete departmentJSon[key];
			continue;
		}
		if(departmentJSon[key].total) {
			for(let i in departmentJSon[key].courses){
				allCourseJsonBase.push(departmentJSon[key].courses[i]);
				console.log(allCourseJsonBase[allCourseJsonBase.length-1]);
			}
		}else{
			allCourseJsonBase.push(departmentJSon[key]);
			console.log(allCourseJsonBase[allCourseJsonBase.length-1]);
		}
	}
	activeThreads--;
}

function outputData(){
	if(activeThreads){return setTimeout(outputData,500);}
	for(let i=0;i<allCourseJsonBase.length;i++){
	//	let removeEntry=false;
//		if(
		for(let j=0;j<ignoreRoomTerms.length;j++){
			if(allCourseJsonBase[i].room.toLowerCase().includes(ignoreRoomTerms[j].toLowerCase())){
				allCourseJsonBase.splice(i--,1);
			}
		}
	}
	fs.writeFileSync("allCourses.json",JSON.stringify(allCourseJsonBase));
	process.exit(0);
}

outputData();