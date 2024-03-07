function getUserInput() {
    const jobType = document.getElementById('jobType').value;
    const arrivalInput = document.getElementById('arrivalInput').value;
    const burstInput = document.getElementById('burstInput').value;
    const numOfCPUs = document.getElementById('numOfCPUs').value;

    // Parse arrival and burst times as arrays
    const arrivalTimes = arrivalInput.split(' ').map(Number);
    const burstTimes = burstInput.split(' ').map(Number);

    // Validate input lengths
    if (arrivalTimes.length !== burstTimes.length) {
        alert('Number of arrival times must match the number of burst times.');
        return null;
    }

    // Create jobs array
    const jobs = [];
    for (let i = 0; i < arrivalTimes.length; i++) {
        const process = `P${i + 1}`;
        jobs.push({ process, arrivalTime: arrivalTimes[i], burstTime: burstTimes[i] });
    }

    return { jobs, jobType, numOfCPUs };
}

function displayResult(jobsData) {

  totalTurnaroundTime = 0
  // Display the result in the table
  const table = document.getElementById('jobTable');
  table.innerHTML = `
      <tr>
          <th>Process</th>
          <th>Arrival Time</th>
          <th>Burst Time</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Turn Around Time</th>
      </tr>
  `;

  for (let i = 0; i < jobsData.length; i++) {
      const job = jobsData[i];
      for(let j=0;j<job.length;j++)
      {
        totalTurnaroundTime+=job[j].turnaroundTime;
        const row = table.insertRow();
        row.innerHTML = `
            <td>${job[j].process}</td>
            <td>${job[j].arrivalTime}</td>
            <td>${job[j].burstTime}</td>
            <td>${job[j].startTime}</td>
            <td>${job[j].endTime}</td>
            <td>${job[j].turnaroundTime}</td>
        `;
      }
  }
  return totalTurnaroundTime;

}

function scheduleJobs() {
    const userInput = getUserInput();
  
    if (userInput) {
      const { jobs, jobType, numOfCPUs } = userInput;

      ({ jobsData, jobQueue } = ScheduleJobs(jobType, jobs, numOfCPUs));
      
      // Display the result
      totalTurnaroundTime=displayResult(jobsData);
      
      displaychart(jobsData)
  
      let avg = document.getElementById("avgtr");
      const avgTATime = totalTurnaroundTime/jobs.length;
  
      avg.innerText = "Average Turn Around time is " + avgTATime;

      jobQueues(jobQueue);

    }
}

function jobQueues(jobQueue)
{
  
  const table = document.getElementById('queueTable');
  table.innerHTML = `
      <tr>
          <th>Time</th>
          <th>Jobs</th>
      </tr>
  `;

  for (let i = 0; i < jobQueue.length; i++) {
    const job = jobQueue[i];
    for(let obj in job)
    {
      const row = table.insertRow();
      row.innerHTML = `
          <td>${obj.split(' ')}</td>
          <td>${job[obj]}</td>
      `;
    }
}



}

function fcfsScheduleJobs(jobs, numOfCPUs) {
    // Sort jobs based on arrival time
    jobs.sort((a, b) => a.arrivalTime - b.arrivalTime);
  
    // Initialize CPUs array with empty objects
    const CPUs = Array.from({ length: numOfCPUs }, () => ({
      finishTime: [],
      startTime: [],
      endTime: [],
      turnAroundTime: [],
      arrivalTime:[],
      burstTime:[]
    }));
  
   
    let currentTime = 0;
  
    for (let i = 0; i < jobs.length; i++) {
      const currentCPU = i % numOfCPUs;
      const finishTime = CPUs[currentCPU].finishTime;
  
      if (finishTime.length === 0 || jobs[i].arrivalTime > finishTime[finishTime.length - 1]) {
        // If the job arrives after the previous job finishes, start immediately
        CPUs[currentCPU].startTime.push(jobs[i].arrivalTime);
      } else {
        // If the job arrives before the previous job finishes, wait until the previous job finishes
        CPUs[currentCPU].startTime.push(finishTime[finishTime.length - 1]);
      }
  
      // Calculate end time and turn around time
      CPUs[currentCPU].endTime.push(CPUs[currentCPU].startTime[CPUs[currentCPU].startTime.length - 1] + jobs[i].burstTime);
      CPUs[currentCPU].turnAroundTime.push(CPUs[currentCPU].endTime[CPUs[currentCPU].endTime.length - 1] - jobs[i].arrivalTime);
  
      // Update currentTime for the next iteration
      currentTime = CPUs[currentCPU].endTime[CPUs[currentCPU].endTime.length - 1];
      finishTime.push(currentTime);
    }
  
    // Combine the results from all CPUs
    const startTime = CPUs.reduce((result, cpu) => result.concat(cpu.startTime), []);
    const endTime = CPUs.reduce((result, cpu) => result.concat(cpu.endTime), []);
    const turnAroundTime = CPUs.reduce((result, cpu) => result.concat(cpu.turnAroundTime), []);
    
    // Calculate total burst time
    const totalBurstTime = CPUs.reduce(
      (sum, cpu) => sum + cpu.endTime[cpu.endTime.length - 1],
      0
    );
  
     return { startTime, endTime, turnAroundTime };
}
  
