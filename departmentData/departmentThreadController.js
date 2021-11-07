/*******************************************************************************
**	
**	Name: 			BIOS Version Controller
**
**	Author:			Misha Nelyubov
**
**	Description:	This software controls the execution of concurrent instances
**						of the powershell script "DellBiosOperator.ps1" to fetch
**						the latest available versions of the system BIOS update
**						for a list of Dell computer models
**
**	Date Created:	
**  Last Modified:	09/07/2021
**
**	Version:		0.3
**
**	Version History:
**		0.1: 
**		0.2: Added last check Unix timestamps to csv output to avoid redundant 
**			 	fetching of fresh data that is properly formatted
**		0.3: BIOS and TPM are both checked and exported to the same common set  
**			 	of csv file paths
**
**
**
*******************************************************************************/

"use strict";
//imports
const fs=require("fs");
const {spawn} = require("child_process");

//environment configuration
let operatingDirectoryRoot = process.argv[1].substring(0,process.argv[1].lastIndexOf("\\"));

//inputs
const CheckingScriptRoot = operatingDirectoryRoot+"\\DellBiosOperator.ps1";
const modelsToCheck = operatingDirectoryRoot+"\\biosVersions.csv";

//outputs
const outputCSVfilePathList = [
							operatingDirectoryRoot+"\\dellBiosVersions.csv",
							"\\\\telesto\\Automated_Apps\\SENS-Students\\dellBiosVersions.csv"
							];

const intermediateSavePath = operatingDirectoryRoot+"\\tempDellBiosVersions.csv";

//internal values
const MAX_RETRIES = 3;
const MAX_CONCURRENT_THREADS = 5;
const THRESHHOLD_RESCAN_TIME = 1000 * 60 * 60 * 5;	//don't rescan a model if you just got a good answer from it within the past 5 hours
const startingMark = "[Start]\r\n";


let newBiosVersionsDetected = 0;
let newTpmVersionsDetected = 0;
let activeThreadCount = 0;
let totalActivatedThreads = 0;
let totalResolvedThreads = 0;


//initialize colored console outputs
const consolePrintMapping = {
	Reset :     '%s\x1b[0m',
	Bright : 	'\x1b[1m',
	Underscore: '\x1b[4m',
	Blink : 	'\x1b[5m',
	Reverse : 	'\x1b[7m',
	Hidden : 	'\x1b[8m',
	FgBlack : 	"\x1b[30m",
	FgRed : 	'\x1b[31m',
	FgGreen : 	'\x1b[32m',
	FgYellow :	'\x1b[33m',
	FgCyan : 	'\x1b[36m',
	FgWhite : 	'\x1b[37m',
	BgBlack : 	'\x1b[40m',
	BgRed : 	'\x1b[41m',
	BgGreen : 	'\x1b[42m',
	BgYellow : 	'\x1b[43m',
	BgBlue : 	'\x1b[44m',
	BgMagenta :	'\x1b[45m',
	BgCyan : 	'\x1b[46m',
	BgWhite : 	'\x1b[47m',
}

function STDOUT (data){
	console.log(data);
}

function STDOUT_B (data){								//background Data
	console.log(consolePrintMapping["FgWhite"] + consolePrintMapping["Reset"], data); 
}
//STDOUT_B("Test B");

function STDOUT_G (data){								//normal operational result
	console.log(consolePrintMapping["FgGreen"] + consolePrintMapping["Reset"], data); 
}
//STDOUT_G("Test G");

function STDOUT_Y (data){								//Alerts / Attention
	console.log(consolePrintMapping["Bright"] + consolePrintMapping["Reset"], data);
}
//STDOUT_Y("Test Y");

function STDOUT_R (data){								//Critical
	console.log(consolePrintMapping["BgRed"] + consolePrintMapping["Bright"] + consolePrintMapping["Reset"], data);
}
//STDOUT_R("Test R");

function STDERR(data){STDOUT_R(data);}




let modelsToCheckContents = fs.readFileSync(modelsToCheck).toString().split("\r\n");
let previousModelData = fs.readFileSync(outputCSVfilePathList[0]).toString().split("\r\n");

let fields = modelsToCheckContents[0].split(",");
let previousFields = previousModelData[0].split(",");
let BIOStoCheckArray = [ ];
let outputTable = { };

