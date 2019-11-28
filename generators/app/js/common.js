
'use strict';
const chalk = require('chalk');
const shell = require('shelljs');
const spinner = require('ora');
const fuzzy = require('fuzzy');

const CANCEL_OPTION =  {
    name : chalk.inverse('Cancel'),
    value : 'cancel'
};

const INFO = function(msg){ return chalk.blueBright(msg); }
const SUCCESS = function(msg){ return chalk.greenBright(msg); }
const WARNING = function(msg){ return chalk.yellowBright(msg); }
const ERROR = function(msg){ return chalk.redBright(msg); }

module.exports = {

    /**********
     * Get all SFDX commands from library
     * sfdx commands 
     * Parse as Json 
     * Return output as JSON object with all SFDX commands
     * *********/
    getSFDXCommands: function() {
        let output = {
            command:'',
            code:'',
            result:''
        };
        // starts loading
        this.loading = new spinner(
            { spinner:'dots',
              color : 'blue' }
          ).start(WARNING('start pulling sfdx commands...\n'));

        let sfdxCommand = ' sfdx commands --json';
            //storing command as output
            output.command = sfdxCommand;
        shell.echo( INFO('run : ' + output.command));
        let commandOutput = shell.exec(sfdxCommand, { silent: true } );
            // output code
            output.code = commandOutput.code;
        if(commandOutput.code === 0){
            // command output
            let sfdxCommandsOutput = JSON.parse( commandOutput.stdout );
            output.result = sfdxCommandsOutput;
            this.loading.succeed( SUCCESS('all commands were pulled successfully'));  
        }
        else {
            // command error output
            output.result = JSON.parse( commandOutput.stderr );
            this.loading.fail( ERROR('failed pulling commands')); 
        }
       return output;
    },
    runSFDXCommand: function(command) {
        let output = {
            command: command,
            code:'',
            result:''
        };
        // starts loading
        this.loading = new spinner(
            { spinner:'dots2',
              color : 'yellow' }
          ).start(WARNING('getting sfdx commands...\n'));

        shell.echo(INFO('run : ' + output.command));
        let commandOutput = shell.exec(command, { silent: true } );
            // output code
            output.code = commandOutput.code;
        if(commandOutput.code === 0){
            // command output
            try {
                output.result = JSON.parse( commandOutput.stdout );
            }
            catch (ev) {
                output.result = commandOutput.stdout;
            }
            this.loading.succeed( SUCCESS('command ran successfully'));  
        }
        else {
            // command error output
            output.result = JSON.parse( commandOutput.stderr );
            this.loading.fail( ERROR('command failed to execute')); 
        }
       return output;
    },
 /*******
  * Search Command by command value in all commands list given 
  *******/
    getCommandDescribe: function(commandName, commands){

        let commandObject = commands.find(command => command.value == commandName);

        let output = {
            details: commandObject.output,
            relatedFlags : [],
            defaultFlags : []
        };
        if(commandObject.output.flags){
            const commandFlags = commandObject.output.flags;
        
        for(const flag in commandFlags) {
            if(commandFlags.hasOwnProperty(flag)) {
              
              // undefined check and populate with 'name'
              if(!commandFlags[flag]['char'])
              commandFlags[flag]['char'] = '-'+commandFlags[flag]['name'];
                    // build options for command flags
                    const optionItem = {
                        name: ERROR('-'+commandFlags[flag]['char']) +' '+ commandFlags[flag]['description'],
                        value: '-'+commandFlags[flag]['char'],
                        type: commandFlags[flag]['type'],
                        description:commandFlags[flag]['description'],
                        disabled:commandFlags[flag]['required'],
                        short: commandFlags[flag]['name'],
                        default: commandFlags[flag]['default'],
                        options: commandFlags[flag]['options']
                    }
                    // assign defaults
                    if(commandFlags[flag]['required'] || commandFlags[flag]['name'] == 'json'){
                        output.defaultFlags.push('-'+commandFlags[flag]['char']);
                    }
                    // all command related flags
                    output.relatedFlags.push(optionItem);
            }
          }
        }
        return output;
    },

    searchByKey: function(input, searchList, key = 'name') {
        input = input || '';
        return new Promise(function(resolve) {
            var fuzzyResult = fuzzy.filter(input, searchList, {
              extract: function(item) {
                return item[key];
              }
            });

            var data = fuzzyResult.map(function(element) {
              return element.original;
            });
        resolve(data);
        });
    },

    createQuestions: function(selectedFlags,allFlags) {
        let questions = [];

        selectedFlags.forEach(flag => {
            const matchingFlag = allFlags.find(item => item.value == flag);
            let question = {};
            if(matchingFlag.type == 'option'){

              if(matchingFlag.options) {
                const flagOptionsValues = matchingFlag.options.map(opt => ({ name : opt, value : opt }));
              
                question = {
                  type: 'list',
                  name: matchingFlag.value,
                  message:matchingFlag.description,
                  default:matchingFlag.default,
                  choices: flagOptionsValues
                }
              }
              else {
                question = {
                  type: 'input',
                  name: matchingFlag.value,
                  message:matchingFlag.description,
                  default:matchingFlag.default,
                  validate: function(value){
                      return value ? true : 'Must enter a value';
                  }
                }
              }
               
              }
            else if(matchingFlag.type == 'boolean'){
               question = {
                type: 'confirm',
                name: matchingFlag.value,
                message:matchingFlag.description
              }
            }
            questions.push(question);
          });
          return questions;
    },

    open: function(path) {
        shell.exec(' open '+ path);
    },
    openCode: function(path) {
        shell.exec(' code '+ path);
    },
    sayText: function(textString) {
        shell.exec(' say \''+ textString + '\'');
    }
  }