function sjfScheduleJobs(processesInfo, numOfCPUs) {
    // Sort jobs based on arrival time and burst time
    processesInfo.sort((a, b) => a.arrivalTime - b.arrivalTime || a.burstTime - b.burstTime);
  
    // Initialize CPUs array with empty objects
    const CPUs = Array.from({ length: numOfCPUs }, () => ({
      finishTime: [],
      startTime: [],
      endTime: [],
      turnAroundTime: [],
    }));
  
    let finishTime = [];
  
    const solvedProcessesInfo = [];
    const readyQueues = Array.from({ length: numOfCPUs }, () => []);
    const finishedJobs = [];
  
    const startTime = [];
    const endTime = [];
    const turnAroundTime = [];
  
    for (let i = 0; i < processesInfo.length; i++) {
      const currentCPU = i % numOfCPUs;
  
      if (i === 0) {
        readyQueues[currentCPU].push(processesInfo[0]);
        finishTime.push(processesInfo[0].arrivalTime + processesInfo[0].burstTime);
        solvedProcessesInfo.push({
          ...processesInfo[0],
          ft: finishTime[0],
          tat: finishTime[0] - processesInfo[0].arrivalTime,
          wat: finishTime[0] - processesInfo[0].arrivalTime - processesInfo[0].burstTime,
        });
  
        processesInfo.forEach((p) => {
          if (p.arrivalTime <= finishTime[0] && !readyQueues[currentCPU].includes(p)) {
            readyQueues[currentCPU].push(p);
          }
        });
  
        readyQueues[currentCPU].shift();
        finishedJobs.push(processesInfo[0]);
      } else {
        if (
          readyQueues[currentCPU].length === 0 &&
          finishedJobs.length !== processesInfo.length
        ) {
          const unfinishedJobs = processesInfo
            .filter((p) => {
              return !finishedJobs.includes(p);
            })
            .sort((a, b) => {
              if (a.arrivalTime > b.arrivalTime) return 1;
              if (a.arrivalTime < b.arrivalTime) return -1;
              if (a.burstTime > b.burstTime) return 1;
              if (a.burstTime < b.burstTime) return -1;
              return 0;
            });
          readyQueues[currentCPU].push(unfinishedJobs[0]);
        }
  
        const rqSortedByBT = [...readyQueues[currentCPU]].sort((a, b) => {
          if (a.burstTime > b.burstTime) return 1;
          if (a.burstTime < b.burstTime) return -1;
          if (a.arrivalTime > b.arrivalTime) return 1;
          if (a.arrivalTime < b.arrivalTime) return -1;
          return 0;
        });
  
        const processToExecute = rqSortedByBT[0];
  
        const previousFinishTime = finishTime[finishTime.length - 1];
  
        if (processToExecute.arrivalTime > previousFinishTime) {
          finishTime.push(processToExecute.arrivalTime + processToExecute.burstTime);
          const newestFinishTime = finishTime[finishTime.length - 1];
        } else {
          finishTime.push(previousFinishTime + processToExecute.burstTime);
          const newestFinishTime = finishTime[finishTime.length - 1];
        }
  
        const newestFinishTime = finishTime[finishTime.length - 1];
  
        solvedProcessesInfo.push({
          ...processToExecute,
          ft: newestFinishTime,
          tat: newestFinishTime - processToExecute.arrivalTime,
          wat: newestFinishTime - processToExecute.arrivalTime - processToExecute.burstTime,
        });
  
        processesInfo.forEach((p) => {
          if (
            p.arrivalTime <= newestFinishTime &&
            !readyQueues[currentCPU].includes(p) &&
            !finishedJobs.includes(p)
          ) {
            readyQueues[currentCPU].push(p);
          }
        });
  
        const indexToRemove = readyQueues[currentCPU].indexOf(processToExecute);
        if (indexToRemove > -1) {
          readyQueues[currentCPU].splice(indexToRemove, 1);
        }
  
        finishedJobs.push(processToExecute);
      }
    }
  
    // Sort the processes by job name within arrival time
    solvedProcessesInfo.sort((obj1, obj2) => {
      if (obj1.arrivalTime > obj2.arrivalTime) return 1;
      if (obj1.arrivalTime < obj2.arrivalTime) return -1;
      if (obj1.job > obj2.job) return 1;
      if (obj1.job < obj2.job) return -1;
      return 0;
    });
  
    solvedProcessesInfo.forEach((element) => {
      startTime.push(element.ft - element.burstTime);
      endTime.push(element.ft);
      turnAroundTime.push(element.tat);
    });
  
    return { startTime, endTime, turnAroundTime };
}