//trim whitespace
for(let i in fields){fields[i] = fields[i].trim();}
for(let i in previousFields){previousFields[i] = previousFields[i].trim();}

//convert 2D array to array of objects
for(let i=1; i<modelsToCheckContents.length;i++){
	let checkParameters = { };
	let entryFields = modelsToCheckContents[i].split(",");
	
	//allows empty newlines in csv
	if(entryFields.length !== fields.length){
		console.log(`Expected commas at line ${i}: ${fields.length}.  Found commas at line ${i}: ${entryFields.length}. Skipping entry.`);
		continue;
	}
	
	for(let j in entryFields){
		//structure data and trim whitespace
		checkParameters[fields[j]] = entryFields[j].trim();
	}
	
	BIOStoCheckArray.push(checkParameters);
	let outputKey = checkParameters.series + " " + checkParameters.model;
	
	outputTable[outputKey] = {
		previous: { }
	};
}

//populate previous data
//convert previous fields 2D array to array of objects and populate into output table
for(let i=1; i<previousModelData.length; i++){
	let previousProperties = { };
	let previousObjectData = previousModelData[i].split(",");
	
	//allows empty newlines in csv
	if(previousObjectData.length !== previousFields.length){
		console.log(`Expected commas at line ${i}: ${previousFields.length}.  Found commas at line ${i}: ${previousObjectData.length}. Skipping entry.`);
		continue;
	}
	
	for (let j in previousFields) {
		previousProperties[previousFields[j]] = previousObjectData[j].trim();
	}
	
	//if the same model is to be sought out again, populate its "previous" property with the csv data
	if(previousObjectData[0] in outputTable) {
		outputTable[previousObjectData[0]].previous = previousProperties;
		//console.log(`Initialized previous properties for ${previousObjectData[0]}: ${JSON.stringify(previousProperties)}`);
	}
}




console.log("Processed JSON string:");
console.log(JSON.stringify(BIOStoCheckArray));


for(let i in BIOStoCheckArray){
	processBIOSofModel(i,MAX_RETRIES);
}



function getActiveThreadKeys(){
	let remains = [];
	for(let key in outputTable){
		if(!outputTable[key].resolved){
			remains.push(key);
		}
	}
	return remains;
}


