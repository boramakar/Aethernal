const Discord = require("discord.js");
const fs = require("fs");

const config = require("./config");

const client = new Discord.Client();

const botOwner = config.owner;

console.log("config: ", config);

//functional vars
var gList = {};
var gData = {};
var totalCalls = 0;

//utility functions
/*function arrayToString (arr, delim) { //private
  console.log("array: ", arr);
  console.log("delim: ", delim);
  if (arr.length > 0) {
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
      result += delim + " " + arr[i];
    }
    console.log("result: ", result);
    return result;
  }
  else {
    return " ";
  }
}*/

/*let isRegion = (role) => { //private
  if (regions[guild].indexOf(role.toLowerCase()) !== -1) {
    return true;
  }
  return false;
}*/

/*var removeElement = (array, element) => {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}*/

function saveSettings (message) {
  console.log("function saveSettings");
  const content = JSON.stringify(gList);
  fs.writeFile("./settings.json", content, "utf8", function (err) {
    if (err) {
      console.log(err);
      message.channel.send("Error saving file: " + JSON.stringify(err));
    }
    else {
      console.log("Settings saved");
    }
  });
}

function loadSettings (message = " ") {
  console.log("function loadSettings");
  if(message === " ") {
    gList = require("./settings");
  }
  else {
    guild = message.guild;
    gList[guild] = {"mmQ": settings.mmQ, "regions": settings.regions, "mmTeams": settings.mmTeams, "adminRole": settings.adminRole, "prefix": settings.prefix, "teamSize": settings.teamSize};
  }
}

function isAdmin (roles) {
  console.log("function isAdmin");
  for (let i in roles) {
    for (let j in gData.adminRole) {
      if (roles[i] == gData.adminRole[j]) {
        return true;
      }
    }
  }
  return false;
}

function getEveryone(message) {
  console.log("function getEveryone");
  return message.guild.roles.find("name", "@everyone").id;
}

function createTeam (message, members) { //private (can be made public)
  console.log("function createTeam");
  teamId = gData.mmTeams.length;
  let guild = message.guild;
  let memberList = "";
  let roleName = "mm" + teamId.toString();
  //create temp role
  guild.createRole({'name': roleName, 'color': 'CYAN'})
  .then(function (role) {
    console.log("role: ", role);
    //create temp voice channel
    guild.createChannel(roleName, "voice")
    .then(function (channel) {
      console.log("channel: ", channel);
      //register team
      gData.mmTeams[teamId] = {"members": members, "name": roleName, "role": role.id, "channel": channel.id};
      //give members roles and prepare mentions
      console.log("members: ", members);
      for (let i = 0; i < members.length; i++) {
        message.guild.members.get(members[i]).addRole(role)
        .then()
        .catch(console.error);
      }
      channel.overwritePermissions(getEveryone(message), {CONNECT: false})
      .then()
      .catch(console.error);
      channel.overwritePermissions(role, {CONNECT: true})
      .then()
      .catch(console.error);

      message.channel.send("Team " + role + " with members <@" + members.join("> | <@") + "> is ready to roll out!");
      saveSettings(message);
    })
    .catch(console.error);
  })
  .catch(console.error);
}

function leaveQ (message, member, params) { //message, member id, queues to leave array
  console.log("function leaveQ");
  params == '' ? params = gData.regions : 0;
  let left = [];
  let fail = [];
  for (let i in params) {
    if (gData.mmQ[params[i]] != '') {
      for (let j in gData.mmQ[params[i]]) {
        if (gData.mmQ[params[i]][j] == member) {
          gData.mmQ[params[i]].splice(j, 1);
          left.push(params[i]);
        }
        else {
          fail.push(params[i]);
        }
      }
    }
  }
  if (left.length > 0) {
    message.channel.send(message.guild.members.get(member).displayName + " left queues: " + left.join(" | "));
  }
  else {
    message.channel.send(message.guild.members.get(member).displayName + " couldn't leave queues: " + left.join(" | "));
  }
}

