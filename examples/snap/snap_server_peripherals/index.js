const os = require('os');
const net = require('net');
const nodeDiskInfo = require('node-disk-info');
const fs = require("fs");


exports.plugin = {
    title: "Server Information",
    desc: "Shows servers information",
    handler: async (req, res) => {
        if(req.get.mode == "stat")
        {
            getStat (req, res);
        }
        else
        {
            const _Html = fs.readFileSync(path.join(__dirname, 'html', 'index.html')).toString()
            const serverPerf = {
                date: new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }),
                cpu : os.cpus(),
                totalMem: os.totalmem(),
                freeMem: os.freemem(),
                usedMem : (os.totalmem() - os.freemem()),
                hostname: os.hostname(),
                serverVersion : os.release(),
                OS:os.version(),
                total_space: await nodeDiskInfo.getDiskInfo()
            } 
            let sumDisk = 0
            
            serverPerf.total_space.forEach((disk)=>  (sumDisk += disk._blocks))
            let totalDisk = (sumDisk*1.0E-9).toFixed(0)
            
            const Ul = `
            <div class="first">
            <ul>
              <li>Date: <p class="data">${serverPerf.date}</p></li>
              <li>HostName: <p class="data">${serverPerf.hostname}</p></li>
              <li>Processor: <p class="data">${serverPerf.cpu[0].model}</p></li>
              
            </ul>
          </div>
          <div class="second">
            <ul>
              <li>OS: <p class="data">${serverPerf.OS}<p class="data"></li>
              <li>ServerVersion: <p class="data">${serverPerf.serverVersion}</p></li>
              <li>Total Memory RAM: <p class="data">${(serverPerf.totalMem*1.0E-9).toFixed(0)} GB</p></li>
              <li>Total Space: <p class="data">${totalDisk}  GB</p></li>
            </ul>
          </div>`
          
            res.end(_Html.replace('__SERVER_INFO__', Ul))
        }
    }
}


async function getStat (req, res)
{
    const cpuStats = require('cpu-stats')
 
    cpuStats(1000, async function(error, cores) {
      
    let coreResponse = {}
   
      if(error) {
        return console.error('Oh noes!', error)
      }else{
        const response  = {
          disk: await nodeDiskInfo.getDiskInfo(),
          totalMem: (os.totalmem()*1.0E-9),
          usedMem: ((os.totalmem()*1.0E-9) - (os.freemem()*1.0E-9)),
          cores: coreResponse
      }
        cores.forEach((core,index)=>{
          coreResponse[index] = core.cpu.toFixed(0)
        })
        res.end(JSON.stringify(response))
      }  
    })
    
}