//written as a separate function to allow for potential recursion
function processBIOSofModel(i,retryCount){
	if(activeThreadCount >= MAX_CONCURRENT_THREADS){
		return setTimeout(() => {processBIOSofModel(i,retryCount);},125);
	}
	
	activeThreadCount++;
	let testParameters = "";
	let testBIOS = BIOStoCheckArray[i];
	let outputKey = testBIOS.series + " " + testBIOS.model;

	if (outputTable[outputKey].previous 					//make sure that the previous object exists
		&& outputTable[outputKey].previous.exitCode == 0 	//make sure that the previous object cleanly exited
		&& outputTable[outputKey].previous.exitTime			//make sure that the previous object has an exit time
		&& (Date.now() - outputTable[outputKey].previous.exitTime) < THRESHHOLD_RESCAN_TIME){	//make sure that the previous object is fresh
		
		//if the previous record is good, rely on it instead of rescanning
		outputTable[outputKey].biosVersion = outputTable[outputKey].previous.BiosVersion;
		outputTable[outputKey].TpmVersion  = outputTable[outputKey].previous.TpmVersion;
		
		outputTable[outputKey].exitCode =    outputTable[outputKey].previous.exitCode;
		outputTable[outputKey].exitTime =    outputTable[outputKey].previous.exitTime;
		
		outputTable[outputKey].BiosDownload = outputTable[outputKey].previous.BiosDownload;
		outputTable[outputKey].TpmDownload  = outputTable[outputKey].previous.TpmDownload;
		
		outputTable[outputKey].BiosSHA = outputTable[outputKey].previous.BiosSHA;
		outputTable[outputKey].TpmSHA  = outputTable[outputKey].previous.TpmSHA;
		
		outputTable[outputKey].resolved = true;
		STDOUT_G(`  Reusing Data:  Latest BIOS for the ${outputKey}: ${outputTable[outputKey].biosVersion}. \tLatest TPM Version: ${outputTable[outputKey].TpmVersion}. \tExit code: ${outputTable[outputKey].exitCode}`);
		activeThreadCount--;
		totalResolvedThreads++;
		return;
	}
	
	for (let key in testBIOS) {
		testParameters += `-${key} "${testBIOS[key]}" `;
	}

	
	let biosVersionThread = spawn("powershell.exe", [CheckingScriptRoot, testParameters]);
	STDOUT_B(`Creating powershell process: powershell.exe ${CheckingScriptRoot} ${testParameters}`);
	totalActivatedThreads++;
	
	//STDOUT
	biosVersionThread.stdout.on("data", (data) => {
		if(outputTable[outputKey].STDOUT){
			outputTable[outputKey].STDOUT += "\n" + data;
		}else{
			outputTable[outputKey].STDOUT = data;
		}
		
		//console.log(`STDOUT from ${outputKey}: ${data}`);
	});
	
	//STDERR
	biosVersionThread.stderr.on("data", (data) => {
		if(outputTable[outputKey].STDERR){
			outputTable[outputKey].STDERR += "\n" + data;
		}else{
			outputTable[outputKey].STDERR = data;
		}
		//console.log(`STDERR from ${outputKey}: ${data}`);
	});
	
	//Exit
	biosVersionThread.on("exit", (code) => {
		
		//if no standard output is detected, this means that something went wrong.  Print all standard error output.  Otherwise, trim the standard output to start at the starting mark.
		if(outputTable[outputKey].STDOUT){
			outputTable[outputKey].STDOUT = outputTable[outputKey].STDOUT.substring(outputTable[outputKey].STDOUT.indexOf(startingMark)+startingMark.length);
		}else{
			STDERR(`The script for checking on the data for the ${outputKey} did not produce any Standard Output`);
			STDERR(`Standard Error from script checking ${outputKey}:\r\n${outputTable[outputKey].STDERR}`);
		}
		
		outputTable[outputKey].exitCode = code;
		outputTable[outputKey].exitTime = Date.now();
		
		//remove all resets
		while(outputTable[outputKey].STDOUT.includes("\r")){
			outputTable[outputKey].STDOUT = outputTable[outputKey].STDOUT.replace("\r","");
		}
		
		let BiosVersionFlag = "BIOS: ";
		let TpmVersionFlag  = "TPM: ";
		
		let BiosDownloadFlag = "biosDownload: ";
		let TpmDownloadFlag = "tpmDownload: ";
		
		let BiosShaFlag = "BiosSHA: ";
		let TpmShaFlag = "TpmSHA: ";
		
		let newBiosFlag = " !NEW BIOS! ";
		let newTpmFlag  = " !NEW  TPM! ";
		
		let outputString = "";
		let outputFunction = STDOUT_Y;
		
		let outputVersionData = outputTable[outputKey].STDOUT.split("\n");
		for(let i in outputVersionData){
			let ovDatum = outputVersionData[i];
			//handle adding bios version to computer model object
			if(ovDatum.includes(BiosVersionFlag)){
				outputTable[outputKey].biosVersion = ovDatum.replace(BiosVersionFlag,"").trim();
				if(outputTable[outputKey].biosVersion !== outputTable[outputKey].previous.BiosVersion){
					newBiosVersionsDetected++;
					outputString+=newBiosFlag;
					outputFunction = STDOUT_R;
				}
			}
			
			//handle adding tpm version to computer model object
			if(ovDatum.includes(TpmVersionFlag)){
				outputTable[outputKey].TpmVersion = ovDatum.replace(TpmVersionFlag,"").trim();	
				if(outputTable[outputKey].TpmVersion !== outputTable[outputKey].previous.TpmVersion){
					newTpmVersionsDetected++;
					outputString+=newTpmFlag;
					outputFunction = STDOUT_R;
				}
			}
			
			//handle adding bios download URL to computer model object
			if(ovDatum.includes(BiosDownloadFlag)){
				outputTable[outputKey].BiosDownload = ovDatum.replace(BiosDownloadFlag,"").trim();
			}
			
			//handle adding tpm download URL to computer model Object
			if(ovDatum.includes(TpmDownloadFlag)){
				outputTable[outputKey].TpmDownload = ovDatum.replace(TpmDownloadFlag,"").trim();
			}
			
			//handle adding bios SHA to computer model Object
			if(ovDatum.includes(BiosShaFlag)){
				outputTable[outputKey].BiosSHA = ovDatum.replace(BiosShaFlag,"").trim();
			}
			
			//handle adding tpm SHA to computer model Object
			if(ovDatum.includes(TpmShaFlag)){
				outputTable[outputKey].TpmSHA = ovDatum.replace(TpmShaFlag,"").trim();
			}
		}
		
		
		outputString += `Latest BIOS for the ${outputKey}: ${outputTable[outputKey].biosVersion}.  Latest TPM Version: ${outputTable[outputKey].TpmVersion}.  Exit code: ${outputTable[outputKey].exitCode}`;
		outputFunction(outputString);

		outputTable[outputKey].resolved = true;
		activeThreadCount--;
		totalResolvedThreads++;
	});

}