function disband (message, team) {
  console.log("function disband");
  if (gData.mmTeams.indexOf(team) !== -1) {
    message.channel.send("Team doesn't exist: " + team);
  }
  else {
    if(gData.mmTeams == "") {
      message.channel.send("No teams to disband!");
    }
    else {
      for (let i in gData.mmTeams){
        if (gData.mmTeams[i].name == team.toLowerCase()) {
          if (typeof message.guild.roles.get(gData.mmTeams[i].role) != 'undefined') {
            message.guild.roles.get(gData.mmTeams[i].role).delete()
            .then()
            .catch(console.error);
          }
          if (typeof message.guild.channels.get(gData.mmTeams[i].channel) != 'undefined') {
            message.guild.channels.get(gData.mmTeams[i].channel).delete()
            .then()
            .catch(console.error);
          }
          gData.mmTeams.splice(i, 1);
          message.channel.send("Team disbanded: " + team);
          saveSettings(message);
        }
      }
    }
  }
}

//client functions
client.on("ready", () => {
  console.log("I am ready!");
  loadSettings();
});

client.on("message", (message) => {
  if (gList[message.guild] == undefined) {
    let guild = message.guild;
    console.log("First message from guild: ", message.guild.name);
    //initialize regions for guild
    gList[guild] = {"mmQ": {}, "regions": [], "mmTeams": [], "adminRole": [], "prefix": "a!", "teamSize": 0};

  }
  if (message.content.startsWith(gList[message.guild].prefix)) {
    totalCalls++;
    let guild = message.guild;
    let msg = message.content.substr(2);
    let params;
    message.content.indexOf(" ") !== -1 ? params = message.content.substr(message.content.indexOf(" ") + 1).split(" ") : params = "";
    //console.log("params: ", params);

    //init basic params
    gData = gList[guild];
    let prefix = gData.prefix;

    //hello
    if (msg.startsWith("o/") || msg.startsWith("hello")) {
      console.log("Executing ¯\\_(ツ)_/¯");
      message.channel.send("¯\\_(ツ)_/¯");
    }

    //LEAVEQ
    else if (msg.startsWith("leaveQ")) {
      console.log("Executing leaveQ");
      leaveQ(message, message.member.id, params);
    }

    //JOINQ
    else if (msg.startsWith("joinQ")) {
      console.log("Executing joinQ");
      let member = message.member;
      let qs = [];
      let rolesArr = member.roles.array();
      //console.log("member.roles: ", member.roles);
      //console.log("rolesArr: ", rolesArr);
      for (let role in rolesArr) {
        if(gData.regions.indexOf(rolesArr[role].name.toLowerCase()) !== -1) {
          qs.push(rolesArr[role].name.toLowerCase());
        }
      }
      if (params == "") {
        if (qs.length == 0) {
          if (typeof gData.regions == 'undefined') {
            message.channel.send("No regions available for queue!");
            return;
          }
          else {
            params = gData.regions;
          }
        }
        else {
          params = qs;
        }
      }
      let queues = [];
      let existing = [];
      let invalid = [];

      for (let i in params) {
        let role = params[i].toLowerCase();
        if(gData.regions.indexOf(role) !== -1){
          if (gData.mmQ[role].indexOf(member) == -1) {
            queues.push(role);
            gData.mmQ[role].push(member.id);
          }
          else {
            existing.push(role);
          }
        }
        else {
          invalid.push(role);
        }
      }

      if (queues.length > 0) {
        message.channel.send(member.displayName + " joined queue(s): " + queues.join(" | "));
      }

      if (existing.length > 0) {
        message.channel.send(member.displayName + " was already in queue(s): " + existing.join(" | "));
      }

      if (invalid.length > 0) {
        message.channel.send("Invalid queue(s): " + existing.join(" | "));
      }

      //check for full teams
      for (let i in params) {
        let role = params[i].toLowerCase();
        if(gData.mmQ[role].length == gData.teamSize) {
          let teamMembers = [];
          for (let i = 0; i < gData.teamSize; i++) {
            teamMembers.push(gData.mmQ[role][i]);
              leaveQ(message, gData.mmQ[role][i], gData.regions);
          }
          createTeam(message, teamMembers);
          gData.mmQ[role].splice(gData.teamSize);
        }
      }
    }

    //SHOWQ
    else if (msg.startsWith("showQ")) {
      console.log("Executing showQ");
      let result = "";
      let usernames = {};
      console.log("gData.mmQ: ", gData.mmQ);
      for (let i in gData.mmQ) {
        usernames[i] = [];
        for (let j in gData.mmQ[i]) {
          usernames[i][j] = message.guild.members.get(gData.mmQ[i][j]).displayName;
        }
      }
      for (let i in gData.mmQ) {
        if(usernames[i] != "") {
          result += i + " queue: " + usernames[i].join(" | ") + "\n";
        }
        else {
          result += i + " queue is empty!" + "\n";
        }
      }

      if (typeof result == 'undefined') {
        message.channel.send("No queues available!");
      }
      else {
        message.channel.send(result);
      }
    }

    //SHOWTEAMS
    else if (msg.startsWith("showTeams")) {
      console.log("Executing showTeams");
      if (gData.mmTeams.length > 0) {
        let result = "Current Teams:";
        for (let i in gData.mmTeams) {
          let members = "";
          for (let j in gData.mmTeams[i].members) {
            members +=  " " + message.guild.members.get(gData.mmTeams[i].members[j]).displayName;
          }
          members = members.substr(1);
          result += "\n```\nTeam Name: " + gData.mmTeams[i].name + "\nTeam Members: " + members + "\n```";
        }
        message.channel.send(result);
      }
      else {
        message.channel.send("No teams to show!");
      }
    }

    //CLEARQ
    else if (msg.startsWith("clearQ")) {
      console.log("Executing clearQ");
      let roles = message.member.roles.array();
      if(!isAdmin(roles) && message.member != message.guild.owner && message.author.id != botOwner){
        message.channel.send("You don't have permission to do this!");
      }
      else {
        if (params == "") {
          gData.mmQ = {};
          for (let i in gData.regions) {
            gData.mmQ[gData.regions[i]] = [];
          }
          message.channel.send("All queues cleared!");
        }
        else {
          let success = [];
          let fail = [];
          let result = "";
          for (let i in params) {
            if(typeof gData.mmQ[params[i]] != 'undefined') {
              gData.mmQ[params[i]] = [];
              success.push(params[i]);
            }
            else {
              fail.push(params[i]);
            }

            if (success.length > 0) {
              saveSettings(message);
              result += "Queues cleared: " + success.join(" ") + "\n";
            }

            if (fail.length > 0) {
              result += "Queues don't exist: " + fail.join(" ") + "\n";
            }

            message.channel.send(result);
          }
        }
      }
    }

    //CLEARTEAMS
    else if (msg.startsWith("clearTeams")) {
      console.log("Executing clearTeams");
      let roles = message.member.roles.array();
      if(!isAdmin(roles) && message.member != message.guild.owner && message.author.id != botOwner){
        message.channel.send("You don't have permission to do this!");
      }
      else {
        if (params == "") {
          gData.mmTeams = [];
          message.channel.send("All teams cleared!");
        }
        else {
          let success = [];
          let fail = [];
          let result = "";
          for (let i in params) {
            let del = false;
            for (let j in gData.mmTeams) {
              if(gData.mmTeams[j].name == params[i]) {
                gData.mmQ[params[i]] = [];
                success.push(params[i]);
                del = true;
              }
            }
            if (!del) {
              fail.push(params[i]);
            }
          }

          if (success.length > 0) {
            saveSettings(message);
            result += "Teams cleared: " + success.join(" ") + "\n";
          }

          if (fail.length > 0) {
            result += "Teams don't exist: " + fail.join(" ");
          }

          message.channel.send(result);
        }
      }
    }

    //DISBAND
    else if (msg.startsWith("disband")) {
      console.log("Executing disband");
      let roles = message.member.roles.array();
      let team = params[0];
      if(roles.indexOf(team) !== -1 && !isAdmin(roles) && message.member != message.guild.owner && message.author.id != botOwner){
        message.channel.send("You don't have permission to do this!");
      }
      else {
        if (params == "") {
          message.channel.send("Usage: " + prefix + "disband [team name]\nEx: " + prefix + " disband MM1");
        }
        else {
          disband(message, team);
        }
      }
    }

    //ADD REGION
    else if (msg.startsWith("addRegion")) {
      console.log("Executing addRegion");
      let roles = message.member.roles.array();
      if(!isAdmin(roles) && message.member != message.guild.owner && message.author.id != botOwner){
        message.channel.send("You don't have permission to do this!");
      }
      else {
        params == "" ? message.channel.send("You need to specify at least one region! ( Ex. " + prefix + "addRegion eu )") : 0;
        let fail = [];
        let success = [];
        let reply = "";
        for (let i in params) {
          if(gData.regions.indexOf(params[i]) == -1) {
            gData.regions.push(params[i]);
            gData.mmQ[params[i]] = [];
            success.push(params[i]);
          }
          else {
            fail.push(params[i]);
          }
        }

        if (success.length > 0) {
          saveSettings(message);
          reply += "Regions added: " + success.join(" | ") + "\n";
        }

        if (fail.length > 0) {
          reply += "Regions already existing: " + fail.join(" | ");
        }

        message.channel.send(reply);
      }
    }

    //REMOVE REGION
    else if (msg.startsWith("removeRegion")) {
      console.log("Executing removeRegion");
      let roles = message.member.roles.array();
      if(!isAdmin(roles) && message.member != message.guild.owner && message.author.id != botOwner){
        message.channel.send("You don't have permission to do this!");
      }
      else {
        params == "" ? message.channel.send("You need to specify at least one region! ( Ex. " + prefix + "addRegion eu )") : 0;
        let fail = [];
        let success = [];
        let reply = "";
        for (let i in params) {
          if(gData.regions.indexOf(params[i]) !== -1) {
            gData.regions.splice(gData.regions.indexOf(params[i]), 1);
            delete gData.mmQ[params[i]];
            success.push(params[i]);
          }
          else {
            fail.push(params[i]);
          }
        }

        if (success.length > 0) {
          saveSettings(message);
          reply += "Regions removed: " + success.join(" | ") + "\n";
        }

        if (fail.length > 0) {
          reply += "Regions didn't exist: " + fail.join(" | ");
        }

        message.channel.send(reply);
      }
    }

    //SHOW REGIONS
    else if (msg.startsWith("showRegions")) {
      console.log("Executing showRegions");
      if(gData.regions.length > 0) {
        message.channel.send("Current regions: " + gData.regions.join(" | "));
      }
      else {
        message.channel.send("No regions found!");
      }
    }

    //ADDADMIN
    else if (msg.startsWith("addAdmin")) {
      console.log("Executing addAdmin");
      if (message.member != message.guild.owner && message.author.id != config.owner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (params == "") {
          message.channel.send("You need to specify at least one role! ( Ex. " + prefix + ")")
        }
        else {
          let success = [];
          let fail = [];
          let reply = "";
          for (let i in params) {
            console.log("roles: ", message.guild.roles.array());
            if (message.guild.roles.exists("name", params[i]) !== -1) {
              gData.adminRole.push(params[i]);
              success.push(params[i]);
            }
            else {
              fail.push(params[i]);
            }
          }

          if (success.length > 0) {
            saveSettings(message);
            reply += "Admin role(s) added: " + success.join(" | ") + "\n";
          }

          if (fail.length > 0) {
            reply += "Role(s) don't exist: " + fail.join(" | ") + "\n";
          }

          message.channel.send(reply);
        }
      }
    }

    //REMOVEADMIN
    else if (msg.startsWith("removeAdmin")) {
      console.log("Executing removeAdmin");
      if (message.member != message.guild.owner && message.author.id != config.owner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (params == "") {
          message.channel.send("You need to specify at least one role! ( Ex. " + prefix + ")")
        }
        else {
          let success = [];
          let fail = [];
          let reply = "";
          for (let i in params) {
            if (gData.adminRole.indexOf(params[i]) !== -1) {
              gData.adminRole.splice(gData.adminRole.indexOf(params[i]));
              success.push(params[i]);
            }
            else {
              fail.push(params[i]);
            }
          }

          if (success.length > 0) {
            saveSettings(message);
            reply += "Admin role(s) removed: " + success.join(" | ") + "\n";
          }

          if (fail.length > 0) {
            reply += "Role(s) didn't have admin permission: " + fail.join(" | ") + "\n";
          }

          message.channel.send(reply);
        }
      }
    }

    //SHOWADMINS
    else if (msg.startsWith("showAdmins")) {
      console.log("Executing showAdmins");
      if(message.member != message.guild.owner && message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (gData.adminRole.length > 0) {
          message.channel.send("Current admin roles: " + gData.adminRole.join(" | "));
        }
        else {
          message.channel.send("No admin roles available!");
        }
      }
    }


    //TEAMSIZE
    else if (msg.startsWith("teamSize")) {
      console.log("Executing teamSize");
      let roles = message.member.roles.array();
      if(message.member != message.guild.owner && isAdmin(roles) && message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (params == "") {
          message.channel.send("Current team size: " + gData.teamSize);
        }
        else {
          gData.teamSize = params[0];
          saveSettings(message);
          message.channel.send("Team size set to: " + gData.teamSize);
        }
      }
    }

    //PREFIX
    else if (msg.startsWith("prefix")) {
      console.log("Executing prefix");
      if(message.member != message.guild.owner && message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (params == "") {
          message.channel.send("Current prefix: " + gData.prefix);
        }
        else {
          gData.prefix = params[0];
          saveSettings(message);
          message.channel.send("Prefix set to: " + gData.prefix);
        }
      }
    }

    //SAVE
    else if (msg.startsWith("save")) {
      console.log("Executing save");
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        saveSettings(message);
        message.channel.send("Settings saved");
      }
    }

    //LOAD
    else if (msg.startsWith("load")) {
      console.log("Executing load");
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        loadSettings();
        message.channel.send("Settings loaded");
      }
    }

    //TOTALCALLS
    else if (msg.startsWith("totalCalls")) {
      console.log("Executing totalCalls");
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        message.channel.send("Total calls: " + totalCalls);
      }
    }

    /*else if (msg.startsWith("find")) {
      console.log(getEveryone(message));
      message.channel.send(message.guild.roles.find("name", "@everyone").id);
    }*/

    else if (msg.startsWith("item")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        console.log(message.guild[params[0]].filterArray(function(item) {
          item[params[1]] == params[2];
        }));
      }
    }

    else if (msg.startsWith("roles")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        console.log(message.guild.roles);
      }
    }

    else if (msg.startsWith("channels")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        console.log(message.guild.channels);
      }
    }

    else if (msg.startsWith("findId")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (message.guild[params[0]].has(params[1])) {
          message.channel.send(message.guild[params[0]].get(params[1]).name)
        }
        else {
          message.channel.send(params[0] + " <" + params[1] + "> does not exist!");
        }
      }
    }

    else if (msg.startsWith("findName")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (message.guild[params[0]].exists("name", params[1])) {
          message.channel.send(message.guild[params[0]].find("name", params[1]).id)
        }
        else {
          message.channel.send(params[0] + " <" + params[1] + "> does not exist!");
        }
      }
    }

    else if (msg.startsWith("deleteId")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (message.guild[params[0]].has(params[1])) {
          message.guild[params[0]].get(params[1]).delete()
          .then()
          .catch(console.error);
        }
        else {
          message.channel.send(params[0] + " <" + params[1] + "> does not exist!");
        }
      }
    }

    else if (msg.startsWith("deleteName")) {
      if(message.author.id != botOwner) {
        message.channel.send("You don't have the permission to run this command!");
      }
      else {
        if (message.guild[params[0]].exists("name", params[1])) {
          message.guild[params[0]].find("name", params[1]).delete()
          .then()
          .catch(console.error);
        }
        else {
          message.channel.send(params[0] + " <" + params[1] + "> does not exist!");
        }
      }
    }

    else if (msg.startsWith("eval")) {
      if (message.author.id == config.owner) {
        message.channel.send("```\n" + eval(message.content.substr(message.content.indexOf(" ") + 1)) + "\n```");
      }
      else {
        message.channel.send("Please kindly fuck off...");
      }
    }
  }
});

client.login(config.token);
