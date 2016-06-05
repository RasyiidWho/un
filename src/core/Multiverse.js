'use strict';
const ControlServer = require('./ControlServer.js')
const ConfigService = require('./ConfigService.js');
const Commands = require('../modules/CommandList');
module.exports = class Multiverse {
  constructor(version) {
    this.servers = [];
    this.selected = [];
    this.version = version;
    this.whitelist = [];
    this.info = [];
    this.olddata = [];
    this.configService = new ConfigService()
    this.configService.load()
    this.banned = this.configService.getBanned();
    this.master = [];
    this.commands = Commands.multiverse;
    this.index = 0;
  }
  getInfo() {
    return this.info;
  }
  getNextId() {
    this.index ++;
    return this.index;
  }
  restart() {
    try {
    var serv = [];
    for (var i in this.servers) {
      var server = this.servers[i];
       if (!server) continue;
      if (server.name == this.selected.name) var s = true;
      else var s = false;
      var p = {
        name: server.name,
        port: server.port,
        gamemode: server.gamemode,
        isMaster: server.isMaster,
        selected: s,
      };
      serv.push(p);
    }
    this.stop();
    if (global.gc()) {
      console.log("[Console] Running garbage collect to reduce memory");
      global.gc();
    }
    
    this.configService.load();
    for (var i in serv) {
      var old = serv[i]
      if (old.selected) {
       var selected = this.create(old.name,old.isMaster,old.port,old.gamemode);
        if (selected) {
          
          this.selected = selected;
          console.log("[Console] Restarted and selected " + old.name);
        } else {
          console.log("[Console] Error in restarting server " + old.name);
        }
      } else {
        if (this.create(old.name,old.isMaster,old.port,old.gamemode)) {
        
          console.log("[Console] Restarted " + old.name);
        } else {
          console.log("[Console] Error in restarting server " + old.name);
        }
        
      }
    
    }
    
    return true;
    } catch (e) {
      console.log("[Console] Error in restarting:");
      console.log(e);
      return false;
      
    }
  }
  create(name,ismaster, port, gamemode, desc) {
    if (!this.servers[name]) {
    var l = new ControlServer(this.version,undefined, port,ismaster, name, this.configService, this.banned, gamemode);
    l.init();
    l.start();
    
      var i = {
      name: name,
      port: port,
      gamemode: gamemode,
      description: desc,
      isMaster: ismaster,
    }
    var id = this.getNextId();
    l.id = id;
    this.info[id] = i;
    this.servers[name] = l;
    return l;
    } else {
      return false;
    }
  
    
  }
  remove(name) {
   
     if (this.servers[name].name == name && !this.servers[name].isMaster && this.servers[name].name != this.selected.name) {
var index = this.servers[name].id;
if (index) {
    this.info.splice(index, 1);
}
this.servers[name].stop();
this.servers[name] = undefined;
      return true;
     }
   
   return false;
  }
  init() {
    this.selected = this.create("main", true);  
  }
  start() {
    
  }
  stop() {
    for (var i in this.servers) this.servers[i].stop();
    this.servers = [];
    this.selected = [];
    this.info = [];
  }
  getSelected() {
    return this.selected;
  }
  setSelected(a) {
    if (this.servers[a].name) {
    this.selected = this.servers[a];
    return true;
    } else {
      return false;
    }
  }
  getServers() {
    return this.servers;
  }
   prompt(in_) {
    let self = this;
    return function () {
      var col = '';
      try {
      if (self.selected.gameServer.red) {
      process.stdout.write("\x1b[31m\r");
    }
    if (self.selected.gameServer.green) {
      process.stdout.write("\x1b[32m\r");
    }
    if (self.selected.gameServer.blue) {
      process.stdout.write("\x1b[34m\r");
    }
    if (self.selected.gameServer.white) {
      process.stdout.write("\x1b[37m\r");
    }
    if (self.selected.gameServer.yellow) {
      process.stdout.write("\x1b[33m\r");
    }
    if (self.selected.gameServer.bold) {
      process.stdout.write("\x1b[1m\r");
    }
    if (self.selected.gameServer.dim) {
      process.stdout.write("\x1b[2m\r");
    }
      } catch (e) {
        console.log(e)
      }
      
      in_.question(">", function (str) {
        if (!self.selected) return;
        if (self.selected.gameServer.config.dev != 1) {
          try {
            self.parseCommands(str);
          } catch (err) {
            console.log("[\x1b[31mERROR\x1b[0m] Oh my, there seems to be an error with the command " + str);
            console.log("[\x1b[31mERROR\x1b[0m] Please alert AJS dev with this message:\n" + err);
          }
        } else {
          self.parseCommands(str); // dev mode, throw full error
        }
        // todo fix this
        return self.prompt(in_)(); // Too lazy to learn async
      });
    };
  }
   parseCommands(str) {
    // Log the string
    this.selected.gameServer.log.onCommand(str);

    // Don't process ENTER
    if (str === '')
      return;

    // Splits the string
    var split = str.split(" ");

    // Process the first string value
    var first = split[0].toLowerCase();

    // Get command function
     var execute = this.commands[first];
    if (typeof execute !== 'undefined') {
      execute(this, split);
    } else {
    var execute = this.selected.consoleService.commands[first];
    if (typeof execute !== 'undefined') {
      execute(this.selected.gameServer, split);
    } else {
      var execute = this.selected.gameServer.pluginCommands[first];
      if (typeof execute !== 'undefined') {
        execute(this.selected.gameServer, split);

      } else {
         
        console.log("[Console] Invalid Command, try \u001B[33mhelp\u001B[0m for a list of commands.");
      }
    }
  }
};
  }