//todo: refractor
let remainsTracker = setInterval(() => {
	let remains = getActiveThreadKeys();
	//refresh every second but only print every 10 seconds
	let csvString = generateOutputCsv();

	if(activeThreadCount){
		if((new Date).getSeconds() %15 === 0){
			STDOUT_G(`Awaiting on ${remains.length} models (${activeThreadCount} active):  ${remains.join(", ")}`);
			fs.writeFileSync(intermediateSavePath,csvString);
		}
	}else{
		
		for(let thread in outputTable){
			if(outputTable[thread].STDERR){
				//console.log(`std err data from thread ${thread}:`)
				//console.error(outputTable[thread].STDERR.toString());
			}
		}
		
		//output CSV to all necessary location
		for(let i in outputCSVfilePathList){
			fs.writeFileSync(outputCSVfilePathList[i],csvString);
		}
		
		console.log(`New BIOS versions detected: ${newBiosVersionsDetected}`);
		console.log(`New TPM versions detected: ${newTpmVersionsDetected}`);
		console.log(`Active Thread Count: ${activeThreadCount}`);
		console.log(`Total Resolved Threads: ${totalResolvedThreads}`);
		console.log(`Total Activated Threads: ${totalActivatedThreads}`);
		
		//console.log("JSON Object:");
		//console.log(JSON.stringify(outputTable));
		
		let exitCode = 0;
		if(totalActivatedThreads != totalResolvedThreads) 	exitCode = exitCode | 0x1;	//multiple threads started for a single model
		if(activeThreadCount != 0) 							exitCode = exitCode | 0x2;	//not all active threads were resolved before end of run
		if(newBiosVersionsDetected != 0)					exitCode = exitCode | 0x4;	//new versions of some BIOS were detected
		if(newTpmVersionsDetected != 0)						exitCode = exitCode | 0x8;	//new versions of some TPM Firmware were detected
		setTimeout(() =>{console.log("exiting...");process.exit(exitCode);},500);
	}
},1000);



function generateOutputCsv(){
	let nL = "\r\n";														//universal newline reference
	let csvString = "Model,BiosVersion,TpmVersion,BiosDownload,TpmDownload,BiosSHA,TpmSHA,exitCode,exitTime" + nL;	//csv data structure header
	
	for(let thread in outputTable){
		csvString += thread + ",";								//Model
		csvString += outputTable[thread].biosVersion + ",";		//BIOS Version
		csvString += outputTable[thread].TpmVersion + ",";		//TPM Version
		
		csvString += outputTable[thread].BiosDownload + ",";	//BIOS Download
		csvString += outputTable[thread].TpmDownload+ ",";		//TPM Download
		
		csvString += outputTable[thread].BiosSHA + ",";			//BIOS SHA
		csvString += outputTable[thread].TpmSHA+ ",";			//TPM SHA
		
		if(outputTable[thread].exitCode == 0 || (outputTable[thread].previous !== 0)) {	//Successful query => update data.  If previous attempt did not have an exit code of 0, don't use it
			csvString += outputTable[thread].exitCode + ",";	//Exit code (valid format)
			csvString += outputTable[thread].exitTime;			//Last checked
		}else{
			csvString += outputTable[thread].previous.exitCode + ",";	//Exit code (valid format)
			csvString += outputTable[thread].previous.exitTime;			//Last checked
		}
		csvString += nL;										//end of object newline
	}
	
	//remove consecutive new lines
	while(csvString.includes(nL+nL)){
		csvString = csvString.replace(nL+nL,nL);
	}
	
	return csvString;
}