function ScheduleJobs(jobType, processesInfo, numOfCPUs) {
 
  let count=processesInfo.length;
 
  let cpus = new Array(parseInt(numOfCPUs)).fill(0);

  let jobsData = []
  for(let i=0; i < numOfCPUs; i++) {
    jobsData.push([]);
  }

  let jobs = [];

  for (let i = 0; i < processesInfo.length; i++) {
    jobs.push({ process:processesInfo[i].process, arrivalTime: processesInfo[i].arrivalTime, burstTime: processesInfo[i].burstTime, "startTime": 0, "endTime": 0, "index": i+1, "jobFinished": false});
  }

  let jobQueue = [];
  let jobQueueAddedTime = new Set();

  let temp = 0;
  while(temp != count) {
        let cpuMinIndex = cpus.indexOf(Math.min(...cpus));

        let tempJob = [];
        for( let i = 0; i <  jobs.length; i++ ) {
            if(!jobs[i].jobFinished && jobs[i].arrivalTime <= cpus[cpuMinIndex]) {
                tempJob.push({ process:jobs[i].process, arrivalTime: jobs[i].arrivalTime, burstTime: jobs[i].burstTime, startTime: jobs[i].startTime, endTime: jobs[i].endTime, index:jobs[i].index+1, jobFinished: jobs[i].jobFinished });
            }
        }

        if(tempJob.length > 0 )
        {
    
          if(jobType=="FCFC")
          {
            // Sort jobs by arrival time
            tempJob.sort((a, b) => a.arrivalTime - b.arrivalTime);
          }
          else if(jobType=="SJF")
          {
            // Sort jobs by burst time
            tempJob.sort((a, b) => a.burstTime - b.burstTime);
          }
          
          let currJob = tempJob[0];
            
          const cpuIndex = cpus.indexOf(Math.min(...cpus));            
          const startTime = Math.max(cpus[cpuIndex], currJob.arrivalTime);            
          const endTime = startTime + currJob.burstTime;          
          const turnaroundTime = endTime - currJob.arrivalTime;        
          jobs[currJob.index-2].jobFinished = true;
          cpus[cpuIndex] = endTime;          

          if(!(jobQueueAddedTime.has(startTime))) {
            let tempjobQueue = {};
            tempjobQueue[startTime] = [];

            for(let i=0; i< tempJob.length; i++) {
              tempjobQueue[startTime].push(tempJob[i].index-1);
            }
            jobQueue.push(tempjobQueue);
          }
          jobQueueAddedTime.add(startTime);


            jobsData[cpuIndex].push({ process: currJob.index-1, arrivalTime:currJob.arrivalTime, burstTime:currJob.burstTime, startTime: startTime, endTime: endTime, turnaroundTime: turnaroundTime })
            temp++;
        }
        else {
            const cpuIndex = cpus.indexOf(Math.min(...cpus));
            cpus[cpuIndex]++;
        }
  }

  return {jobsData,jobQueue};

}


function displaychart(jobsData)
  {
    let jobData = []
    
  for (let i = 0; i < jobsData.length; i++) {
    const job = jobsData[i];
    for(let j=0;j<job.length;j++)
    {
      jobData.push({label:"CPU"+ String(i+1) , y:[job[j].startTime,job[j].endTime], process:"Process"+job[j].process})
    }
  }
   
  var chart = new CanvasJS.Chart("chartContainer",
                               {
  title: {
    text: "CPU Scheduling"
  },
  axisY: {
    minimum: 0,            
    interval: 10,
    labelFormatter: function(e){
      return e.value
    },
    gridThickness: 2
  },

  toolTip:{
    contentFormatter: function ( e ) {
      return "<strong>" + e.entries[0].dataPoint.process + "</strong></br> Start: " +  e.entries[0].dataPoint.y[0] + "</br>End : " +  e.entries[0].dataPoint.y[1];  
    }},

  data: [
    {
      type: "rangeBar",
      dataPoints:jobData
    }
  ]                      
});
chart.render();
}


  