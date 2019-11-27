
'use strict';
const chalk = require('chalk');
const shell = require('shelljs');
const spinner = require('ora');
var fuzzy = require('fuzzy');

const CANCEL_OPTION =  {
    name : chalk.inverse('Cancel'),
    value : 'cancel'
};


module.exports = {
    getSFDXCommands: function() {
        let output = {
            command:'',
            code:'',
            result:''
        };
        this.loading = new spinner(
            { spinner:'monkey',
              color : 'yellow' }
          ).start('getting sfdx commands...\n');

        let sfdxCommand = ' sfdx commands --json';
        //storing command as output
            output.command = sfdxCommand;
        shell.echo(chalk.cyan('run : ' + output.command));
        let commandOutput = shell.exec(sfdxCommand, { silent: true } );
        // output code
            output.code = commandOutput.code;
        if(commandOutput.code === 0){
            let sfdxCommandsOutput = JSON.parse( commandOutput.stdout );
            output.result = sfdxCommandsOutput;
            this.loading.succeed(chalk.green('all SFDX commands were pulled successfully'));  
        }
        else {
            output.result = JSON.parse( commandOutput.stderr );
            this.loading.fail(chalk.redBright('failed pulling SFDX commands')); 
        }
       return output;
    },

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
                        name: chalk.redBright('-'+commandFlags[flag]['char']) +' '+ commandFlags[flag]['description'],
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

